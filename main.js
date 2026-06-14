// Check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    // Ensure modal is hidden on page load
    hideModalOnLoad();
});

let profileDropdownInitialized = false;

// Function to ensure modal is hidden when page loads
function hideModalOnLoad() {
    const modal = document.getElementById('movieModal');
    const watchPartyModal = document.getElementById('watchPartyModal');

    if (modal) {
        modal.style.display = 'none';
    }
    if (watchPartyModal) {
        watchPartyModal.style.display = 'none';
    }

    // Ensure body overflow is set to auto
    document.body.style.overflow = 'auto';
}

function getUserInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function ensureLogoutOption(userDropdown) {
    if (!userDropdown) return null;
    let logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) return logoutBtn;

    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';

    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'dropdown-item logout-btn';
    logoutBtn.innerHTML = "<i class='bx bx-log-out'></i> Log Out";

    userDropdown.appendChild(divider);
    userDropdown.appendChild(logoutBtn);
    return logoutBtn;
}

function configureLogoutOnlyDropdown(userDropdown) {
    if (!userDropdown) return null;

    userDropdown.innerHTML = '';
    userDropdown.classList.add('logout-only-dropdown');

    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'dropdown-item logout-btn';
    logoutBtn.innerHTML = "<i class='bx bx-log-out'></i> Log Out";

    userDropdown.appendChild(logoutBtn);
    return logoutBtn;
}

function checkAuthStatus() {
    try {
        const authButton = document.getElementById('authButton');
        const authButtonText = document.getElementById('authButtonText');
        const profilePicHeader = document.getElementById('profilePicHeader');
        const profileInitialsHeader = document.getElementById('profileInitialsHeader');
        const profilePicWrapper = document.querySelector('.profile-pic-wrapper');
        const userDropdown = document.getElementById('userDropdown');

        // If auth UI elements aren't on this page (like on profile.html), exit safely
        if (!authButton || !profilePicWrapper) {
            return;
        }

        const userData = JSON.parse(localStorage.getItem('userData'));
        const isLoggedIn = userData && userData.isLoggedIn;

        if (isLoggedIn) {
            // 1. Hide the Register button and show the profile pic wrapper
            authButton.style.display = 'none';
            profilePicWrapper.style.display = 'flex'; // or 'block' depending on your CSS

            if (profileInitialsHeader) {
                profileInitialsHeader.textContent = getUserInitials(userData.name);
                profileInitialsHeader.style.display = 'flex';
            }

            if (profilePicHeader && userData.profilePic && userData.profilePic !== 'img/pic2.jpg') {
                profilePicHeader.src = userData.profilePic;
                profilePicHeader.style.display = 'block';
                if (profileInitialsHeader) {
                    profileInitialsHeader.style.display = 'none';
                }
            } else if (profilePicHeader) {
                profilePicHeader.style.display = 'none';
            }

            // Populate existing dropdown UI
            const dropdownUsername = document.getElementById('dropdownUsername');
            const userEmail = document.getElementById('userEmail');
            const dropdownProfilePic = document.getElementById('dropdownProfilePic');

            if (dropdownUsername) dropdownUsername.textContent = userData.name || 'Profile';
            if (userEmail) userEmail.textContent = userData.email || '';
            if (dropdownProfilePic && userData.profilePic) dropdownProfilePic.src = userData.profilePic;

            // 2. Setup the Dropdown Click Events (Using style.display instead of CSS classes)
            if (!profileDropdownInitialized && userDropdown) {
                profileDropdownInitialized = true;
                profilePicWrapper.style.cursor = 'pointer';

                const closeDropdown = () => {
                    userDropdown.classList.remove('open');
                    userDropdown.style.display = 'none';
                };
                const toggleDropdown = () => {
                    const isOpen = userDropdown.classList.contains('open');
                    if (isOpen) {
                        closeDropdown();
                        return;
                    }
                    userDropdown.style.display = 'block';
                    requestAnimationFrame(() => userDropdown.classList.add('open'));
                };

                profilePicWrapper.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDropdown();
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!userDropdown.classList.contains('open')) return;
                    if (profilePicWrapper.contains(e.target) || userDropdown.contains(e.target)) return;
                    closeDropdown();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') closeDropdown();
                });

                const logoutBtn = configureLogoutOnlyDropdown(userDropdown) || ensureLogoutOption(userDropdown);
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        localStorage.removeItem('userData');
                        localStorage.removeItem('currentUser');
                        closeDropdown();
                        window.location.reload();
                    });
                }
            }
        } else {
            // User is not logged in: Show Register button, Hide Profile Pic
            authButton.style.display = 'flex';
            authButtonText.textContent = 'Register';
            authButton.href = 'login.html';
            profilePicWrapper.style.display = 'none';
            if (profilePicHeader) profilePicHeader.style.display = 'none';
            if (profileInitialsHeader) profileInitialsHeader.style.display = 'none';
            if (userDropdown) {
                userDropdown.classList.remove('open');
                userDropdown.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}
function setupAuthDropdown(authButton) {
    authButton.addEventListener('mouseover', function () {
        if (!this.querySelector('.auth-dropdown')) {
            const dropdown = document.createElement('div');
            dropdown.className = 'auth-dropdown';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.right = '0';
            dropdown.style.backgroundColor = '#2c3e50';
            dropdown.style.borderRadius = '5px';
            dropdown.style.padding = '10px';
            dropdown.style.display = 'none';
            dropdown.style.zIndex = '1000';

            // Profile link
            const profileLink = document.createElement('a');
            profileLink.textContent = 'Profile';
            profileLink.href = 'profile.html';
            profileLink.style.display = 'block';
            profileLink.style.padding = '5px 10px';
            profileLink.style.color = 'white';
            profileLink.style.textDecoration = 'none';
            profileLink.style.marginBottom = '5px';

            // History link 
            const historyLink = document.createElement('a');
            historyLink.textContent = 'Watch History';
            historyLink.href = 'profile.html#history';
            historyLink.style.display = 'block';
            historyLink.style.padding = '5px 10px';
            historyLink.style.color = 'white';
            historyLink.style.textDecoration = 'none';
            historyLink.style.marginBottom = '5px';

            // Settings link
            const settingsLink = document.createElement('a');
            settingsLink.textContent = 'Settings';
            settingsLink.href = 'profile.html#settings';
            settingsLink.style.display = 'block';
            settingsLink.style.padding = '5px 10px';
            settingsLink.style.color = 'white';
            settingsLink.style.textDecoration = 'none';
            settingsLink.style.marginBottom = '10px';

            // Logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Log Out';
            logoutBtn.style.width = '100%';
            logoutBtn.style.padding = '5px 10px';
            logoutBtn.style.backgroundColor = '#ff3333';
            logoutBtn.style.color = 'white';
            logoutBtn.style.border = 'none';
            logoutBtn.style.borderRadius = '3px';
            logoutBtn.style.cursor = 'pointer';

            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
            });

            dropdown.appendChild(profileLink);
            dropdown.appendChild(historyLink);
            dropdown.appendChild(settingsLink);
            dropdown.appendChild(logoutBtn);
            this.appendChild(dropdown);
        }

        this.querySelector('.auth-dropdown').style.display = 'block';
    });

    authButton.addEventListener('mouseleave', function () {
        const dropdown = this.querySelector('.auth-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
}

// Track movie watching history
function trackMovieWatch(movieTitle, duration, thumbnailSrc) {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!userData || !userData.isLoggedIn) {
            console.log('User not logged in - watch not tracked');
            return;
        }

        // Initialize watch history if doesn't exist
        if (!userData.watchHistory) {
            userData.watchHistory = [];
        }

        // Add new watch entry
        userData.watchHistory.push({
            title: movieTitle,
            duration: duration,
            thumbnailSrc: thumbnailSrc,
            watchedAt: new Date().toISOString()
        });

        // Update stats
        userData.moviesWatched = (userData.moviesWatched || 0) + 1;

        // Parse duration and add to total hours watched
        const durationMatch = duration.match(/(\d+)/);
        if (durationMatch) {
            const minutes = parseInt(durationMatch[1]);
            userData.totalHoursWatched = (userData.totalHoursWatched || 0) + (minutes / 60);
        }

        // Save updated user data
        localStorage.setItem('userData', JSON.stringify(userData));

        // Trigger any UI updates if needed
        const watchEvent = new CustomEvent('watchHistoryUpdated', {
            detail: userData.watchHistory
        });
        document.dispatchEvent(watchEvent);

    } catch (error) {
        console.error('Error tracking movie watch:', error);
    }
}

// Listen for watch history updates
document.addEventListener('watchHistoryUpdated', (e) => {
    // You can add code here to update any UI elements that show watch history
    console.log('Watch history updated:', e.detail);
});

