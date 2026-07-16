/* ══════════════════════════════════════════════════════════════════════════
   uploadparty.js  |  Film+ Upload Party — Firebase-powered
   
   HOW IT WORKS
   ─────────────
   HOST flow:
     1. Page loads → show lobby (file picker).
     2. Host picks a video file.
     3. File is uploaded to Firebase Storage under parties/<id>/video.
     4. Upload progress is shown in the lobby.
     5. After upload, the host sees the party screen and can play the video.
     6. Firebase Realtime DB is used for video sync (same mechanism as
        watchparty.js), member presence, chat, reactions.
     7. The DB node parties/<id>/video stores { storageUrl, title, ready }.
        Guests watching /video will get the URL as soon as it's available.

   GUEST flow:
     1. Page loads with ?party=ID → show "waiting" screen.
     2. Guest listens to parties/<id>/video for { ready: true, storageUrl }.
     3. Once ready, guest transitions to the party screen with that URL as src.
     4. Standard sync logic (same as watchparty.js) keeps playback locked.

   CLEANUP:
     On party end, the host sets parties/<id>/ended.
     Guests detect this and redirect to index.html.
     The host's video file is NOT auto-deleted (Firebase Storage needs Admin
     SDK for that). The host can delete it from the Firebase console.
══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── FIREBASE CONFIG (same project as watchparty.js) ──────────────── */
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

    /* ── State ───────────────────────────────────────────────────────────── */
    let db = null;
    let storage = null;
    let partyRef = null;
    let _listeners = [];
    let _heartbeat = null;
    let _clientId = null;
    let _isHost = false;
    let _partyId = null;
    let _suppressSync = false;
    let _joinTimestamp = 0;

    /* ── Grab globals injected by uploadparty.html ───────────────────────── */
    const _hostMode = window._upHostMode;
    const _player = window._upPlayer;

    /* ── SDK loader ──────────────────────────────────────────────────────── */
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
        if (db && storage) return;
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js');
        if (!window.firebase) throw new Error('Firebase SDK failed to load');
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
        storage = firebase.storage();
    }

    /* ── Helpers ─────────────────────────────────────────────────────────── */
    function getPlayer() { return document.getElementById('partyMoviePlayer'); }

    function getDisplayName() {
        try {
            const ud = JSON.parse(localStorage.getItem('userData'));
            if (ud && ud.name) return ud.name;
        } catch (_) { }
        return 'Guest';
    }

    function cleanupListeners() {
        _listeners.forEach(fn => { try { fn(); } catch (_) { } });
        _listeners = [];
    }

    /* ── UI transitions ──────────────────────────────────────────────────── */
    function showLobby() { document.getElementById('upLobby').hidden = false; document.getElementById('upWaiting').hidden = true; document.getElementById('wpStage').style.display = 'none'; }
    function showWaiting() { document.getElementById('upLobby').hidden = true; document.getElementById('upWaiting').hidden = false; document.getElementById('wpStage').style.display = 'none'; }
    function showStage() { document.getElementById('upLobby').hidden = true; document.getElementById('upWaiting').hidden = true; document.getElementById('wpStage').style.display = ''; }

    /* ── Video sync (identical logic to watchparty.js) ───────────────────── */
    function pushSync(action, time, targetClientId) {
        if (!partyRef) return;
        const t = typeof time === 'number' ? time : 0;
        partyRef.child('state').set({
            paused: action === 'pause',
            time: t,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
        });
        const payload = {
            action,
            time: t,
            senderId: _clientId,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
        };
        if (targetClientId) payload.targetClientId = targetClientId;
        partyRef.child('sync').set(payload);
    }

    function applySync(data) {
        const player = getPlayer();
        if (!player) return;
        _suppressSync = true;
        const targetTime = typeof data.time === 'number' ? data.time : 0;
        const needsSeek = Math.abs(player.currentTime - targetTime) > 0.5;

        function doAfterSeek() {
            if (data.action === 'play') {
                const p = player.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {
                        if (typeof setPartySyncStatus === 'function')
                            setPartySyncStatus('▶ Click to resume (autoplay blocked)', 'warn');
                        player._pendingPlay = true;
                    });
                }
            } else if (data.action === 'pause') {
                player.pause();
            }
            setTimeout(() => { _suppressSync = false; }, 400);
        }

        if (needsSeek) {
            const onSeeked = () => { player.removeEventListener('seeked', onSeeked); doAfterSeek(); };
            player.addEventListener('seeked', onSeeked);
            player.currentTime = targetTime;
        } else {
            doAfterSeek();
        }
    }

    document.addEventListener('click', function resumeOnClick() {
        const player = getPlayer();
        if (player && player._pendingPlay) {
            player._pendingPlay = false;
            player.play().catch(() => { });
            if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Synced with host ✓', 'good');
        }
    });

    /* ── Guest pause blocker ─────────────────────────────────────────────── */
    function showGuestPauseError() {
        if (typeof setPartySyncStatus === 'function') {
            setPartySyncStatus('Only the host can pause ⛔', 'warn');
            setTimeout(() => setPartySyncStatus('Synced with host ✓', 'good'), 3000);
        }
        const existing = document.getElementById('_upGuestPauseToast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = '_upGuestPauseToast';
        toast.setAttribute('role', 'alert');
        toast.style.cssText = [
            'position:fixed', 'top:50%', 'left:50%',
            'transform:translate(-50%,-50%)', 'z-index:99999',
            'background:linear-gradient(135deg,#1c1c28,#14141c)',
            'border:1.5px solid rgba(255,44,31,0.55)',
            'box-shadow:0 0 40px rgba(255,44,31,0.25),0 16px 48px rgba(0,0,0,0.7)',
            'border-radius:16px', 'padding:22px 28px', 'max-width:320px',
            'width:calc(100vw - 48px)', 'text-align:center',
            'font-family:Poppins,DM Sans,sans-serif',
            'animation:_upToastIn 0.28s cubic-bezier(0.34,1.2,0.64,1) both',
            'pointer-events:none',
        ].join(';');
        toast.innerHTML = `
            <style>
                @keyframes _upToastIn  { from{opacity:0;transform:translate(-50%,-50%) scale(.88)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
                @keyframes _upToastOut { from{opacity:1;transform:translate(-50%,-50%) scale(1)} to{opacity:0;transform:translate(-50%,-50%) scale(.88)} }
            </style>
            <div style="font-size:2rem;margin-bottom:10px">⛔</div>
            <div style="color:#ff6b60;font-weight:700;font-size:1rem;margin-bottom:6px">Only the host can pause</div>
            <div style="color:rgba(240,240,245,.65);font-size:.82rem;line-height:1.5">Ask the host to pause for everyone.</div>`;
        document.body.appendChild(toast);
        if (typeof addChatMessage === 'function') {
            addChatMessage('System', '⛔ Only the host can pause. Ask them to pause for everyone.', 0, false, true);
        }
        setTimeout(() => {
            toast.style.animation = '_upToastOut 0.25s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 260);
        }, 3000);
    }

    /* ── Bind host video events ──────────────────────────────────────────── */
    function bindHostVideoEvents() {
        const player = getPlayer();
        if (!player) return;
        player.onplay = () => { if (_isHost && !_suppressSync) pushSync('play', player.currentTime); };
        player.onpause = () => {
            if (!_isHost && !_suppressSync) {
                _suppressSync = true;
                player.play().catch(() => { });
                setTimeout(() => { _suppressSync = false; }, 400);
                showGuestPauseError();
                return;
            }
            if (_isHost && !_suppressSync) pushSync('pause', player.currentTime);
        };
        player.onseeked = () => { if (_isHost && !_suppressSync) pushSync('seek', player.currentTime); };
    }

    /* ── Firebase party room setup ───────────────────────────────────────── */
    async function startFirebaseRoom(partyId, isHost, videoUrl, title) {
        _partyId = partyId;
        _isHost = isHost;
        _clientId = 'c-' + Math.random().toString(36).slice(2, 10);
        _joinTimestamp = Date.now();

        window.isHost = isHost;
        window.currentPartyId = partyId;

        if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Connecting…', 'neutral');

        try {
            await initFirebase();
        } catch (err) {
            console.error('[UploadParty] Firebase init failed:', err);
            if (typeof setPartySyncStatus === 'function')
                setPartySyncStatus('Firebase failed — check console', 'warn');
            return;
        }

        // ── Correct _joinTimestamp for client/server clock drift ──
        // Date.now() is the DEVICE clock, but chat/reaction messages are
        // stamped with the SERVER clock (ServerValue.TIMESTAMP). If a
        // device's clock is even a little fast, _joinTimestamp ends up
        // ahead of the server's real time and every message sent for a
        // while afterwards gets silently filtered out by startAt() below.
        // Firebase exposes the live offset at /.info/serverTimeOffset —
        // read it once and fold it in. A small safety buffer is
        // subtracted so messages sent right around join time aren't lost
        // to network latency either.
        try {
            const offsetSnap = await db.ref('.info/serverTimeOffset').once('value');
            const offset = offsetSnap.val() || 0;
            _joinTimestamp = Date.now() + offset - 3000;
        } catch (_) {
            _joinTimestamp = Date.now() - 3000;
        }

        partyRef = db.ref('uploadParties/' + partyId);
        cleanupListeners();

        /* Member presence */
        const memberRef = partyRef.child('members/' + _clientId);
        memberRef.set({
            username: getDisplayName(),
            role: isHost ? 'host' : 'guest',
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

        /* ── HOST-only setup ── */
        if (isHost) {
            const player = getPlayer();
            const initialTime = (player && !isNaN(player.currentTime)) ? player.currentTime : 0;
            partyRef.child('state').set({ paused: true, time: initialTime, updatedAt: firebase.database.ServerValue.TIMESTAMP });
            partyRef.child('ended').remove();

            /* Sync-on-join */
            const joinRef = partyRef.child('joinRequests');
            const joinCb = joinRef.on('child_added', snap => {
                const data = snap.val();
                if (!data) return;
                const p = getPlayer();
                if (p) {
                    const wasPlaying = !p.paused;
                    if (wasPlaying) {
                        _suppressSync = true;
                        p.pause();
                        setTimeout(() => {
                            const frozenTime = p.currentTime;
                            pushSync('pause', frozenTime, data.clientId);
                            setTimeout(() => {
                                _suppressSync = true;
                                p.play().catch(() => { });
                                setTimeout(() => { _suppressSync = false; }, 400);
                                pushSync('play', frozenTime, data.clientId);
                            }, 500);
                        }, 80);
                    } else {
                        pushSync('pause', p.currentTime, data.clientId);
                    }
                }
                if (typeof addChatMessage === 'function') {
                    addChatMessage('System', (data.user || 'Guest') + ' joined the party 🎉', 0, false, true);
                }
                snap.ref.remove();
            });
            _listeners.push(() => joinRef.off('child_added', joinCb));

            _heartbeat = setInterval(() => {
                const p = getPlayer();
                if (p && !_suppressSync) pushSync(p.paused ? 'pause' : 'play', p.currentTime);
            }, 2000);
        }

        /* ── GUEST-only setup ── */
        if (!isHost) {
            partyRef.child('state').once('value', snap => {
                const state = snap.val();
                if (!state) return;
                const player = getPlayer();
                if (!player) return;
                function applyInitialState() {
                    applySync({ action: state.paused ? 'pause' : 'play', time: state.time || 0 });
                    if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Synced with host ✓', 'good');
                }
                if (player.readyState >= 1) {
                    applyInitialState();
                } else {
                    player.addEventListener('loadedmetadata', function onMeta() {
                        player.removeEventListener('loadedmetadata', onMeta);
                        applyInitialState();
                    });
                }
            });

            const syncRef = partyRef.child('sync');
            const syncCb = syncRef.on('value', snap => {
                const data = snap.val();
                if (!data || data.senderId === _clientId) return;
                if (data.targetClientId && data.targetClientId !== _clientId) return;
                applySync(data);
                if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Synced with host ✓', 'good');
            });
            _listeners.push(() => syncRef.off('value', syncCb));

            partyRef.child('joinRequests/' + _clientId).set({
                clientId: _clientId,
                user: getDisplayName(),
                requestedAt: firebase.database.ServerValue.TIMESTAMP,
            });

            /* Party-ended signal */
            const endedRef = partyRef.child('ended');
            const endedCb = endedRef.on('value', snap => {
                if (!snap.val()) return;
                if (typeof addChatMessage === 'function')
                    addChatMessage('System', 'The host has ended the watch party. 👋', 0, false, true);
                if (typeof setPartySyncStatus === 'function')
                    setPartySyncStatus('Party ended by host', 'warn');
                setTimeout(() => {
                    if (typeof hideWatchPartyModal === 'function') hideWatchPartyModal();
                }, 2500);
            });
            _listeners.push(() => endedRef.off('value', endedCb));
        }

        /* ── Chat listener ── */
        const chatRef = partyRef.child('chat').orderByChild('sentAt').startAt(_joinTimestamp);
        const chatCb = chatRef.on('child_added', snap => {
            const d = snap.val();
            if (!d || d.senderId === _clientId) return;
            if (d.isVoiceNote && d.audioData) {
                if (typeof window.addVoiceBubble === 'function')
                    window.addVoiceBubble(d.user || 'Guest', d.audioData, d.duration || 0, false);
                return;
            }
            if (typeof addChatMessage === 'function')
                addChatMessage(d.user || 'Guest', d.message || '', d.timestamp || 0, false, d.isSystem || false);
        });
        _listeners.push(() => chatRef.off('child_added', chatCb));

        /* ── Reaction listener ── */
        const reactRef = partyRef.child('reactions').orderByChild('sentAt').startAt(_joinTimestamp);
        const reactCb = reactRef.on('child_added', snap => {
            const d = snap.val();
            if (!d || d.senderId === _clientId) return;
            if (typeof addPartyReaction === 'function') addPartyReaction(d.user, d.reaction, d.time);
        });
        _listeners.push(() => reactRef.off('child_added', reactCb));

        if (typeof setPartySyncStatus === 'function') {
            setPartySyncStatus(
                isHost ? 'Live — share your link' : 'Joining — syncing…',
                isHost ? 'good' : 'neutral'
            );
        }
    }

    /* ── sendPartyEvent ──────────────────────────────────────────────────── */
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
        }
    };

    /* ── endUploadParty (host) ───────────────────────────────────────────── */
    window.endUploadParty = function () {
        if (!_isHost || !partyRef) return;
        partyRef.child('chat').push({
            user: 'System',
            message: '🛑 The host has ended the upload party.',
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

    /* ══════════════════════════════════════════════════════════════════════
       LOBBY — File upload flow (host only)
    ══════════════════════════════════════════════════════════════════════ */

    async function initLobby() {
        // Ensure Firebase is ready for upload
        await initFirebase().catch(err => {
            console.error('[UploadParty] Firebase init failed in lobby:', err);
        });

        const partyId = window._upPartyId;
        const dropZone = document.getElementById('upDropZone');
        const fileInput = document.getElementById('upFileInput');
        const dropInner = document.getElementById('upDropInner');
        const progressWrap = document.getElementById('upProgressWrap');
        const progressFill = document.getElementById('upProgressFill');
        const progressPct = document.getElementById('upProgressPct');
        const progressLabel = document.getElementById('upProgressLabel');
        const progressHint = document.getElementById('upProgressHint');
        const titleWrap = document.getElementById('upTitleWrap');
        const titleInput = document.getElementById('upTitleInput');
        const startBtn = document.getElementById('upStartBtn');

        let _selectedFile = null;
        let _uploadedUrl = null;

        /* ── Drag-and-drop ── */
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('is-drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('is-drag-over');
            const file = e.dataTransfer?.files[0];
            if (file && file.type.startsWith('video/')) handleFileSelected(file);
            else alert('Please drop a video file (MP4, MKV, MOV, AVI, WebM).');
        });
        dropZone.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') fileInput.click();
        });
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) handleFileSelected(file);
        });

        function handleFileSelected(file) {
            _selectedFile = file;
            const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            dropInner.innerHTML = `
                <i class='bx bx-check-circle up-drop-icon' style="color:var(--brand)"></i>
                <span class="up-drop-main" style="color:var(--text-1)">${escHtml(file.name)}</span>
                <span class="up-drop-sub">${formatBytes(file.size)} · Click to change</span>`;
            titleInput.value = name;
            titleWrap.hidden = false;
        }

        /* ── Upload & start ── */
        startBtn.addEventListener('click', async () => {
            if (!_selectedFile) { alert('Please select a video file first.'); return; }

            const title = titleInput.value.trim() || _selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Uploading…';
            titleWrap.style.opacity = '0.5';
            progressWrap.hidden = false;

            try {
                const storageRef = storage.ref(`uploadParties/${partyId}/video`);
                const uploadTask = storageRef.put(_selectedFile);

                uploadTask.on('state_changed',
                    snapshot => {
                        const pct = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
                        progressFill.style.width = pct + '%';
                        progressPct.textContent = pct + '%';
                        progressLabel.textContent = 'Uploading… ' + formatBytes(snapshot.bytesTransferred) + ' / ' + formatBytes(snapshot.totalBytes);
                    },
                    err => {
                        console.error('[UploadParty] Upload error:', err);
                        progressLabel.textContent = '❌ Upload failed: ' + err.message;
                        progressHint.textContent = 'Please try again.';
                        startBtn.disabled = false;
                        startBtn.innerHTML = '<i class="bx bx-party"></i> Retry Upload';
                        titleWrap.style.opacity = '1';
                    },
                    async () => {
                        // Upload complete — get the download URL
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        _uploadedUrl = downloadURL;

                        progressLabel.textContent = '✅ Upload complete! Starting party…';
                        progressFill.style.width = '100%';
                        progressPct.textContent = '100%';
                        progressHint.textContent = '';

                        // Write to DB so guests can see the video is ready
                        const partyRef = db.ref('uploadParties/' + partyId);
                        await partyRef.child('video').set({
                            storageUrl: downloadURL,
                            title: title,
                            ready: true,
                            uploadedAt: firebase.database.ServerValue.TIMESTAMP,
                            uploadedBy: getDisplayName(),
                        });

                        // Transition to stage
                        setTimeout(() => launchPartyStage(partyId, true, downloadURL, title), 600);
                    }
                );
            } catch (err) {
                console.error('[UploadParty] Unexpected error:', err);
                progressLabel.textContent = '❌ Error: ' + err.message;
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="bx bx-party"></i> Retry Upload';
                titleWrap.style.opacity = '1';
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════════
       GUEST WAITING ROOM
    ══════════════════════════════════════════════════════════════════════ */

    async function initGuestWaiting(partyId) {
        await initFirebase();

        document.getElementById('upWaitPartyId').textContent = partyId;

        const videoRef = db.ref('uploadParties/' + partyId + '/video');

        // Also check if party has already ended
        const endedRef = db.ref('uploadParties/' + partyId + '/ended');
        endedRef.once('value', snap => {
            if (snap.val()) {
                document.getElementById('upWaitingMsg').textContent = 'This party has already ended.';
            }
        });

        // Listen for the host to finish uploading
        const videoCb = videoRef.on('value', snap => {
            const data = snap.val();
            if (data && data.ready && data.storageUrl) {
                videoRef.off('value', videoCb);
                launchPartyStage(partyId, false, data.storageUrl, data.title || 'Upload Party');
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════════
       LAUNCH PARTY STAGE (common for host and guest)
    ══════════════════════════════════════════════════════════════════════ */

    async function launchPartyStage(partyId, isHost, videoUrl, title) {
        // Set video source
        const player = getPlayer();
        if (player) {
            player.src = videoUrl;
        }

        // Set title
        const titleEl = document.getElementById('wpMovieTitle');
        if (titleEl) titleEl.textContent = title || 'Upload Party';

        // Set share link
        const link = window._upBuildLink ? window._upBuildLink(partyId) : location.href;
        if (typeof window._upSetLinks === 'function') window._upSetLinks(link);

        // Apply role UI
        if (typeof applyRoleUI === 'function') applyRoleUI(isHost);

        // Show the main stage
        showStage();

        // Bind host video controls (play/pause/seek broadcast)
        if (isHost) bindHostVideoEvents();

        // Start Firebase room
        await startFirebaseRoom(partyId, isHost, videoUrl, title);

        // If host, update URL so refreshing keeps you in as host
        if (isHost) {
            const newUrl = `${location.pathname}?party=${partyId}&host=1`;
            history.replaceState({}, '', newUrl);
        }
    }

    /* ══════════════════════════════════════════════════════════════════════
       ENTRY POINT
    ══════════════════════════════════════════════════════════════════════ */

    document.addEventListener('DOMContentLoaded', async () => {
        const partyId = window._upPartyId;
        const hostMode = window._upHostMode;

        if (hostMode) {
            // HOST: show the upload lobby
            showLobby();
            await initLobby();

            // Build the guest invite link early (before upload) so host can share
            const link = window._upBuildLink ? window._upBuildLink(partyId) : location.href;
            if (typeof window._upSetLinks === 'function') window._upSetLinks(link);

            // Update URL so host can share the party link before video is ready
            const newUrl = `${location.pathname}?party=${partyId}&host=1`;
            history.replaceState({}, '', newUrl);

            if (typeof setPartySyncStatus === 'function') setPartySyncStatus('Waiting for upload…', 'neutral');

        } else {
            // GUEST: show waiting screen
            showWaiting();
            await initGuestWaiting(partyId);
        }
    });

    /* ── Cleanup on unload ───────────────────────────────────────────────── */
    window.addEventListener('beforeunload', () => {
        clearInterval(_heartbeat);
        cleanupListeners();
        if (partyRef && _clientId) partyRef.child('members/' + _clientId).remove();
    });

    /* ── Utility ─────────────────────────────────────────────────────────── */
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(2) + ' GB';
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    console.log('[UploadParty] Firebase upload party loaded — host-upload sync enabled.');
})();