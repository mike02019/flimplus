// Authentication Functions
function login(identifier, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(
        u =>
            (u.email === identifier || u.name === identifier) &&
            u.password === password
    );
    
    if (user) {
        const userData = {
            isLoggedIn: true,
            email: user.email,
            name: user.name,
            profilePic: user.profilePic || 'img/pic2.jpg',
            userId: user.id,
            loginTime: new Date().toISOString(),
            moviesWatched: user.moviesWatched || 0,
            watchParties: user.watchParties || 0,
            totalHours: user.totalHours || 0,
            watchHistory: user.watchHistory || [],
            favorites: user.favorites || [],
            settings: user.settings || {
                autoplay: true,
                notifications: true,
                quality: 'auto'
            }
        };

        // Current app expects userData (index/profile), but keep currentUser too for safety
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(user));

        return { success: true, userData };
    } else {
        return { success: false, message: 'Invalid username/email or password' };
    }
}

function signup(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
        watchHistory: [],
        favorites: [],
        settings: {
            autoplay: true,
            notifications: true,
            quality: 'auto'
        }
    };
    
    // Add to users array
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set as current user
    const userData = {
        isLoggedIn: true,
        email: newUser.email,
        name: newUser.name,
        profilePic: newUser.profilePic || 'img/pic2.jpg',
        userId: newUser.id,
        loginTime: new Date().toISOString(),
        moviesWatched: 0,
        watchParties: 0,
        totalHours: 0,
        watchHistory: newUser.watchHistory || [],
        favorites: newUser.favorites || [],
        settings: newUser.settings
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return { success: true, userData };
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Event Listeners for Forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authError = document.getElementById('authError');
    const toggleForms = document.querySelectorAll('.toggle-form');

    if (!loginForm || !signupForm || !authError || !toggleForms.length) return;
    
    // Show/Hide Forms
    toggleForms.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const target = button.getAttribute('data-target');

            // Update active tab styling
            toggleForms.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            if (target === 'signup') {
                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
            } else {
                signupForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            }
            authError.textContent = '';
        });
    });

    // Set initial active tab based on visible form
    const initialTarget = signupForm.classList.contains('hidden') ? 'login' : 'signup';
    toggleForms.forEach(b => {
        if (b.getAttribute('data-target') === initialTarget) b.classList.add('active');
        else b.classList.remove('active');
    });
    
    // Login Form Handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = login(identifier, password);
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            authError.textContent = result.message;
        }
    });
    
    // Signup Form Handler
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        const result = signup(name, email, password);
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            authError.textContent = result.message;
        }
    });
    
    // Check if user is logged in (optional UI hook)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const profileBtn = document.getElementById('profileButton');
        if (profileBtn) profileBtn.textContent = currentUser.name;
    }
});