// Add click handler to track movie watches
document.addEventListener('click', (e) => {
    // Check if click was on play button
    if (e.target.matches('#playMovieBtn')) {
        const movieTitle = document.querySelector('#modalMovieTitle')?.textContent;
        const duration = document.querySelector('#modalMovieDuration')?.textContent;
        const thumbnail = document.querySelector('.modal-backdrop')?.style.backgroundImage.slice(5, -2);

        if (movieTitle && duration) {
            trackMovieWatch(movieTitle, duration, thumbnail);
        }
    }
});

// Header scroll effect
let header = document.querySelector('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('shadow', window.scrollY > 0);
});

// Menu toggle functionality
let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}
window.onscroll = () => {
    menu.classList.remove('bx-x');
    navbar.classList.remove('active');
}

// New fade slider implementation with very slow transitions
let currentSlide = 0;
const slides = document.querySelectorAll('.home .container-slide');
const totalSlides = slides.length;
const TRANSITION_DURATION = 5000; // 5 seconds for fade in/out
const DISPLAY_DURATION = 5000;   // 5 seconds to display each slide

function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => {
        slide.style.opacity = '0';
        slide.style.zIndex = '0';
        slide.style.transition = `opacity ${TRANSITION_DURATION / 1000}s ease-in-out`;
    });

    // Show current slide
    if (slides[index]) {
        slides[index].style.opacity = '1';
        slides[index].style.zIndex = '1';
    }
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

// Initialize and run the slider
if (slides.length > 0) {
    showSlide(currentSlide);
    setInterval(nextSlide, TRANSITION_DURATION + DISPLAY_DURATION);
}

