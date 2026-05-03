/* ============================================================ */
/* VIBE MENU BRAIN - menu.js */
/* ============================================================ */
(function() {
    const root = document.getElementById('vibe-menu-root');
    const trigger = document.getElementById('vibe-menu-trigger');
    const panel = document.getElementById('vibe-menu-panel');

    let isMoving = false;
    let startY, initialTop, originalTop; 
    let moveThreshold = 10; // Pixels moved before it counts as a drag
    let didMove = false;

    function onStart(e) {
        // Don't drag if the menu is already open to avoid glitches
        if (panel.classList.contains('panel-visible')) return;

        isMoving = true;
        didMove = false;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startY = clientY;
        initialTop = root.offsetTop;
        root.style.transition = 'none'; // Instant response during drag
    }

    function onMove(e) {
        if (!isMoving) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - startY;

        if (Math.abs(deltaY) > moveThreshold) {
            didMove = true;
            let newTop = initialTop + deltaY;
            
            // Boundary constraints (Keep it 50px from top and 100px from bottom)
            newTop = Math.max(50, Math.min(newTop, window.innerHeight - 100));
            root.style.top = newTop + 'px';
        }
    }

    function onEnd(e) {
        if (!isMoving) return;
        isMoving = false;
        
        // Return smooth snapping
        root.style.transition = 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        
        if (!didMove) {
            // It was a tap, not a drag - Trigger the Smart Push Toggle
            toggleMenuWithPush();
        } else {
            // Handle snapping to horizontal edges
            if (clientX < window.innerWidth / 2) {
                root.classList.remove('snapped-right');
                root.classList.add('snapped-left');
            } else {
                root.classList.remove('snapped-left');
                root.classList.add('snapped-right');
            }
        }
    }

    // Smart Toggle: Pushes the menu up if there's no room at the bottom
    function toggleMenuWithPush() {
        const isClosing = panel.classList.contains('panel-visible');

        if (isClosing) {
            // Close it and return the icon to its original resting position
            panel.classList.remove('panel-visible');
            if (originalTop !== undefined) {
                root.style.top = originalTop + 'px';
            }
        } else {
            // Opening: Save the current top before any push happens
            originalTop = root.offsetTop;
            panel.classList.add('panel-visible');

            // Calculate if the bar is hitting the bottom margin
            setTimeout(() => {
                const rect = panel.getBoundingClientRect();
                const margin = 25; // Safety gap so it doesn't touch the edge
                const screenH = window.innerHeight;

                if (rect.bottom > (screenH - margin)) {
                    const pushAmount = rect.bottom - (screenH - margin);
                    root.style.top = (originalTop - pushAmount) + 'px';
                }
            }, 50); // Small delay to let the transition start
        }
    }

    trigger.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Desktop support
    trigger.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!root.contains(e.target) && panel.classList.contains('panel-visible')) {
            toggleMenuWithPush();
        }
    });

})();