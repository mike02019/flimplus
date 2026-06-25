/* filmplus-abr.js  -  Adaptive Quality Gating for Film+ Watch Party
   ===================================================================
   HOW TO USE:
     1. Save this file in your project root (next to watchparty.js)
     2. In watchparty.html AND uploadparty.html, add:
           <script src="filmplus-abr.js"></script>
        immediately after your Firebase script tags.
     3. Inside watchparty.js, after initFirebase() succeeds, add:
           if (window.filmPlusABR) window.filmPlusABR.setPartyRef(partyRef);
     4. Inside hideWatchPartyModal(), add:
           if (window.filmPlusABR) window.filmPlusABR.stop();

   WHAT IT DOES:
     - Monitors each guest's video buffer every 3 seconds.
     - Shows a quality badge (green/yellow/red) in the bottom-left corner.
     - Slightly slows playback (0.95x) when the buffer is critically low,
       giving the network time to catch up. This is imperceptible to viewers.
     - Reports stalling guests back to the host via Firebase so the host
       can see who is struggling (stored under parties/<id>/qualityReports/).
*/

(function () {
    'use strict';

    // ── Thresholds (seconds of buffer ahead of current playback position) ──
    const BUFFER_GOOD = 10;    // > 10 s  → excellent, full quality
    const BUFFER_WARNING = 5;     //  5-10 s → good, show mild badge
    const BUFFER_CRITICAL = 2;     //  2-5 s  → warning, badge turns yellow
    const BUFFER_STALLED = 0.5;   // < 0.5 s → critical: throttle + report

    // ── How often to run the health check (milliseconds) ──
    const CHECK_EVERY_MS = 3000;

    let _intervalId = null;
    let _lastStatus = null;
    let _badge = null;
    let _partyRef = null;   // set via window.filmPlusABR.setPartyRef()

    // ────────────────────────────────────────────────────────────────────────
    // Core: measure how many seconds of video are buffered ahead of now
    // ────────────────────────────────────────────────────────────────────────
    function getBufferAhead(video) {
        if (!video || !video.buffered || video.buffered.length === 0) return 0;
        const ct = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
            if (video.buffered.start(i) <= ct && video.buffered.end(i) >= ct) {
                return video.buffered.end(i) - ct;
            }
        }
        return 0;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Determine health tier from the buffer value
    // ────────────────────────────────────────────────────────────────────────
    function getHealthStatus(bufferAhead, video) {
        if (video.paused) return 'paused';
        if (bufferAhead >= BUFFER_GOOD) return 'excellent';
        if (bufferAhead >= BUFFER_WARNING) return 'good';
        if (bufferAhead >= BUFFER_CRITICAL) return 'warning';
        if (bufferAhead >= BUFFER_STALLED) return 'critical';
        return 'stalled';
    }

    // ────────────────────────────────────────────────────────────────────────
    // Apply corrective action based on health status
    // ────────────────────────────────────────────────────────────────────────
    function applyAdaptiveAction(status, video) {
        switch (status) {
            case 'excellent':
            case 'good':
                // Full speed. Restore if we previously throttled.
                if (video.playbackRate !== 1.0) video.playbackRate = 1.0;
                break;

            case 'warning':
                // No action yet — just display the badge.
                if (video.playbackRate !== 1.0) video.playbackRate = 1.0;
                break;

            case 'critical':
                // Slow down by 5% to let the buffer rebuild.
                // 0.95x is imperceptible to viewers but gains ~3% buffer-fill rate.
                if (video.playbackRate !== 0.95) video.playbackRate = 0.95;
                break;

            case 'stalled':
                // Same throttle, plus report to host.
                if (video.playbackRate !== 0.95) video.playbackRate = 0.95;
                reportToHost(video.currentTime);
                break;

            // 'paused' → do nothing to playbackRate
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // On-screen quality badge (bottom-left corner)
    // Matches Film+'s Cinema Noir dark theme.
    // ────────────────────────────────────────────────────────────────────────
    const STATUS_CONFIG = {
        excellent: { emoji: '🟢', label: 'HD – Excellent', color: '#22aa22' },
        good: { emoji: '🟢', label: 'HD – Good', color: '#22aa22' },
        warning: { emoji: '🟡', label: 'SD – Low Buffer', color: '#cc8800' },
        critical: { emoji: '🔴', label: 'Low Quality', color: '#cc2200' },
        stalled: { emoji: '🔴', label: 'Buffering…', color: '#cc2200' },
        paused: { emoji: '⏸', label: 'Paused', color: '#888888' },
    };

    function updateBadge(status, bufferAhead) {
        if (!_badge) {
            _badge = document.createElement('div');
            _badge.id = 'filmplus-abr-badge';
            Object.assign(_badge.style, {
                position: 'fixed',
                bottom: '80px',
                left: '16px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'rgba(10,10,13,0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f0eee8',
                fontSize: '12px',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                zIndex: '9999',
                backdropFilter: 'blur(8px)',
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',   // don't block clicks
            });
            document.body.appendChild(_badge);
        }

        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.good;
        const bufStr = (status !== 'paused')
            ? ` \u00a0|\u00a0 ${bufferAhead.toFixed(1)}s buffer`
            : '';

        _badge.style.borderColor = cfg.color;
        _badge.innerHTML =
            `${cfg.emoji} <span style="color:${cfg.color};font-weight:600">${cfg.label}</span>${bufStr}`;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Report a stalling guest back to Firebase so the host can see it.
    // Stored at: parties/<id>/qualityReports/<timestamp>
    // ────────────────────────────────────────────────────────────────────────
    function reportToHost(currentTime) {
        // Don't report if this client IS the host, or Firebase isn't ready.
        if (!_partyRef || window.isHost) return;

        let user = 'Guest';
        try {
            user = JSON.parse(localStorage.getItem('userData'))?.name || 'Guest';
        } catch (_) { /* ignore */ }

        _partyRef.child('qualityReports/' + Date.now()).set({
            user,
            currentTime,
            status: 'stalled',
            reportedAt: Date.now(),
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // Main monitoring loop
    // ────────────────────────────────────────────────────────────────────────
    function runCheck() {
        const video = document.getElementById('partyMoviePlayer');
        if (!video) return;

        const bufferAhead = getBufferAhead(video);
        const status = getHealthStatus(bufferAhead, video);

        // Only log when status changes to avoid console spam
        if (status !== _lastStatus) {
            console.log(
                `[FilmPlus ABR] Status changed: ${status} | buffer: ${bufferAhead.toFixed(2)}s`
            );
            _lastStatus = status;
        }

        applyAdaptiveAction(status, video);
        updateBadge(status, bufferAhead);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────────────
    window.filmPlusABR = {
        /**
         * Connect the Firebase party reference so stalling reports can be sent.
         * Call this after initFirebase() inside startFirebaseParty():
         *   if (window.filmPlusABR) window.filmPlusABR.setPartyRef(partyRef);
         */
        setPartyRef: function (ref) {
            _partyRef = ref;
        },

        /** Start the monitoring interval. Called automatically on DOMContentLoaded. */
        start: function () {
            if (_intervalId) return;
            _intervalId = setInterval(runCheck, CHECK_EVERY_MS);
            console.log('[FilmPlus ABR] Adaptive quality monitoring started.');
        },

        /** Stop monitoring and remove the badge. Call inside hideWatchPartyModal(). */
        stop: function () {
            clearInterval(_intervalId);
            _intervalId = null;
            _lastStatus = null;
            if (_badge) { _badge.remove(); _badge = null; }
            console.log('[FilmPlus ABR] Monitoring stopped.');
        },
    };

    // ────────────────────────────────────────────────────────────────────────
    // Auto-start: wait for the video element to appear in the DOM
    // ────────────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const tryStart = setInterval(function () {
            if (document.getElementById('partyMoviePlayer')) {
                window.filmPlusABR.start();
                clearInterval(tryStart);
            }
        }, 500);
    });

})();