// Keep your existing Swiper for coming-container
var swiper = new Swiper(".coming-container", {
    spaceBetween: 20,
    loop: true,
    autoplay: {
        delay: 55000,
        disableOnInteraction: false,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    centeredSlides: true,
    breakpoints: {
        0: {
            slidesPerView: 2,
        },
        568: {
            slidesPerView: 3,
        },
        768: {
            slidesPerView: 4,
        },
        968: {
            slidesPerView: 5,
        },
    },
});

// Movie data for all your movies
const movieData = {
    // Home Section Movies
    'home1': {
        title: 'WarLord',
        duration: '97 min',
        genre: 'Action',
        year: '2025',
        description: 'Revolt brews in ancient Lloris as a merciless Sheriff and Brute oppress citizens. A young human seeks elves mystical aid to free the people, but secrets and hidden motives threaten an alliance that could doom all.',
        cast: 'Ryan GageStuart ,BrennanAliona ,Baranova ,Jennifer English,Gwyneth Evans,Richard Goss',
        rating: 'PG-13',
        videoSrc: "video/Warlord.mp4",
        trailerSrc: "videos/warlord-trailer.mp4"
    },
    'home2': {
        title: 'iHostage',
        duration: '1h 40m',
        genre: 'crime/Drama',
        year: '2025',
        description: 'When a gunman enters an Apple Store in the heart of Amsterdam, the police face a delicate challenge to resolve the standoff. Based on true events.',
        cast: 'Soufiane MoussouliAdmir SehovicEmmanuel Ohene Boafo',
        rating: 'R',
        videoSrc: "video/IHostage.mp4",
        trailerSrc: "videos/iron-lady-trailer.mp4"
    },
    'home3': {
        title: 'Spider-man: Far from Home',
        duration: '129 min',
        genre: 'Action/Adventure',
        year: '2019',
        description: 'Following the events of Avengers: Endgame, Spider-Man must step up to take on new threats in a world that has changed forever.',
        cast: 'Tom Holland, Samuel L. Jackson, Jake Gyllenhaal',
        rating: 'PG-13',
        videoSrc: "video/spiderman.mp4",
        trailerSrc: "videos/spiderman-trailer.mp4"
    },
    'home4': {
        title: 'Striking Rescue',
        duration: '1h 55m',
        genre: 'Action/Drama',
        year: '2025',
        description: 'A veteran Muay Thai expert goes on a take-no-prisoners mission of revenge after his wife and daughter are brutally murdered by mysterious forces.',
        cast: 'Chen Duo-Yi ,Junjia Hong ,Tony Jaa',
        rating: 'PG-13',
        videoSrc: "video/Striking.mp4",
        trailerSrc: "videos/striking-rescue-trailer.mp4"
    },
    'home5': {
        title: 'Sinners',
        duration: '2h 17m',
        genre: 'Action/Drama',
        year: '2018',
        description: 'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.',
        cast: 'Miles CatonSaul WilliamsAndrene Ward-Hammond',
        rating: 'PG-13',
        videoSrc: "video/sinners.mp4",
        trailerSrc: "videos/sinners-trailer.mp4"
    },
    'home6': {
        title: 'Bullet Train',
        duration: '2h 7m',
        genre: 'Action/Comedy',
        year: '2022',
        description: 'Five assassins aboard a fast-moving bullet train find out their missions have something in common.',
        cast: 'Brad Pitt, Joey King, Aaron Taylor-Johnson',
        rating: 'R',
        videoSrc: "video/bullet-train.mp4",
        trailerSrc: "videos/bullet-train-trailer.mp4"
    },
    'home7': {
        title: 'Death of a Unicorn',
        duration: '1hr 47m',
        genre: 'Comedy/Horror',
        year: '2025',
        description: 'A weekend retreat has deadly consequences when a father (Paul Rudd) and daughter (Jenna Ortega) accidentally hit and kill a unicorn while en route to find his billionaire boss seeks to exploit the creatures miraculous curative properties.',
        cast: 'Jenna Ortega, Paul Rudd,Will Poulter',
        rating: 'R',
        videoSrc: "video/Death-of-Unicorn.mp4",
        trailerSrc: "videos/death-of-unicorn-trailer.mp4"
    },
    'home8': {
        title: 'Working-Man',
        duration: '1hr 54m',
        genre: 'Action/',
        year: '2025',
        description: 'Levon Cade left his profession behind to work construction and be a good dad to his daughter. But when a local girl vanishes, hes asked to return to the skills that made him a mythic figure in the shadowy world of counter-terrorism.',
        cast: 'Jason StathamJason FlemyngMerab Ninidze',
        videoSrc: "video/Working-Man.mp4",
        trailerSrc: "videos/working-man-trailer.mp4"
    },
    'home9': {
        title: 'Venom: The Last Dance',
        duration: '1hr 50m',
        genre: 'Action/Adventure',
        year: '2024',
        description: 'Eddie Brock and Venom must make a devastating decision as they are pursued by a mysterious military man and alien monsters from Venoms home world..',
        cast: 'Tom Hardy ,Chiwetel Ejiofor ,Juno Temple',
        rating: 'PG-13',
        videoSrc: "video/Venom.mp4",
        trailerSrc: "videos/venom-trailer.mp4"
    },

    // Movies Section
    'm1': {
        title: 'A Working Man',
        duration: '1hr 54m',
        genre: 'Action/',
        year: '2025',
        description: 'Levon Cade left his profession behind to work construction and be a good dad to his daughter. But when a local girl vanishes, hes asked to return to the skills that made him a mythic figure in the shadowy world of counter-terrorism.',
        cast: 'Jason StathamJason FlemyngMerab Ninidze',
        videoSrc: "video/vid.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=mdfrG2cLK58"
    },
    'm2': {
        title: 'WarLord',
        duration: '97 min',
        genre: 'Action',
        year: '2025',
        description: 'Revolt brews in ancient Lloris as a merciless Sheriff and Brute oppress citizens. A young human seeks elves mystical aid to free the people, but secrets and hidden motives threaten an alliance that could doom all.',
        cast: 'Ryan GageStuart ,BrennanAliona ,Baranova ,Jennifer English,Gwyneth Evans,Richard Goss',
        rating: 'PG-13',
        videoSrc: "video/Warlord.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=LAlKcElsA2o"
    },
    'm3': {
        title: 'MobLand',
        duration: '50m',
        genre: 'Action',
        year: '2025',
        description: 'Power is up for grabs as two warring crime families clash in a battle that threatens to topple empires. In the crossfire stands Harry Da Souza, a street-smart fixer who knows too well where loyalties lie when opposing forces collide.',
        cast: 'Tsuyoshi c,KusanagiKanata Hosoda ,Non',
        rating: 'PG-13',
        videoSrc: "video/MobLand.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=bYopWaT8Sr0"
    },
    'm4': {
        title: 'Conclave',
        duration: '2hr',
        genre: 'Thriller',
        year: '2024',
        description: 'When Cardinal Lawrence is tasked with leading one of the worlds most secretive and ancient events, selecting a new Pope, he finds himself at the center of a web of conspiracies and intrigue that could shake the very foundation of the Catholic Church.',
        cast: 'Ralph Fiennes ,Stanley Tucci ,John Lithgow',
        rating: 'PG',
        videoSrc: "video/Conclave.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=JX9jasdi3ic"
    },
    'm5': {
        title: 'A Minecraft Movie',
        duration: '1hr 41M',
        genre: 'Fantasy',
        year: '2025',
        description: 'Four misfits are suddenly pulled through a mysterious portal into a bizarre cubic wonderland that thrives on imagination. To get back home they Will have to master this world while embarking on a quest with an unexpected expert crafter.',
        cast: 'Charlie Cox ,Margarita Levieva ,Vincent D Onofrio',
        rating: 'R',
        videoSrc: "video/Minecraft.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=7xALolZzhSM"
    },
    'm6': {
        title: 'Fog of War',
        duration: '1hr 42m',
        genre: 'Action',
        year: '2025',
        description: 'An injured American pilot Gene, and his OSS agent fiancee Penny, who retreat to a remote estate in Massachusetts to visit her extended family. The OSS has recruited Gene to spy on the family and the surrounding community.',
        cast: 'Jake AbelBrianna HildebrandGÃƒÂ©za RÃƒÂ¶hrig',
        rating: 'PG-13',
        videoSrc: "video/Fog-of-War.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=6_sp5Ct_iYg"
    },
    'm7': {
        title: 'G20',
        duration: '1h 48m',
        genre: 'Action',
        year: '2025',
        description: "Terrorists take over the G20 summit with President Sutton, bringing her governing and military experience to defend her family, company, and the world.",
        cast: 'Viola Davis, Anthony Anderson ,RamÃƒÂ³n RodrÃƒÂ­guez',
        rating: 'R',
        videoSrc: "video/G20.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=mhQcpvKHis4"
    },
    'm8': {
        title: 'The Woman in the Yard',
        duration: '1H 28M',
        genre: 'Horror',
        year: '2018',
        description: 'A mysterious woman repeatedly appears in a familys front yard, often delivering chilling warnings and unsettling messages, leaving them to question her identity, motives and the potential danger she might pose.',
        cast: 'Danielle Deadwyler, Okwui Okpokwasili ,Peyton Jackson',
        rating: 'PG-13',
        videoSrc: "video/Woman-in-Yard.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=1s-Ko4J3mWs"
    },
    'm9': {
        title: 'Havoc',
        duration: '1h 45m',
        genre: 'Drug Crime',
        year: '2025',
        description: 'After a drug deal gone wrong, a bruised detective must fight his way through the criminal underworld to rescue a politicians estranged son, unraveling a deep web of corruption and conspiracy that ensnares his entire city.',
        cast: 'Tom Hardy , Jessie Mei Li ,Justin Cornwell',
        rating: 'PG-13',
        videoSrc: "video/Havoc.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=HAQfDRvrU0s"
    },
    'm10': {
        title: 'House of David S1E1',
        duration: '91 min',
        genre: 'History',
        year: '2025',
        description: ' The once-mighty King Saul falls victim to his own pride, as an outcast shepherd boy, David is anointed as the second king.',
        cast: 'Michael Iskander ,Ali Suliman ,Indy Lewis',
        rating: 'R',
        videoSrc: "video/House-of-David.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=GrGfIHBIVL4"
    },
    'm11': {
        title: 'ASH',
        duration: '1h 35m',
        genre: 'Alien/horror',
        year: '2025',
        description: 'A woman wakes up on a distant planet and finds the crew of her space station viciously killed. Her investigation into what happened sets in motion a terrifying chain of events.',
        cast: 'Eiza GonzÃƒÂ¡lez , Aaron Paul , Iko Uwais',
        rating: 'R',
        videoSrc: "video/Ash.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=uvp2EYCXYwU"
    },
    'm12': {
        title: 'Thunderbolts',
        duration: '2h 7m',
        genre: 'Action/Adventure/CAM',
        year: '2025',
        description: 'After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.',
        cast: 'Florence Pugh ,Sebastian Stan ,Julia Louis-Dreyfus ',
        rating: 'PG-13',
        videoSrc: "video/Thunderbolts.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=-sAOWhvheK8"
    },
    'm13': {
        title: 'Sneaks',
        duration: '1hr 33m',
        genre: 'Animation',
        year: '2025',
        description: 'Ty, a misguided, one-of-a-kind designer sneaker, doesnÃ¢â‚¬â„¢t know life outside the comforts of his velvet-lined shoebox. After his sister is stolen by a shady collector, Ty must venture into New York City to find and rescue her. In his adventure, Ty meets a ragtag group of footwear friends from all walks of life who help him find the courage to step outside of his shoebox and find his sole-mate.',
        cast: 'Anthony Mackie ,Martin Lawrence , Swae Lee',
        rating: 'PG',
        videoSrc: "video/Sneaks.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=D9FJcmeOo6k"
    },
    'm14': {
        title: 'Alien Invasion: Rise of the Phoenix',
        duration: '90m',
        genre: 'ScienceFiction',
        year: '2025',
        description: 'An asteroid shower lands in a remote section of the Grand Canyon and begins to spread mysterious pods. Meanwhile, scientists on a space station that has been hit by the same asteroid shower, discover that a pod has mutated into a creature and is threatening the ship. Now the scientists and a team on Earth must learn to defeat this alien force, fighting fire with fire, fighting stone with stone.',
        cast: 'Melissa Rokuskie , Christopher Showerman, Daniele Favilli',
        rating: 'R',
        videoSrc: "video/Alien-Invasion.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=7uie3yo1lCk"
    },
    'm15': {
        title: 'Death of a Unicorn',
        duration: '1hr 47m',
        genre: 'Comedy/Horror',
        year: '2025',
        description: 'A weekend retreat has deadly consequences when a father (Paul Rudd) and daughter (Jenna Ortega) accidentally hit and kill a unicorn while en route to find his billionaire boss seeks to exploit the creatures miraculous curative properties.',
        cast: 'Jenna Ortega, Paul Rudd,Will Poulter',
        rating: 'R',
        videoSrc: "video/Death-of-Unicorn.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=62pyfjnzIuc"
    },
    'm16': {
        title: 'Lilo & Stitch',
        duration: '1hr 48m',
        genre: 'Action/Adventure/CAM',
        year: '2025',
        description: 'A lonely Hawaiian girl befriends a runaway alien, helping to mend her fragmented family.',
        cast: 'Maia Kealoha , Sydney Agudong ,Chris Sanders',
        rating: 'PG',
        videoSrc: "video/Lilo.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=m5fMyIImwEY"
    },
    'm17': {
        title: 'Taken at a Basketball Game',
        duration: '88m',
        genre: 'Drama',
        year: '2025',
        description: 'A desperate fathers attempt to bond with his teenage daughter at a basketball game turns into a frantic search when she vanishes during halftime, forcing him to navigate a packed arena before its too late.',
        cast: 'D.B. Woodside ,Claire Qute ,Moni Ogunsuyi',
        rating: 'PG-13',
        videoSrc: "video/Taken.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=gJaFKvVxikk"
    },
    'm18': {
        title: 'Rosario',
        duration: '88m',
        genre: 'Horror',
        year: '2025',
        description: 'Rosario spends the night with her grandmothers body while she waits for the ambulance to arrive, during a severe snowfall, Rosario is attacked by otherworldly entities that have taken control of her grandmothers body..',
        cast: 'Emeraude Toubia ,David Dastmalchian ,Paul Ben-Victor',
        rating: 'R',
        videoSrc: "video/Rosario.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=xqnhflftMj4"
    },
    'm19': {
        title: 'Drop',
        duration: '1hr 35m',
        genre: 'Drama',
        year: '2025',
        description: 'A widowed mother\'s first date in years takes a terrifying turn when she\'s bombarded with anonymous threatening messages on her phone during their upscale dinner, leaving her questioning if her charming date is behind the harassment.',
        cast: 'Meghann Fahy, Brandon Sklenar ,Violett Beane',
        rating: '   PG-13',
        videoSrc: "video/Drop.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=bs_nFwh5eJw"
    },
    'm20': {
        title: 'The Legend of Ochi',
        duration: '90m',
        genre: 'Adventure/Fiction',
        year: '2025',
        description: 'In a remote village on the island of Carpathia, a shy farm girl named Yuri is raised to fear elusive animals known as ochi. But when Yuri discovers a wounded baby ochi has been left behind, she escapes on a quest to bring him home.',
        cast: 'Helena Zengel, Finn Wolfhard ,Emily Watson',
        rating: 'PG',
        videoSrc: "video/Legend.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=_jTFLg3arYU"
    },
    'm21': {
        title: 'Mission: Impossible - Dead Reckoning',
        duration: '2hr 44m',
        genre: 'Action',
        year: '2023',
        description: 'Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',
        cast: 'Tom Cruise, Hayley Atwell ,Ving Rhames',
        rating: 'PG-13',
        videoSrc: "video/Mission.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=avz06PDqDbM"
    },
    'm22': {
        title: 'Exterritorial',
        duration: '1hr 49m',
        genre: 'Action',
        year: '2025',
        description: 'When a soldiers son vanishes at a US consulate, she illegally remains on the premises to search for him, unknowingly entangling herself in a dangerous conspiracy.',
        cast: 'Tom Cruise, Hayley Atwell ,Ving Rhames',
        rating: 'PG',
        videoSrc: "video/Exterritorial.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=avz06PDqDbM"
    },
    'm23': {
        title: 'The Sandman',
        duration: '1hr 49m',
        genre: 'Fantasy',
        year: '2025',
        description: 'Upon escaping after decades of imprisonment by a mortal wizard, Dream, the personification of dreams, sets about to reclaim his lost equipment..',
        cast: 'Tom Sturridge .Vivienne Acheampong   .Patton Oswalt',
        rating: 'PG',
        videoSrc: "video/sand1.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=avz06PDqDbM"
    },
    'm24': {
        title: 'The Death of Snow White',
        duration: '1hr 50m',
        genre: 'Fiction',
        year: '2025',
        description: 'Pursued by her stepmother for eternal beauty, Snow White flees into a terrifying forest and aligns with seven bloodthirsty dwarves - cold-blooded assassins with a knack for brutal killings. Her spirit is tested in this grim fairy tale.',
        cast: 'Sanae Loutsis   .Chelsea Edmundson    .Tristan Nokes',
        rating: 'PG',
        videoSrc: "video/snow-white.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=avz06PDqDbM"
    },

    // Coming Soon Section
    'coming1': {
        title: 'Venom: The Last Dance',
        duration: '1hr 50m',
        genre: 'Action/Adventure',
        year: '2024',
        description: 'Eddie Brock and Venom must make a devastating decision as they are pursued by a mysterious military man and alien monsters from Venoms home world..',
        cast: 'Tom Hardy ,Chiwetel Ejiofor ,Juno Temple',
        rating: 'PG-13',
        videoSrc: "video/Venom.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=__2bjWbetsA"
    },
    'coming2': {
        title: 'Final Destination: Bloodlines',
        duration: '1h 50m',
        genre: 'Horror',
        year: '2025',
        description: 'Plagued by a recurring violent nightmare, a college student returns home to find the one person who can break the cycle and save her family from the horrific fate that inevitably awaits them.',
        cast: 'Anthony MackieHarrison FordDanny Ramirez',
        rating: 'R',
        videoSrc: "video/final.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=1pHDWnXmK7Y"
    },
    'coming3': {
        title: 'Sinners',
        duration: '2h 17m',
        genre: 'Action/Drama /CAM',
        year: '2025 ',
        description: 'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.',
        cast: 'Miles CatonSaul WilliamsAndrene Ward-Hammond',
        rating: 'PG-13',
        videoSrc: "video/sinners.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=bKGxHflevuk"
    },
    'coming4': {
        title: 'KPop Demon Hunters',
        duration: '1h 35m',
        genre: 'Animation',
        year: '2025',
        description: 'A world-renowned K-Pop girl group balance their lives in the spotlight with their secret identities as demon hunters.',
        cast: 'Doug Cockle ,Joey Batey ,Anya Chalotra',
        rating: 'PG',
        videoSrc: "video/kpop.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=ndl1W4ltcmg"
    },
    'coming5': {
        title: 'Rob1n',
        duration: '1h 35m',
        genre: 'Horror',
        year: '2025',
        description: 'When a robotics expert channels the grief of losing his 11 year-old son into building Robin, a fully functioning robotic doll, a series of horrific events makes it clear Robin will do whatever it takes to have his creator all to himself.',
        cast: 'John-Paul Howard ,Piper Curda ,Jamison Jones',
        rating: 'PG-13',
        videoSrc: "video/robin.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=vwFFhQhQC2M"
    },
    'coming6': {
        title: 'Alchemy of Souls S1E1',
        duration: '1h 20m',
        genre: 'Fantasy',
        year: '2023',
        description: 'A young magicians offspring cursed and not able of magic and a dead lonely sorceress whose spirit is set temporally in other persons weak body have to help each other and fight against the powerful people who want to rule others using the soul transfer magic. So, the young hero begins his dangerous journey to become a powerful magician.',
        cast: 'Lee Jae-wook ,Hwang Min-hyun ,Yoo Joon-sang',
        rating: 'PG-13',
        videoSrc: "video/Alchemy.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=TeYqzhxomu4"
    },
    'coming7': {
        title: 'Warrior Nun S1E1',
        duration: '134 min',
        genre: 'Action',
        year: '2022',
        description: 'After waking up in a morgue, an orphaned teen discovers she now possesses superpowers as the chosen Halo Bearer for a secret sect of demon-hunting nuns.',
        cast: 'Alba Baptista ,Kristina Tonteri-Young ,Lorena Andrea',
        rating: 'PG-13',
        videoSrc: "video/Warrior.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=acdP-NzBhjs"
    },
    'coming8': {
        title: 'Novocaine',
        duration: '1h 50m',
        genre: 'Action',
        year: '2025',
        description: 'When the girl of his dreams is kidnapped, a man incapable of feeling physical pain turns his rare condition into an unexpected advantage in the fight to rescue her.',
        cast: 'Jack QuaidAmber MidthunderRay Nicholson',
        rating: 'R',
        videoSrc: "video/Novocaine.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=-PyOIlJEdqA"
    },
    'coming10': {
        title: 'The Wheel of Time',
        duration: '1hm',
        genre: 'Adventure',
        year: '2025',
        description: 'The lives of five young villagers change forever when a strange and powerful woman arrives, claiming one of them is the child of an ancient prophecy with the power to tip the balance between Light and Dark forever.',
        cast: 'Soufiane MoussouliAdmir SehovicEmmanuel Ohene Boafo',
        rating: 'R',
        videoSrc: "video/wheels.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=Dhg-3ME2L6M"
    },
    'coming11': {
        title: 'Striking Rescue',
        duration: '1h 55m',
        genre: 'Action/Drama',
        year: '2025',
        description: 'A veteran Muay Thai expert goes on a take-no-prisoners mission of revenge after his wife and daughter are brutally murdered by mysterious forces.',
        cast: 'Chen Duo-Yi ,Junjia Hong ,Tony Jaa',
        rating: 'PG-13',
        videoSrc: "video/Striking.mp4",
        trailerSrc: "https://www.youtube.com/watch?v=uXfzJb-IUrk"
    }
};

// Get modal elements
const modal = document.getElementById('movieModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalMovieTitle');
const modalDuration = document.getElementById('modalMovieDuration');
const modalGenre = document.getElementById('modalMovieGenre');
const modalYear = document.getElementById('modalMovieYear');
const modalDescription = document.getElementById('modalMovieDescription');
const modalCast = document.getElementById('modalMovieCast');
const closeBtn = document.getElementById('modalCloseBtn') || document.querySelector('#movieModal .close');
const playBtn = document.getElementById('playMovieBtn');
const trailerBtn = document.querySelector('.btn-play');
const videoContainer = document.getElementById('videoContainer');
const moviePlayer = document.getElementById('moviePlayer');
const modalDetails = document.querySelector('.modal-details');

// Watch Party Elements
const hostPartyBtn = document.getElementById('hostPartyBtn');
const joinPartyBtn = document.getElementById('joinPartyBtn');
const watchPartyModal = document.getElementById('watchPartyModal');
const closeWatchParty = document.getElementById('closeWatchParty');
const partyMovieTitle = document.getElementById('partyMovieTitle');
const partyMoviePlayer = document.getElementById('partyMoviePlayer');
const partyChatMessages = document.getElementById('partyChatMessages');
const partyChatForm = document.getElementById('partyChatForm');
const partyChatInput = document.getElementById('partyChatInput');
const partyLink = document.getElementById('partyLink');
const copyPartyLink = document.getElementById('copyPartyLink');

let currentPartyId = null;
let isHost = false;
let partySocket = null;
let partyClientId = null;
let suppressSyncBroadcast = false;

// Utility: Generate random party ID
function generatePartyId() {
    return 'party-' + Math.random().toString(36).substr(2, 9);
}

// Utility: Get movie info from modal
function getCurrentMovieInfo() {
    return {
        title: modalTitle.textContent,
        videoSrc: playBtn.getAttribute('data-movie')
    };
}

function getPartyJoinLink(partyId, movieSrc) {
    const params = new URLSearchParams();
    params.set('party', partyId);
    if (movieSrc) {
        params.set('src', encodeURIComponent(movieSrc));
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function getPartyDisplayName() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData?.name) return userData.name;
    } catch (error) {
        console.error('Failed to resolve party display name:', error);
    }
    return 'Guest';
}

