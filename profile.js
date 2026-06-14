// Profile Page Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Load user data
    loadUserData();

    // Setup navigation
    setupNavigation();

    // Setup form handlers
    setupFormHandlers();

    // Initialize subscription handling
    initializeSubscription();
});

// Load user data from localStorage
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};

    // Update profile info
    document.getElementById('profileName').textContent = userData.name || 'Guest User';
    document.getElementById('profileEmail').textContent = userData.email || 'Not signed in';

    if (userData.profilePic) {
        document.getElementById('profilePic').src = userData.profilePic;
        document.getElementById('dropdownProfilePic').src = userData.profilePic;
    }

    // Load subscription status
    if (userData.subscription) {
        document.getElementById('currentPlanName').textContent =
            userData.subscription.plan.charAt(0).toUpperCase() + userData.subscription.plan.slice(1);
        document.getElementById('planExpiry').textContent =
            `Valid until ${new Date(userData.subscription.expiryDate).toLocaleDateString()}`;
    }

    // Load watch history
    if (userData.watchHistory) {
        displayWatchHistory(userData.watchHistory);
    }

    // Load favorites
    if (userData.favorites) {
        displayFavorites(userData.favorites);
    }

    // Load settings
    if (userData.settings) {
        document.getElementById('autoplay').checked = userData.settings.autoplay || false;
        document.getElementById('notifications').checked = userData.settings.notifications || false;
        document.getElementById('quality').value = userData.settings.quality || 'auto';
    }
}

// Setup navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    // Show initial section
    const hash = window.location.hash || '#account';
    showSection(hash.substring(1));

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('href').substring(1);
            showSection(section);

            // Update URL without reload
            window.history.pushState(null, '', `#${section}`);
        });
    });
}

// Show selected section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.nav-item');

    sections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    navItems.forEach(item => {
        if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Setup form handlers
function setupFormHandlers() {
    // Account form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }

    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsUpdate);
    }

    // Profile picture change
    const changePicBtn = document.getElementById('changePicBtn');
    if (changePicBtn) {
        changePicBtn.addEventListener('click', handleProfilePicChange);
    }
}

// Handle account form submission
function handleAccountUpdate(e) {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    userData.name = document.getElementById('name').value;
    userData.email = document.getElementById('email').value;

    // Update password if provided
    const newPassword = document.getElementById('password').value;
    if (newPassword) {
        userData.password = newPassword;
    }

    localStorage.setItem('userData', JSON.stringify(userData));
    showNotification('Account updated successfully');
}

// Handle settings form submission
function handleSettingsUpdate(e) {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    userData.settings = {
        autoplay: document.getElementById('autoplay').checked,
        notifications: document.getElementById('notifications').checked,
        quality: document.getElementById('quality').value
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    showNotification('Settings saved successfully');
}

// Profile picture change handler
function handleProfilePicChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const userData = JSON.parse(localStorage.getItem('userData')) || {};
                userData.profilePic = event.target.result;
                localStorage.setItem('userData', JSON.stringify(userData));

                document.getElementById('profilePic').src = event.target.result;
                document.getElementById('dropdownProfilePic').src = event.target.result;

                showNotification('Profile picture updated successfully');
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

// Initialize subscription handling
function initializeSubscription() {
    const planButtons = document.querySelectorAll('.plan-cta');
    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            const plan = button.closest('.plan-card').dataset.plan;
            showPaymentModal(plan);
        });
    });

    // Payment modal handling
    const modal = document.getElementById('paymentModal');
    const closeBtn = modal.querySelector('.close');
    const paymentForm = document.getElementById('paymentForm');

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = e => {
        if (e.target == modal) modal.style.display = 'none';
    };

    paymentForm.addEventListener('submit', handlePayment);
}

// Show payment modal
function showPaymentModal(plan) {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'block';
    modal.dataset.plan = plan;
}

// Handle payment submission
function handlePayment(e) {
    e.preventDefault();

    const modal = document.getElementById('paymentModal');
    const plan = modal.dataset.plan;

    // In real app, handle payment processing here

    // Update user subscription
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    userData.subscription = {
        plan: plan,
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    localStorage.setItem('userData', JSON.stringify(userData));

    modal.style.display = 'none';
    showNotification('Subscription updated successfully! Welcome to ' + plan.charAt(0).toUpperCase() + plan.slice(1) + ' plan!');

    // Refresh subscription display
    document.getElementById('currentPlanName').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    document.getElementById('planExpiry').textContent = `Valid until ${new Date(userData.subscription.expiryDate).toLocaleDateString()}`;
}

// Display watch history
function displayWatchHistory(history) {
    const container = document.getElementById('watchHistory');
    container.innerHTML = '';

    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${item.thumbnailSrc || 'img/default-thumbnail.jpg'}" alt="${item.title}">
            <div class="item-info">
                <h4>${item.title}</h4>
                <p>Watched on ${new Date(item.watchedAt).toLocaleDateString()}</p>
            </div>
        `;
        container.appendChild(historyItem);
    });
}

// Display favorites
function displayFavorites(favorites) {
    const container = document.getElementById('favoritesList');
    container.innerHTML = '';

    favorites.forEach(item => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <img src="${item.thumbnailSrc || 'img/default-thumbnail.jpg'}" alt="${item.title}">
            <div class="item-info">
                <h4>${item.title}</h4>
                <p>${item.genre}</p>
            </div>
        `;
        container.appendChild(favoriteItem);
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }, 100);
}
