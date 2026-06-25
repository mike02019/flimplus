(function () {
    'use strict';

    /* ── CONFIG ─────────────────────────────────────────────────────────── */
    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyAtLmMjP9erQryr9-KtSl4MGoDMefjwlXk',
        authDomain: 'filmpluspro-fd8dd.firebaseapp.com',
        databaseURL: 'https://filmpluspro-fd8dd-default-rtdb.firebaseio.com',
        projectId: 'filmpluspro-fd8dd',
        storageBucket: 'filmpluspro-fd8dd.firebasestorage.app',
        messagingSenderId: '533291220327',
        appId: '1:533291220327:web:d78546974a26ca945203c2',
    };
    /* ───────────────────────────────────────────────────────────────────── */

    let db = null;
    let partyRef = null;
    let _listeners = [];
    let _heartbeat = null;

    let _clientId = null;
    let _isHost = false;
    let _partyId = null;
    let _suppressSync = false;
    let _joinTimestamp = 0;

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    function getPlayer() {
        return document.getElementById('partyMoviePlayer');
    }

    function getDisplayName() {
        try {
            const ud = JSON.parse(localStorage.getItem('userData'));
            if (ud && ud.name) return ud.name;
        } catch (_) { }
        return 'Guest';
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function initFirebase() {
        if (db) return;
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
        if (!window.firebase) throw new Error('Firebase SDK failed to load');
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.database();
    }

    function cleanupListeners() {
        _listeners.forEach(fn => { try { fn(); } catch (_) { } });
        _listeners = [];
    }

    /* ── Video sync ──────────────────────────────────────────────────────── */

    /**
     * HOST: writes the permanent /state node (paused + time) AND a /sync
     * one-shot event for guests already listening.
     */
    function pushSync(action, time, targetClientId) {
        if (!partyRef) return;
        const t = typeof time === 'number' ? time : 0;

        // Always keep /state up-to-date so late-joining guests can cold-read it
        partyRef.child('state').set({
            paused: action === 'pause',
            time: t,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
        });

        // Also fire the real-time sync event for guests already in the room
        const payload = {
            action,
            time: t,
            senderId: _clientId,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
        };
        if (targetClientId) payload.targetClientId = targetClientId;
        partyRef.child('sync').set(payload);
    }

    /**
     * Apply a sync command to the local player.
     * Waits for the video to have seeked to the right position before playing,
     * so autoplay-policy / buffering can't silently drop the play() call.
     */
    function applySync(data) {
        const player = getPlayer();
        if (!player) return;

        _suppressSync = true;

        const targetTime = typeof data.time === 'number' ? data.time : 0;
        const needsSeek = Math.abs(player.currentTime - targetTime) > 0.5;

        function doAfterSeek() {
            if (data.action === 'play') {
                // Use a promise so we can retry if the browser blocks autoplay
                const p = player.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {
                        // Autoplay blocked — show a visual nudge and retry on next
                        // user interaction (the 'click' listener below handles this)
                        if (typeof setPartySyncStatus === 'function') {
                            setPartySyncStatus('▶ Click to resume (autoplay blocked)', 'warn');
                        }
                        // Store the target so the one-time click handler can resume
                        player._pendingPlay = true;
                    });
                }
            } else if (data.action === 'pause') {
                player.pause();
            }
            setTimeout(() => { _suppressSync = false; }, 400);
        }

        if (needsSeek) {
            // Seek first, then act after the seeked event fires
            const onSeeked = () => {
                player.removeEventListener('seeked', onSeeked);
                doAfterSeek();
            };
            player.addEventListener('seeked', onSeeked);
            player.currentTime = targetTime;
        } else {
            doAfterSeek();
        }
    }

    // One-time click listener: resumes a pending play that was blocked by autoplay policy
    document.addEventListener('click', function resumeOnClick() {
        const player = getPlayer();
        if (player && player._pendingPlay) {
            player._pendingPlay = false;
            player.play().catch(() => { });
            if (typeof setPartySyncStatus === 'function') {
                setPartySyncStatus('Synced with host ✓', 'good');
            }
        }
    });

    /* ── Main setup ──────────────────────────────────────────────────────── */

    async function startFirebaseParty(movie, partyId, hostMode) {
        _partyId = partyId;
        _isHost = hostMode;
        _clientId = 'c-' + Math.random().toString(36).slice(2, 10);
        _joinTimestamp = Date.now();

        window.isHost = hostMode;
        window.currentPartyId = partyId;

        if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Connecting…', 'neutral');

        try {
            await initFirebase();
        } catch (err) {
            console.error('[WatchParty] Firebase init failed:', err);
            if (typeof setPartySyncStatus === 'function') {
                setPartySyncStatus('Firebase failed — check console', 'warn');
            }
            return;
        }

        partyRef = db.ref('parties/' + partyId);
        cleanupListeners();

        // ── ABR quality monitor: give it the Firebase reference ──
        if (window.filmPlusABR) window.filmPlusABR.setPartyRef(partyRef);

        /* ── Member presence ─────────────────────────────────────────── */
        const memberRef = partyRef.child('members/' + _clientId);
        memberRef.set({
            username: getDisplayName(),
            role: hostMode ? 'host' : 'guest',
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
        });
        memberRef.onDisconnect().remove();

        const membersRef = partyRef.child('members');
        const membersCb = membersRef.on('value', snap => {
            const members = [];
            snap.forEach(child => members.push({ clientId: child.key, ...child.val() }));
            if (typeof updateMemberCount === 'function') updateMemberCount(members);
        });
        _listeners.push(() => membersRef.off('value', membersCb));

        /* ── HOST setup ──────────────────────────────────────────────── */
        if (hostMode) {
            // Write initial state immediately so guests can cold-read it on join
            const player = getPlayer();
            const initialTime = (player && !isNaN(player.currentTime)) ? player.currentTime : 0;
            partyRef.child('state').set({
                paused: true,
                time: initialTime,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
            });

            // Clear stale ended flag
            partyRef.child('ended').remove();

            // Listen for join requests.
            // When the video is playing we do a brief "sync-pause":
            //   1. Pause the host video (suppressed so it won't re-broadcast a generic pause)
            //   2. Capture the exact frozen timestamp
            //   3. Send that timestamp + a "play" command to the joining guest only
            //   4. Resume the host video after a short delay (~600 ms)
            // This guarantees the guest starts from the exact same frame the host is on.
            const joinRef = partyRef.child('joinRequests');
            const joinCb = joinRef.on('child_added', snap => {
                const data = snap.val();
                if (!data) return;
                const p = getPlayer();

                if (p) {
                    const wasPlaying = !p.paused;

                    if (wasPlaying) {
                        // ── Sync-pause: freeze briefly so the timestamp is stable ──
                        _suppressSync = true;
                        p.pause();

                        // Give the browser one tick to commit currentTime after pause
                        setTimeout(() => {
                            const frozenTime = p.currentTime;

                            // 1. Send a pause at the frozen time so the guest seeks there first
                            pushSync('pause', frozenTime, data.clientId);

                            // 2. After a short moment, send play from the same frozen time
                            //    The host will also resume at roughly the same instant
                            setTimeout(() => {
                                // Resume the host
                                _suppressSync = true;
                                p.play().catch(() => { });
                                setTimeout(() => { _suppressSync = false; }, 400);

                                // Tell the guest to play from that exact frame
                                pushSync('play', frozenTime, data.clientId);
                            }, 500); // 500 ms is imperceptible to the host but enough for the guest to seek

                        }, 80); // 80 ms tick for currentTime to settle after pause

                    } else {
                        // Video was already paused — just send current state directly
                        pushSync('pause', p.currentTime, data.clientId);
                    }
                }

                if (typeof addChatMessage === 'function') {
                    addChatMessage('System', (data.user || 'Guest') + ' joined the party 🎉', 0, false, true);
                }
                snap.ref.remove();
            });
            _listeners.push(() => joinRef.off('child_added', joinCb));

            // Heartbeat every 2 s — keeps late joiners or drift-prone browsers in sync
            _heartbeat = setInterval(() => {
                const p = getPlayer();
                if (p && !_suppressSync) {
                    pushSync(p.paused ? 'pause' : 'play', p.currentTime);
                }
            }, 2000);
        }

        /* ── GUEST setup ─────────────────────────────────────────────── */
        if (!hostMode) {
            // ── STEP 1: Cold-read /state immediately so the guest syncs
            //    without waiting for the host to play/pause.
            partyRef.child('state').once('value', snap => {
                const state = snap.val();
                if (!state) return;

                const player = getPlayer();
                if (!player) return;

                // Wait for enough metadata to allow seeking
                function applyInitialState() {
                    applySync({
                        action: state.paused ? 'pause' : 'play',
                        time: state.time || 0,
                    });
                    if (typeof setPartySyncStatus === 'function') {
                        setPartySyncStatus('Synced with host ✓', 'good');
                    }
                }

                if (player.readyState >= 1) {
                    // Metadata already available — seek straight away
                    applyInitialState();
                } else {
                    // Wait for loadedmetadata before seeking
                    player.addEventListener('loadedmetadata', function onMeta() {
                        player.removeEventListener('loadedmetadata', onMeta);
                        applyInitialState();
                    });
                }
            });

            // ── STEP 2: Watch /sync for live play/pause/seek events from host
            const syncRef = partyRef.child('sync');
            const syncCb = syncRef.on('value', snap => {
                const data = snap.val();
                if (!data || data.senderId === _clientId) return;
                if (data.targetClientId && data.targetClientId !== _clientId) return;
                applySync(data);
                if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Synced with host ✓', 'good');
            });
            _listeners.push(() => syncRef.off('value', syncCb));

            // ── STEP 3: Register join request so host can send a targeted sync
            partyRef.child('joinRequests/' + _clientId).set({
                clientId: _clientId,
                user: getDisplayName(),
                requestedAt: firebase.database.ServerValue.TIMESTAMP,
            });

            // ── STEP 4: Listen for party-ended signal
            const endedRef = partyRef.child('ended');
            const endedCb = endedRef.on('value', snap => {
                if (!snap.val()) return;
                if (typeof addChatMessage === 'function') {
                    addChatMessage('System', 'The host has ended the watch party. 👋', 0, false, true);
                }
                if (typeof setPartySyncStatus === 'function') {
                    setPartySyncStatus('Party ended by host', 'warn');
                }
                setTimeout(() => {
                    if (typeof hideWatchPartyModal === 'function') hideWatchPartyModal();
                }, 2500);
            });
            _listeners.push(() => endedRef.off('value', endedCb));
        }

        /* ── Chat listener ───────────────────────────────────────────── */
        const chatRef = partyRef.child('chat').orderByChild('sentAt').startAt(_joinTimestamp);
        const chatCb = chatRef.on('child_added', snap => {
            const d = snap.val();
            if (!d || d.senderId === _clientId) return;

            // Voice note from another user
            if (d.isVoiceNote && d.audioData) {
                if (typeof window.addVoiceBubble === 'function') {
                    window.addVoiceBubble(d.user || 'Guest', d.audioData, d.duration || 0, false);
                }
                return;
            }

            if (typeof addChatMessage === 'function') {
                addChatMessage(d.user || 'Guest', d.message || '', d.timestamp || 0, false, d.isSystem || false);
            }
        });
        _listeners.push(() => chatRef.off('child_added', chatCb));

        /* ── Reaction listener ───────────────────────────────────────── */
        const reactRef = partyRef.child('reactions').orderByChild('sentAt').startAt(_joinTimestamp);
        const reactCb = reactRef.on('child_added', snap => {
            const d = snap.val();
            if (!d || d.senderId === _clientId) return;
            if (typeof addPartyReaction === 'function') {
                addPartyReaction(d.user, d.reaction, d.time);
            }
        });
        _listeners.push(() => reactRef.off('child_added', reactCb));

        if (typeof setPartySyncStatus === 'function') {
            setPartySyncStatus(
                hostMode ? 'Live — share your link' : 'Joining — syncing…',
                hostMode ? 'good' : 'neutral'
            );
        }
    }

    /* ── End-party (host only) ──────────────────────────────────────────── */
    window.endWatchParty = function () {
        if (!_isHost || !partyRef) return;
        partyRef.child('chat').push({
            user: 'System',
            message: '🛑 The host has ended the watch party.',
            timestamp: 0,
            sentAt: firebase.database.ServerValue.TIMESTAMP,
            senderId: _clientId,
            isSystem: true,
        });
        partyRef.child('ended').set({
            endedAt: firebase.database.ServerValue.TIMESTAMP,
            endedBy: _clientId,
        }).then(() => {
            setTimeout(() => {
                if (typeof hideWatchPartyModal === 'function') hideWatchPartyModal();
            }, 400);
        });
    };

    /* ── Guest pause error toast ─────────────────────────────────────────── */

    function showGuestPauseError() {
        // Use setPartySyncStatus for the sync badge if available
        if (typeof setPartySyncStatus === 'function') {
            setPartySyncStatus('Only the host can pause ⛔', 'warn');
            // Reset back to "Synced" after 3 seconds
            setTimeout(() => setPartySyncStatus('Synced with host ✓', 'good'), 3000);
        }

        // Also show a prominent floating toast so the message is hard to miss
        const existing = document.getElementById('_wpGuestPauseToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = '_wpGuestPauseToast';
        toast.setAttribute('role', 'alert');
        toast.style.cssText = [
            'position:fixed',
            'top:50%',
            'left:50%',
            'transform:translate(-50%,-50%)',
            'z-index:99999',
            'background:linear-gradient(135deg,#1c1c28,#14141c)',
            'border:1.5px solid rgba(255,44,31,0.55)',
            'box-shadow:0 0 40px rgba(255,44,31,0.25),0 16px 48px rgba(0,0,0,0.7)',
            'border-radius:16px',
            'padding:22px 28px',
            'max-width:320px',
            'width:calc(100vw - 48px)',
            'text-align:center',
            'font-family:Poppins,DM Sans,sans-serif',
            'animation:_wpToastIn 0.28s cubic-bezier(0.34,1.2,0.64,1) both',
            'pointer-events:none',
        ].join(';');

        toast.innerHTML = `
            <style>
                @keyframes _wpToastIn {
                    from { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
                    to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
                }
                @keyframes _wpToastOut {
                    from { opacity:1; transform:translate(-50%,-50%) scale(1); }
                    to   { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
                }
            </style>
            <div style="font-size:2rem;margin-bottom:10px">⛔</div>
            <div style="color:#ff6b60;font-weight:700;font-size:1rem;margin-bottom:6px;letter-spacing:-0.01em;">
                Only the host can pause
            </div>
            <div style="color:rgba(240,240,245,0.65);font-size:0.82rem;line-height:1.5;">
                Ask the host to pause the movie for everyone.<br>The video will keep playing for now.
            </div>
        `;

        document.body.appendChild(toast);

        // Also post a chat system message so everyone sees the attempt
        if (typeof addChatMessage === 'function') {
            addChatMessage('System', '⛔ Only the host can pause. Ask them to pause for everyone.', 0, false, true);
        }

        // Fade out and remove after 3 s
        setTimeout(() => {
            toast.style.animation = '_wpToastOut 0.25s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 260);
        }, 3000);
    }

    /* ── Public API overrides ────────────────────────────────────────────── */

    window.setupWatchParty = async function (movie, partyId, hostMode) {
        if (typeof showWatchPartyModal === 'function') showWatchPartyModal(movie, partyId, hostMode);
        if (typeof setupChatHandling === 'function') setupChatHandling();

        // Bind video events for the host — these broadcast to Firebase in real-time
        const player = getPlayer();
        if (player) {
            player.onplay = () => {
                if (_isHost && !_suppressSync) pushSync('play', player.currentTime);
            };
            player.onpause = () => {
                if (!_isHost && !_suppressSync) {
                    // Guest tried to pause — immediately resume and notify them
                    _suppressSync = true;
                    player.play().catch(() => { });
                    setTimeout(() => { _suppressSync = false; }, 400);
                    showGuestPauseError();
                    return;
                }
                if (_isHost && !_suppressSync) pushSync('pause', player.currentTime);
            };
            player.onseeked = () => {
                if (_isHost && !_suppressSync) pushSync('seek', player.currentTime);
            };
        }

        await startFirebaseParty(movie, partyId, hostMode);
    };

    window.sendPartyEvent = function (type, payload) {
        if (!partyRef) return;

        if (type === 'chat-message') {
            partyRef.child('chat').push({
                user: payload.user || getDisplayName(),
                message: payload.message || '',
                timestamp: payload.timestamp || 0,
                sentAt: firebase.database.ServerValue.TIMESTAMP,
                senderId: _clientId,
            });
            return;
        }

        if (type === 'voice-note') {
            partyRef.child('chat').push({
                user: payload.user || getDisplayName(),
                message: '',
                isVoiceNote: true,
                audioData: payload.audioData || '',
                duration: payload.duration || 0,
                timestamp: 0,
                sentAt: firebase.database.ServerValue.TIMESTAMP,
                senderId: _clientId,
            });
            return;
        }

        if (type === 'party-reaction') {
            partyRef.child('reactions').push({
                user: payload.user || getDisplayName(),
                reaction: payload.reaction || '',
                time: payload.time || 0,
                sentAt: firebase.database.ServerValue.TIMESTAMP,
                senderId: _clientId,
            });
            return;
        }

        if (type === 'video-sync' && _isHost) {
            pushSync(payload.action, payload.time, payload.targetClientId);
        }
    };

    window.broadcastVideoSync = function (action, time) {
        if (!_isHost || _suppressSync) return;
        pushSync(action, time);
    };

    const _origHide = window.hideWatchPartyModal;
    window.hideWatchPartyModal = function () {
        clearInterval(_heartbeat);
        _heartbeat = null;
        cleanupListeners();

        // ── Stop ABR quality monitoring when the party closes ──
        if (window.filmPlusABR) window.filmPlusABR.stop();

        if (partyRef && _clientId) {
            partyRef.child('members/' + _clientId).remove();
        }

        const badge = document.getElementById('partyMemberCount');
        if (badge) badge.remove();

        partyRef = null;
        _partyId = null;
        _isHost = false;
        _clientId = null;
        window.isHost = false;
        window.currentPartyId = null;

        if (typeof _origHide === 'function') _origHide();
    };

    console.log('[WatchParty] Firebase watch party loaded — instant sync enabled.');
})();