function ensurePartyMetaUI() {
    const partyMovieTitle = document.getElementById('partyMovieTitle');
    if (!partyMovieTitle) return;

    let metaWrap = document.getElementById('partyMetaInfo');
    if (!metaWrap) {
        metaWrap = document.createElement('div');
        metaWrap.id = 'partyMetaInfo';
        metaWrap.style.display = 'flex';
        metaWrap.style.gap = '10px';
        metaWrap.style.alignItems = 'center';
        metaWrap.style.flexWrap = 'wrap';
        metaWrap.style.margin = '8px 0 12px 0';

        const roleBadge = document.createElement('span');
        roleBadge.id = 'partyRoleBadge';
        roleBadge.style.padding = '4px 10px';
        roleBadge.style.borderRadius = '999px';
        roleBadge.style.fontSize = '0.85rem';
        roleBadge.style.fontWeight = '600';
        roleBadge.style.background = 'rgba(255, 255, 255, 0.15)';
        roleBadge.style.color = '#fff';

        const syncStatus = document.createElement('span');
        syncStatus.id = 'partySyncStatus';
        syncStatus.style.padding = '4px 10px';
        syncStatus.style.borderRadius = '999px';
        syncStatus.style.fontSize = '0.85rem';
        syncStatus.style.background = 'rgba(255, 255, 255, 0.12)';
        syncStatus.style.color = '#ddd';

        metaWrap.appendChild(roleBadge);
        metaWrap.appendChild(syncStatus);
        partyMovieTitle.insertAdjacentElement('afterend', metaWrap);
    }
}

