
let masterReminderInterval = null;

// Update the showNotification function to work on any page
function showNotification(reminder) {
    // Check if notification elements exist
    const notification = document.getElementById('notification');
    if (!notification) return;

    const notifiedRemindersSession = JSON.parse(sessionStorage.getItem('notifiedRemindersSession')) || [];
    if (notifiedRemindersSession.includes(reminder.id)) {
        return;
    }

    // Update notification content
    const notifImage = document.getElementById('notifImage');
    const notifTitle = document.getElementById('notifTitle');
    const notifMessage = document.getElementById('notifMessage');

    if (notifImage) notifImage.src = reminder.image || 'img/pic1.jpg';
    if (notifTitle) notifTitle.textContent = `🎬 Hey ${reminder.name}, It's Showtime!`;
    if (notifMessage) notifMessage.innerHTML = `Your movie <strong>"${reminder.movie}"</strong> is starting now!`;

    // Show notification
    notification.classList.add('show');

    // Play sound if on a page where audio is allowed
    try {
        const audio = new Audio('notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio playback prevented:', e));
    } catch (e) {
        console.log('Audio error:', e);
    }

    // Vibrate if on mobile
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }

    // Auto-hide after 15 seconds
    const hideTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 15000);

    // Handle interaction (clear timeout on hover, hide on click)
    notification.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    notification.addEventListener('mouseleave', () => {
        setTimeout(() => notification.classList.remove('show'), 3000);
    });
    notification.addEventListener('click', (e) => {
        if (!e.target.classList.contains('notification-close')) {
            notification.classList.remove('show');
        }
    });

    // Mark as notified for the current session to prevent immediate duplicates
    notifiedRemindersSession.push(reminder.id);
    sessionStorage.setItem('notifiedRemindersSession', JSON.stringify(notifiedRemindersSession));
}

function updateAllCountdowns() {
    let reminders = JSON.parse(localStorage.getItem('movieReminders')) || [];
    const now = new Date();
    let activeRemindersExist = false;
    let remindersModified = false; // Flag to indicate if movieReminders needs updating


    const updatedReminders = reminders.filter(reminder => {
        const targetDate = new Date(reminder.timestamp);
        const isExpired = targetDate <= now;

        if (isExpired) {
            showNotification(reminder);
            remindersModified = true; // This reminder will be removed
            return false; // Remove expired reminder from the list
        } else {
            activeRemindersExist = true; // Keep track if any future reminders exist
            const countdownElement = document.getElementById(`countdown-${reminder.id}`);
            if (countdownElement) {
                const diff = targetDate - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                countdownElement.textContent = `Showtime in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
            return true; // Keep active reminder
        }
    });

    // Only update localStorage if reminders were modified (i.e., some were removed)
    if (remindersModified) {
        localStorage.setItem('movieReminders', JSON.stringify(updatedReminders));
        // If on the booknow page, refresh displayed reminders
        if (document.querySelector('.book-now-container')) {
             if (typeof displayActiveReminders === 'function') {
                displayActiveReminders();
             }
        }
    }

    // Stop the interval if no active reminders remain
    if (!activeRemindersExist && masterReminderInterval) {
        clearInterval(masterReminderInterval);
        masterReminderInterval = null;
    }

    // If there are reminders and the master interval isn't running, start it.
    if (activeRemindersExist && !masterReminderInterval) {
        masterReminderInterval = setInterval(updateAllCountdowns, 1000);
    }
}

function checkForReminders() {
    // Clear session storage for notified reminders on page load
    sessionStorage.removeItem('notifiedRemindersSession');
    
    // Immediately run updateAllCountdowns to process any expired reminders and update countdowns
    updateAllCountdowns(); 
}

// Check for reminders when any page loads
document.addEventListener('DOMContentLoaded', checkForReminders);