function setPartyRoleBadge(hostMode) {
    const roleBadge = document.getElementById('partyRoleBadge');
    if (!roleBadge) return;
    roleBadge.textContent = hostMode ? 'Host' : 'Guest';
    roleBadge.style.background = hostMode ? 'rgba(22, 163, 74, 0.3)' : 'rgba(59, 130, 246, 0.3)';
}

function setPartySyncStatus(text, tone = 'neutral') {
    const syncStatus = document.getElementById('partySyncStatus');
    if (!syncStatus) return;
    syncStatus.textContent = text;

    if (tone === 'good') {
        syncStatus.style.background = 'rgba(22, 163, 74, 0.25)';
        syncStatus.style.color = '#d1fae5';
        return;
    }
    if (tone === 'warn') {
        syncStatus.style.background = 'rgba(245, 158, 11, 0.25)';
        syncStatus.style.color = '#fef3c7';
        return;
    }
    syncStatus.style.background = 'rgba(255, 255, 255, 0.12)';
    syncStatus.style.color = '#ddd';
}

// Function to open modal with movie data - FIXED BACKDROP
function openMovieModal(movieId, imgSrc) {
    const movie = movieData[movieId];
    if (movie) {
        // Select the modal backdrop element correctly
        const modalBackdrop = document.getElementById('modalBackdrop');

        if (modalBackdrop) {
            // Set the background image with proper styling
            modalBackdrop.style.backgroundImage = `url(${imgSrc})`;
            modalBackdrop.style.backgroundSize = 'cover';
            modalBackdrop.style.backgroundPosition = 'center';
            modalBackdrop.style.backgroundRepeat = 'no-repeat';
            modalBackdrop.style.filter = 'blur(2px)'; // Optional: adds a subtle blur effect
            modalBackdrop.style.opacity = '0.3'; // Optional: reduce opacity for better text readability
        }

        // Update modal content
        modalTitle.textContent = movie.title;
        modalDuration.textContent = movie.duration;
        modalGenre.textContent = movie.genre;
        modalYear.textContent = movie.year;
        modalDescription.textContent = movie.description;
        modalCast.textContent = movie.cast;

        // Populate rating pill (new element)
        const modalRating = document.getElementById('modalMovieRating');
        if (modalRating) modalRating.textContent = (movie.rating || '').trim() || 'NR';

        // Set data attributes for video playback
        playBtn.setAttribute('data-movie', movie.videoSrc);
        trailerBtn.setAttribute('data-trailer', movie.trailerSrc);

        // Show modal and details, hide video player
        modal.style.display = 'flex';
        modalDetails.style.display = 'block';
        videoContainer.style.display = 'none';
        document.body.style.overflow = 'hidden';

        // Always re-select and re-attach event listeners for Watch Party buttons
        const hostPartyBtn = document.getElementById('hostPartyBtn');
        const joinPartyBtn = document.getElementById('joinPartyBtn');
        if (hostPartyBtn) {
            hostPartyBtn.onclick = function (e) {
                e.preventDefault();
                const movie = getCurrentMovieInfo();
                const partyId = generatePartyId();
                const p = new URLSearchParams({
                    party: partyId,
                    host: '1',
                });
                if (movie.videoSrc) p.set('src', encodeURIComponent(movie.videoSrc));
                if (movie.title) p.set('title', encodeURIComponent(movie.title));
                hideModalIfOpen();
                window.location.href = 'watchparty.html?' + p.toString();
            };
        }
        if (joinPartyBtn) {
            joinPartyBtn.onclick = function (e) {
                e.preventDefault();
                const joinInput = prompt('Enter Watch Party ID or paste invite link:');
                if (!joinInput) return;

                // Accept full watchparty.html links or bare party IDs
                let parsedPartyId = '';
                let parsedSrc = '';
                let parsedTitle = '';
                try {
                    const u = new URL(joinInput);
                    parsedPartyId = u.searchParams.get('party') || '';
                    parsedSrc = u.searchParams.get('src') || '';
                    parsedTitle = u.searchParams.get('title') || '';
                } catch (_) {
                    // Not a URL — treat as bare party ID
                    parsedPartyId = joinInput.replace(/.*party=([\w-]+).*/, '$1').trim();
                    const srcMatch = joinInput.match(/[?&]src=([^&]+)/);
                    if (srcMatch) parsedSrc = srcMatch[1];
                }
                if (!parsedPartyId) { alert('Could not read a party ID from that input.'); return; }

                const movie = getCurrentMovieInfo();
                if (parsedSrc) movie.videoSrc = decodeURIComponent(parsedSrc);
                if (parsedTitle) movie.title = decodeURIComponent(parsedTitle);

                const p = new URLSearchParams({ party: parsedPartyId });
                if (movie.videoSrc) p.set('src', encodeURIComponent(movie.videoSrc));
                if (movie.title) p.set('title', encodeURIComponent(movie.title));
                hideModalIfOpen();
                window.location.href = 'watchparty.html?' + p.toString();
            };
        }

        // ── HOST UPLOAD PARTY ──────────────────────────────────────────
        const uploadPartyBtn = document.getElementById('uploadPartyBtn');
        if (uploadPartyBtn) {
            uploadPartyBtn.onclick = function (e) {
                e.preventDefault();
                hideModalIfOpen();
                window.location.href = 'uploadparty.html?host=1';
            };
        }

        // ── JOIN UPLOAD PARTY ──────────────────────────────────────────
        const joinUploadPartyBtn = document.getElementById('joinUploadPartyBtn');
        if (joinUploadPartyBtn) {
            joinUploadPartyBtn.onclick = function (e) {
                e.preventDefault();
                const input = prompt('Enter Upload Party ID or paste invite link:');
                if (!input) return;
                let partyId = '';
                try {
                    const u = new URL(input);
                    partyId = u.searchParams.get('party') || '';
                } catch (_) {
                    // Not a URL — treat whole string as the party ID
                    partyId = input.replace(/.*[?&]party=([\w-]+).*/, '$1').trim();
                    if (!partyId) partyId = input.trim();
                }
                if (!partyId) { alert('Could not read a party ID from that input.'); return; }
                hideModalIfOpen();
                window.location.href = 'uploadparty.html?party=' + partyId;
            };
        }
    }
}

// Single, clean event listener that navigates in same tab
if (playBtn) {
    playBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const movieSrc = this.getAttribute('data-movie');
        const encodedSrc = encodeURIComponent(movieSrc);
        window.location.href = `player.html?src=${encodedSrc}`;
    });
}

// Get elements
const modalContent = document.querySelector('.modal-content');

// Watch Trailer Functionality
if (trailerBtn) {
    trailerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const trailerSrc = this.getAttribute('data-trailer');
        const isYouTube = trailerSrc.includes('youtube.com') || trailerSrc.includes('youtu.be');

        // Clear previous content
        videoContainer.innerHTML = '';

        if (isYouTube) {
            // Function to extract YouTube video ID from full or short URLs
            function getYouTubeVideoId(url) {
                const match = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&#?\n]+)/);
                return match ? match[1] : null;
            }

            const videoId = getYouTubeVideoId(trailerSrc);
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.allow = 'autoplay; encrypted-media';
            iframe.allowFullscreen = true;
            iframe.frameBorder = '0';

            videoContainer.appendChild(iframe);
        } else {
            // Handle local MP4 trailers
            moviePlayer.src = trailerSrc;
            moviePlayer.style.display = 'block';
            moviePlayer.play();
            videoContainer.appendChild(moviePlayer);
        }

        modalContent.classList.add('video-playing');
        videoContainer.style.display = 'block';
    });
}

let videoWasPlaying = false;

// Close Modal Functionality
function closeModal() {
    modal.style.display = 'none';

    // Pause and reset local video player
    if (moviePlayer) {
        moviePlayer.pause();
        moviePlayer.currentTime = 0;
    }

    // Remove YouTube iframe if it exists
    const iframe = videoContainer.querySelector('iframe');
    if (iframe) {
        // This stops YouTube videos from playing
        iframe.src = '';
        videoContainer.removeChild(iframe);
    }

    modalContent.classList.remove('video-playing');
    videoContainer.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Only refresh if video was playing
    if (videoWasPlaying) {
        setTimeout(() => {
            location.reload();
        }, 300);
        videoWasPlaying = false;
    }
}

// Assign the close function to both close button and outside click
if (closeBtn) {
    closeBtn.onclick = closeModal;
}
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Show Watch Party Modal
function showWatchPartyModal(movie, partyId, hostMode) {
    // Always select elements fresh in case modal is loaded late
    const watchPartyModal = document.getElementById('watchPartyModal');
    const partyMovieTitle = document.getElementById('partyMovieTitle');
    const partyMoviePlayer = document.getElementById('partyMoviePlayer');
    const partyChatMessages = document.getElementById('partyChatMessages');
    const partyLink = document.getElementById('partyLink');
    const closeWatchParty = document.getElementById('closeWatchParty');

    // Add or select the emoji reactions UI
    let partyReactions = document.getElementById('partyReactions');
    let partyEmojiBar = document.getElementById('partyEmojiBar');
    if (!partyReactions) {
        partyReactions = document.createElement('div');
        partyReactions.id = 'partyReactions';
        partyReactions.style.margin = '10px 0';
        partyReactions.style.maxHeight = '300px';
        partyReactions.style.overflow = 'auto';
        partyReactions.innerHTML = `
            <h4 style="margin-bottom:6px;color:#fff;">Watch Party Chat & Reactions</h4>
            <ul id="partyReactionsList" style="
                list-style:none;
                padding:0;
                margin:0;
                max-height: 250px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
            "></ul>
        `;
        partyMoviePlayer.parentNode.insertBefore(partyReactions, partyMoviePlayer.nextSibling);
    } else {
        partyReactions.querySelector('#partyReactionsList').innerHTML = '';
    }
    // Emoji bar
    if (!partyEmojiBar) {
        partyEmojiBar = document.createElement('div');
        partyEmojiBar.id = 'partyEmojiBar';
        partyEmojiBar.style.display = 'flex';
        partyEmojiBar.style.gap = '10px';
        partyEmojiBar.style.margin = '8px 0 14px 0';
        partyEmojiBar.style.justifyContent = 'center';
        const emojis = ['😂', '😮', '😍', '👍', '👎', '🎉', '😢', '🔥'];
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = emoji;
            btn.style.fontSize = '1.7rem';
            btn.style.background = '#fff';
            btn.style.border = '1px solid #eee';
            btn.style.borderRadius = '50%';
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'background 0.2s, box-shadow 0.2s';
            btn.onmouseover = () => { btn.style.background = '#f0f0f0'; btn.style.boxShadow = '0 2px 8px #eee'; };
            btn.onmouseout = () => { btn.style.background = '#fff'; btn.style.boxShadow = 'none'; };
            btn.onclick = function () {
                if (!partySocket || partySocket.readyState !== WebSocket.OPEN) return;
                const time = Math.floor(partyMoviePlayer.currentTime);
                addPartyReaction('You', emoji, time);
                sendPartyEvent('party-reaction', { user: getPartyDisplayName(), reaction: emoji, time });
            };
            partyEmojiBar.appendChild(btn);
        });
        partyReactions.insertBefore(partyEmojiBar, partyReactions.querySelector('#partyReactionsList'));
    } else {
        partyEmojiBar.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }

    if (!watchPartyModal || !partyMovieTitle || !partyMoviePlayer || !partyChatMessages || !partyLink) {
        alert('Watch Party modal elements not found in the DOM.');
        return;
    }

    partyMovieTitle.textContent = `Watch Party: ${movie.title}`;
    partyMoviePlayer.src = movie.videoSrc;
    partyChatMessages.innerHTML = '';
    watchPartyModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    currentPartyId = partyId;
    isHost = hostMode;
    // Set party link
    const link = getPartyJoinLink(partyId, movie.videoSrc);
    partyLink.value = link;
    ensurePartyMetaUI();
    setPartyRoleBadge(hostMode);
    setPartySyncStatus(hostMode ? 'Waiting for guests...' : 'Connecting...', 'neutral');

    // Always re-attach close handler for the X button
    if (closeWatchParty) {
        closeWatchParty.onclick = hideWatchPartyModal;
    }
    // Clear reactions list
    const partyReactionsList = document.getElementById('partyReactionsList');
    if (partyReactionsList) partyReactionsList.innerHTML = '';
}

// Hide Watch Party Modal
function hideWatchPartyModal() {
    // Always select elements fresh in case modal is loaded late
    const watchPartyModal = document.getElementById('watchPartyModal');
    const partyMoviePlayer = document.getElementById('partyMoviePlayer');
    if (watchPartyModal) watchPartyModal.style.display = 'none';
    if (partyMoviePlayer) {
        partyMoviePlayer.pause();
        partyMoviePlayer.currentTime = 0;
        // Remove dynamic event handlers so they don't fire after close
        partyMoviePlayer.onplay = null;
        partyMoviePlayer.onpause = null;
        partyMoviePlayer.onseeked = null;
    }
    // Remove member count badge
    const badge = document.getElementById('partyMemberCount');
    if (badge) badge.remove();

    document.body.style.overflow = 'auto';
    if (partySocket) {
        partySocket.close();
    }
    partySocket = null;
    partyClientId = null;   // reset so a fresh ID is used next session
    currentPartyId = null;
    isHost = false;
    setPartySyncStatus('Disconnected', 'warn');
}

// Copy party link
if (copyPartyLink) {
    copyPartyLink.onclick = function () {
        partyLink.select();
        document.execCommand('copy');
        copyPartyLink.textContent = 'Copied!';
        setTimeout(() => { copyPartyLink.textContent = 'Copy Link'; }, 1500);
    };
}

// Close watch party modal
if (closeWatchParty) closeWatchParty.onclick = hideWatchPartyModal;

// Hide movie modal if open
function hideModalIfOpen() {
    if (modal && modal.style.display === 'block') closeModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCH PARTY SERVER URL
// Netlify (and most static hosts) cannot run WebSockets.
// Deploy server.js to a free host like https://render.com, then paste the URL:
//   e.g.  'https://filmplus-party.onrender.com'
// Leave as '' to auto-detect (works when running locally with `node server.js`)
// ─────────────────────────────────────────────────────────────────────────────
const PARTY_SERVER_URL = '';   // ← paste your Render / Railway URL here

function getPartySocketUrl() {
    if (PARTY_SERVER_URL) {
        // Convert https:// → wss://  or  http:// → ws://
        return PARTY_SERVER_URL.replace(/^http/, 'ws') + '/ws';
    }
    // Local fallback — only works when server.js is running on the same machine
    if (window.location.protocol === 'https:') {
        return `wss://${window.location.host}/ws`;
    }
    return `ws://${window.location.host}/ws`;
}

function sendPartyEvent(type, payload = {}) {
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) return;
    partySocket.send(JSON.stringify({
        type,
        partyId: currentPartyId,
        senderId: partyClientId,
        payload
    }));
}

// Setup Watch Party (WebSocket live chat + sync)
function setupWatchParty(movie, partyId, hostMode) {
    showWatchPartyModal(movie, partyId, hostMode);
    setupChatHandling();

    // Bind video sync events AFTER the modal is open so the player element exists
    const player = document.getElementById('partyMoviePlayer');
    if (player) {
        player.onplay = function () { if (isHost && !suppressSyncBroadcast) broadcastVideoSync('play', player.currentTime); };
        player.onpause = function () { if (isHost && !suppressSyncBroadcast) broadcastVideoSync('pause', player.currentTime); };
        player.onseeked = function () { if (isHost && !suppressSyncBroadcast) broadcastVideoSync('seek', player.currentTime); };
    }

    initPartySocket(movie, partyId, hostMode);
}

function initPartySocket(movie, partyId, hostMode) {
    if (partySocket) {
        partySocket.close();
        partySocket = null;
    }

    // Keep a stable clientId across reconnects within the same party session
    if (!partyClientId) {
        partyClientId = `client-${Math.random().toString(36).slice(2, 10)}`;
    }

    setPartySyncStatus('Connecting...', 'neutral');
    partySocket = new WebSocket(getPartySocketUrl());

    // Host sync heartbeat — keeps guests in sync every 5 seconds
    let hostHeartbeat = null;

    partySocket.addEventListener('open', function () {
        sendPartyEvent('join', {
            role: hostMode ? 'host' : 'guest',
            user: getPartyDisplayName()
        });
        setPartySyncStatus(hostMode ? 'Live — share your link!' : 'Joined — syncing with host…', 'good');

        if (hostMode) {
            // Heartbeat: broadcast play state every 5 s so guests stay in sync
            hostHeartbeat = setInterval(() => {
                const player = document.getElementById('partyMoviePlayer');
                if (!partySocket || partySocket.readyState !== WebSocket.OPEN) {
                    clearInterval(hostHeartbeat);
                    return;
                }
                if (player) {
                    broadcastVideoSync(player.paused ? 'pause' : 'play', player.currentTime);
                }
            }, 5000);
        } else {
            // Guest: ask host to send current playback state
            sendPartyEvent('party-join-request', { user: getPartyDisplayName() });
        }
    });

    partySocket.addEventListener('close', function () {
        clearInterval(hostHeartbeat);
        setPartySyncStatus('Disconnected — attempting reconnect…', 'warn');

        // Auto-reconnect after 3 s if the party modal is still open
        const watchPartyModal = document.getElementById('watchPartyModal');
        if (watchPartyModal && watchPartyModal.style.display !== 'none' && currentPartyId) {
            setTimeout(() => {
                if (currentPartyId) {
                    partyClientId = null; // get a fresh id on reconnect
                    initPartySocket(movie, partyId, hostMode);
                }
            }, 3000);
        }
    });

    partySocket.addEventListener('error', function () {
        setPartySyncStatus('Connection error', 'warn');
    });

    partySocket.addEventListener('message', function (event) {
        let packet = null;
        try {
            packet = JSON.parse(event.data);
        } catch (_e) {
            return;
        }
        // Ignore own packets (server echoes for some event types)
        if (!packet || packet.senderId === partyClientId) return;

        const data = packet.payload || {};

        switch (packet.type) {
            case 'chat-message':
                addChatMessage(data.user || 'Guest', data.message || '', data.timestamp, false, data.isSystem);
                break;

            case 'video-sync':
                // Guests apply sync; host ignores (they're the source of truth)
                if (!isHost) {
                    if (data.targetClientId && data.targetClientId !== partyClientId) break;
                    syncVideo(data);
                    setPartySyncStatus('Synced with host ✓', 'good');
                }
                break;

            case 'party-join-request': {
                // Host responds with current playback state directed to the requesting guest
                if (!isHost) break;
                const playerEl = document.getElementById('partyMoviePlayer');
                if (!playerEl) break;
                sendPartyEvent('video-sync', {
                    action: playerEl.paused ? 'pause' : 'play',
                    time: playerEl.currentTime,
                    targetClientId: packet.senderId
                });
                break;
            }

            case 'party-reaction':
                addPartyReaction(data.user, data.reaction, data.time);
                break;

            case 'member-update':
                updateMemberCount(data.members || []);
                break;

            default:
                break;
        }
    });
}

// Chat message handling
function setupChatHandling() {
    const chatInput = document.getElementById('partyChatInput');
    const chatForm = document.getElementById('partyChatForm');
    const reactionsList = document.getElementById('partyReactionsList');

    // Create reactions list if it doesn't exist
    if (!reactionsList) {
        const partyReactions = document.createElement('div');
        partyReactions.id = 'partyReactions';
        partyReactions.style.margin = '10px 0';
        partyReactions.style.maxHeight = '300px';
        partyReactions.style.overflow = 'auto';
        partyReactions.innerHTML = `
            <h4 style="margin-bottom:6px;color:#fff;">Watch Party Chat & Reactions</h4>
            <ul id="partyReactionsList" style="
                list-style:none;
                padding:0;
                margin:0;
                max-height: 250px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
            "></ul>
        `;
        const videoContainer = document.querySelector('.party-video-container');
        if (videoContainer) {
            videoContainer.insertAdjacentElement('afterend', partyReactions);
        }
    }

    function sendChatMessage() {
        if (!chatInput) return;
        const msg = chatInput.value.trim();
        if (!msg || !partySocket || partySocket.readyState !== WebSocket.OPEN) return;

        addChatMessage('You', msg);

        // Clear input
        chatInput.value = '';
    }

    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            sendChatMessage();
        });
    }

}

// Add chat message to UI
function addChatMessage(user, message, explicitTimestamp, shouldBroadcast = user === 'You', isSystem = false) {
    if (!message) return;
    const partyMoviePlayer = document.getElementById('partyMoviePlayer');
    const timestamp = Number.isFinite(explicitTimestamp)
        ? explicitTimestamp
        : (partyMoviePlayer ? Math.floor(partyMoviePlayer.currentTime) : 0);
    const formattedTime = formatTime(timestamp);
    const chatMessages = document.getElementById('partyChatMessages');

    if (chatMessages) {
        const item = document.createElement('div');
        item.style.marginBottom = '8px';
        item.style.padding = '8px 10px';
        item.style.borderRadius = '8px';
        item.style.background = isSystem ? 'rgba(255,220,80,0.12)' : 'rgba(255,255,255,0.08)';
        item.style.color = isSystem ? '#fde68a' : '#fff';
        item.style.fontStyle = isSystem ? 'italic' : 'normal';
        item.style.fontSize = isSystem ? '0.9rem' : '1rem';
        item.textContent = isSystem ? `✦ ${message}` : `[${formattedTime}] ${user}: ${message}`;
        chatMessages.appendChild(item);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Keep mirrored in reactions feed area
    const reactionsList = document.getElementById('partyReactionsList');
    if (reactionsList) {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '10px';

        // Message container
        const messageContainer = document.createElement('div');
        messageContainer.style.flex = '1';
        messageContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        messageContainer.style.borderRadius = '8px';
        messageContainer.style.padding = '8px 12px';

        // Timestamp element
        const timeLabel = document.createElement('span');
        timeLabel.textContent = `[${formattedTime}]`;
        timeLabel.style.color = '#888';
        timeLabel.style.fontSize = '0.9rem';
        timeLabel.style.marginRight = '8px';
        timeLabel.style.cursor = 'pointer';
        timeLabel.title = 'Jump to this moment';
        timeLabel.onclick = function () {
            partyMoviePlayer.currentTime = timestamp;
        };

        // Username element
        const userLabel = document.createElement('span');
        userLabel.textContent = `${user}: `;
        userLabel.style.fontWeight = 'bold';
        userLabel.style.color = '#fff';

        // Message text
        const messageText = document.createElement('span');
        messageText.textContent = message;
        messageText.style.color = '#fff';

        messageContainer.appendChild(timeLabel);
        messageContainer.appendChild(userLabel);
        messageContainer.appendChild(messageText);
        li.appendChild(messageContainer);
        reactionsList.appendChild(li);

        // Scroll to bottom
        reactionsList.scrollTop = reactionsList.scrollHeight;
    }

    // Broadcast to room in real time
    if (shouldBroadcast) {
        sendPartyEvent('chat-message', {
            user: getPartyDisplayName(),
            message: message,
            timestamp: timestamp
        });
        setPartySyncStatus('Chat live', 'good');
    }
}

// Add party reaction to UI
function addPartyReaction(user, reaction, time) {
    let partyReactionsList = document.getElementById('partyReactionsList');
    if (!partyReactionsList) return;
    const li = document.createElement('li');
    li.style.marginBottom = '8px';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '10px';
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = reaction;
    emojiSpan.style.fontSize = '2rem';
    emojiSpan.style.lineHeight = '1';
    emojiSpan.style.cursor = 'pointer';
    emojiSpan.title = 'Jump to this moment';
    emojiSpan.onclick = function () {
        const player = document.getElementById('partyMoviePlayer');
        if (player) {
            player.currentTime = time;
            player.play();
        }
    };
    const timeStr = formatTime(time);
    const timeLabel = document.createElement('span');
    timeLabel.textContent = `[${timeStr}]`;
    timeLabel.style.color = '#888';
    timeLabel.style.fontSize = '0.95rem';
    timeLabel.style.marginRight = '4px';
    timeLabel.style.cursor = 'pointer';
    timeLabel.title = 'Jump to this moment';
    timeLabel.onclick = emojiSpan.onclick;
    const userLabel = document.createElement('span');
    userLabel.textContent = user + ':';
    userLabel.style.fontWeight = 'bold';
    userLabel.style.fontSize = '1rem';
    li.appendChild(emojiSpan);
    li.appendChild(timeLabel);
    li.appendChild(userLabel);
    partyReactionsList.appendChild(li);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Update the viewer count badge in the watch party modal
function updateMemberCount(members) {
    let badge = document.getElementById('partyMemberCount');
    if (!badge) {
        // Create badge next to partyMovieTitle
        const titleEl = document.getElementById('partyMovieTitle');
        if (!titleEl) return;
        badge = document.createElement('span');
        badge.id = 'partyMemberCount';
        badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-left: 12px;
            padding: 3px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.15);
            color: #fff;
            font-size: 0.85rem;
            font-weight: 600;
            vertical-align: middle;
        `;
        titleEl.insertAdjacentElement('afterend', badge);
    }
    const count = Array.isArray(members) ? members.length : 0;
    badge.textContent = `👥 ${count} watching`;
}

// NOTE: video sync event listeners (onplay/onpause/onseeked) are now bound
// inside setupWatchParty() after the modal opens, so the player element exists.
// See setupWatchParty() above.

function broadcastVideoSync(action, time) {
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN || suppressSyncBroadcast) return;
    const player = document.getElementById('partyMoviePlayer');
    sendPartyEvent('video-sync', {
        action,
        time: time !== undefined ? time : (player ? player.currentTime : 0)
    });
}

function syncVideo(data) {
    const player = document.getElementById('partyMoviePlayer');
    if (!player) return;
    suppressSyncBroadcast = true;
    if (data.action === 'seek' && Math.abs(player.currentTime - data.time) > 0.5) {
        player.currentTime = data.time;
    }
    if (data.action === 'play') {
        if (Math.abs(player.currentTime - data.time) > 0.5) {
            player.currentTime = data.time;
        }
        player.play().catch(() => { });
    }
    if (data.action === 'pause') {
        if (Math.abs(player.currentTime - data.time) > 0.5) {
            player.currentTime = data.time;
        }
        player.pause();
    }
    setTimeout(() => { suppressSyncBroadcast = false; }, 300);
}

// This is the main DOMContentLoaded listener where we will group all initializations
document.addEventListener('DOMContentLoaded', function () {

    // ENSURE MODALS ARE HIDDEN ON PAGE LOAD - MOVED TO TOP PRIORITY
    hideModalOnLoad();

    // GENRE FILTERING
    const filterButtons = document.querySelectorAll('.genre-btn');
    const movieBoxes = document.querySelectorAll('.movies-container .box');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const selectedGenre = this.getAttribute('data-genre').toLowerCase();

            movieBoxes.forEach(box => {
                const genreSpan = box.querySelector('span');
                if (genreSpan) {
                    const movieGenreText = genreSpan.textContent.toLowerCase();
                    if (selectedGenre === 'all' || movieGenreText.includes(selectedGenre)) {
                        box.style.display = 'block';
                    } else {
                        box.style.display = 'none';
                    }
                }
            });
        });
    });

    // UPDATED MODAL CLICK EVENTS - improved image source detection and backdrop fix
    document.querySelectorAll('.movies-container .box-img, .coming-container .box-img, .home .container-slide').forEach(box => {
        box.addEventListener('click', function () {
            const img = this.querySelector('img');
            if (img) {
                const imgSrc = img.src;

                // Extract movie ID from image source
                let movieId;
                const imgName = imgSrc.split('/').pop().split('.')[0];

                // Handle different naming conventions
                if (imgName.startsWith('home')) {
                    movieId = imgName; // home1, home2, etc.
                } else if (imgName.startsWith('coming')) {
                    movieId = imgName; // coming1, coming2, etc.
                } else if (imgName.startsWith('m')) {
                    movieId = imgName; // m1, m2, etc.
                } else {
                    // Fallback: try to match by movie title or other logic
                    const movieTitle = this.closest('.box')?.querySelector('h3')?.textContent ||
                        this.closest('.container-slide')?.querySelector('h1')?.textContent;

                    // Find movieId by matching title
                    movieId = Object.keys(movieData).find(id =>
                        movieData[id].title.toLowerCase() === movieTitle?.toLowerCase()
                    ) || imgName;
                }

                console.log('Opening modal for:', movieId, 'with image:', imgSrc);
                openMovieModal(movieId, imgSrc);
            }
        });
    });

    // SEARCH FORM
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const pageHeader = document.querySelector('header');
    const authContainer = pageHeader ? pageHeader.querySelector('.auth-container') : null;
    const mobileSearchMount = document.getElementById('mobileSearchMount');
    const MOBILE_SEARCH_BREAKPOINT = 768;

    function relocateSearchBarForMobile() {
        if (!searchForm || !pageHeader || !authContainer || !mobileSearchMount) return;

        const isMobile = window.innerWidth <= MOBILE_SEARCH_BREAKPOINT;
        if (isMobile) {
            if (searchForm.parentElement !== mobileSearchMount) {
                mobileSearchMount.appendChild(searchForm);
            }
            return;
        }

        if (searchForm.parentElement !== pageHeader) {
            pageHeader.insertBefore(searchForm, authContainer);
        }
    }

    relocateSearchBarForMobile();
    window.addEventListener('resize', relocateSearchBarForMobile);

    // Helper: remove any existing "no results" message
    function removeNoResultsMsg() {
        const existing = document.getElementById('noResultsMsg');
        if (existing) existing.remove();
    }

    // Shared search logic — runs on every keystroke and on submit
    function runSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const moviesContainer = document.querySelector('.movies-container');
        const movies = document.querySelectorAll('.movies-container .box');

        // Empty query → restore everything
        if (!query) {
            movies.forEach(movie => { movie.style.display = ''; });
            removeNoResultsMsg();
            return;
        }

        let matchCount = 0;
        movies.forEach(movie => {
            const titleText = (movie.querySelector('h3')?.textContent || '').toLowerCase();
            const genreText = (movie.querySelector('span')?.textContent || '').toLowerCase();

            if (titleText.includes(query) || genreText.includes(query)) {
                movie.style.display = '';
                matchCount++;
            } else {
                movie.style.display = 'none';
            }
        });

        // Show / update the "no results" message
        removeNoResultsMsg();
        if (matchCount === 0 && moviesContainer) {
            const msg = document.createElement('p');
            msg.id = 'noResultsMsg';
            msg.style.cssText = [
                'grid-column: 1 / -1',
                'text-align: center',
                'color: rgba(255,255,255,0.6)',
                'padding: 2rem 0',
                'font-size: 1rem',
            ].join(';');
            msg.textContent = `No movies found for "${searchInput.value.trim()}"`;
            moviesContainer.appendChild(msg);
        }

        // Scroll to the movies section so the user can see results
        const moviesSection = document.getElementById('movies');
        if (moviesSection) {
            moviesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (searchForm) {
        // Still prevent page reload on Enter / icon click
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            runSearch();
        });
    }

    if (searchInput) {
        // Fire on every keystroke — no button press needed
        searchInput.addEventListener('input', runSearch);
    }

    // ALERTS — never show to logged-in users
    const skipAlert = sessionStorage.getItem('skipAlert');
    const isLoggedIn = (() => { try { return JSON.parse(localStorage.getItem('userData'))?.isLoggedIn; } catch (e) { return false; } })();
    if (!skipAlert && !isLoggedIn) {
        setTimeout(() => {
            alert('Yo Fam! To get more information and notification on the release of new movies just [ Subscribe ].🥳🥳');
            const newsletter = document.getElementById('newsletter');
            if (newsletter) {
                newsletter.scrollIntoView({ behavior: 'smooth' });
            }
        }, 10000);

        setTimeout(() => {
            alert('Yo Fam! Try the [ Book Now ] feature which allows you to set a time and date for when you you want to watch your next new movie so u do not forget ');
            const home = document.getElementById('home');
            if (home) {
                home.scrollIntoView({ behavior: 'smooth' });
            }
        }, 120000);
    } else {
        sessionStorage.removeItem('skipAlert');
    }

    // SMOOTH SCROLL FOR NAV LINKS
    // Guard against bare '#' hrefs — document.querySelector('#') throws a SyntaxError
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return; // nothing to scroll to, let default run
            e.preventDefault();
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (_err) {
                // Malformed selector — skip silently
            }
        });
    });

    // AUTO-JOIN: redirect to watchparty.html if index.html is opened with ?party=
    const params = new URLSearchParams(window.location.search);
    const partyId = params.get('party');
    if (partyId) {
        // Forward all params to the dedicated watch party page
        window.location.replace('watchparty.html?' + params.toString());
    }

});