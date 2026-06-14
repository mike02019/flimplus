// This will be called when the book page loads in the SPA
function initBookPage() {
    const movies = [
        {
            id: 'm1',
            title: 'A Working Man',
            genre: 'Action',
            duration: '1hr 54m',
            year: '2025',
            rating: '4.9/5',
            image: 'img/m1.jpg',
            description: 'Levon Cade left his profession behind to work construction and be a good dad to his daughter. But when a local girl vanishes, hes asked to return to the skills that made him a mythic figure in the shadowy world of counter-terrorism.',
            cast: 'Jason Statham, Jason Flemyng, Merab Ninidze',
            videoSrc: "video/Working-Man.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=mdfrG2cLK58"
        },
        {
            id: 'm3',
            title: 'MobLand',
            genre: 'Action',
            duration: '50m',
            year: '2025',
            rating: '4.9/5',
            image: 'img/m3.jpg',
            description: 'Power is up for grabs as two warring crime families clash in a battle that threatens to topple empires. In the crossfire stands Harry Da Souza, a street-smart fixer who knows too well where loyalties lie when opposing forces collide.',
            cast: 'Tsuyoshi c, Kusanagi Kanata, Hosoda Non',
            videoSrc: "video/MobLand.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=bYopWaT8Sr0"
        },
        {
            id: 'm4',
            title: 'Conclave',
            genre: 'Thriller',
            duration: '2hr',
            year: '2024',
            rating: '4.6/5',
            image: 'img/m4.jpg',
            description: 'When Cardinal Lawrence is tasked with leading one of the worlds most secretive and ancient events, selecting a new Pope, he finds himself at the center of a web of conspiracies and intrigue that could shake the very foundation of the Catholic Church.',
            cast: 'Ralph Fiennes, Stanley Tucci, John Lithgow',
            videoSrc: "video/Conclave.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=JX9jasdi3ic"
        },
        {
            id: 'm5',
            title: 'A Minecraft Movie',
            genre: 'Fantasy',
            duration: '1hr 41m',
            year: '2025',
            rating: '4.7/5',
            image: 'img/m5.jpg',
            description: 'Four misfits are suddenly pulled through a mysterious portal into a bizarre cubic wonderland that thrives on imagination. To get back home they Will have to master this world while embarking on a quest with an unexpected expert crafter.',
            cast: 'Charlie Cox, Margarita Levieva, Vincent D Onofrio',
            videoSrc: "video/Minecraft.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=7xALolZzhSM"
        },
        {
            id: 'm6',
            title: 'Fog of War',
            genre: 'Action',
            duration: '1hr 42m',
            year: '2025',
            rating: '4.2/5',
            image: 'img/m6.jpg',
            description: 'An injured American pilot Gene, and his OSS agent fiancee Penny, who retreat to a remote estate in Massachusetts to visit her extended family. The OSS has recruited Gene to spy on the family and the surrounding community.',
            cast: 'Jake Abel, Brianna Hildebrand, Géza Röhrig',
            videoSrc: "video/Fog-of-War.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=6_sp5Ct_iYg"
        },
        {
            id: 'm7',
            title: 'G20',
            genre: 'Action',
            duration: '1h 48m',
            year: '2025',
            rating: '4.0/5',
            image: 'img/m7.jpg',
            description: "Terrorists take over the G20 summit with President Sutton, bringing her governing and military experience to defend her family, company, and the world.",
            cast: 'Viola Davis, Anthony Anderson, Ramón Rodríguez',
            videoSrc: "video/G20.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=mhQcpvKHis4"
        },
        {
            id: 'm8',
            title: 'The Woman in the Yard',
            genre: 'Horror',
            duration: '1H 28M',
            year: '2018',
            rating: '4.5/5',
            image: 'img/m8.jpg',
            description: 'A mysterious woman repeatedly appears in a familys front yard, often delivering chilling warnings and unsettling messages, leaving them to question her identity, motives and the potential danger she might pose.',
            cast: 'Danielle Deadwyler, Okwui Okpokwasili, Peyton Jackson',
            videoSrc: "video/Woman-in-Yard.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=1s-Ko4J3mWs"
        },
        {
            id: 'm9',
            title: 'Havoc',
            genre: 'Drug Crime',
            duration: '1h 45m',
            year: '2025',
            rating: '4.9/5',
            image: 'img/m9.jpg',
            description: 'After a drug deal gone wrong, a bruised detective must fight his way through the criminal underworld to rescue a politicians estranged son, unraveling a deep web of corruption and conspiracy that ensnares his entire city.',
            cast: 'Tom Hardy, Jessie Mei Li, Justin Cornwell',
            videoSrc: "video/Havoc.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=HAQfDRvrU0s"
        },
        {
            id: 'm10',
            title: 'House of David S1E1',
            genre: 'History',
            duration: '91 min',
            year: '2025',
            rating: '4.2/5',
            image: 'img/m10.jpg',
            description: 'The once-mighty King Saul falls victim to his own pride, as an outcast shepherd boy, David is anointed as the second king.',
            cast: 'Michael Iskander, Ali Suliman, Indy Lewis',
            videoSrc: "video/House-of-David.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=GrGfIHBIVL4"
        },
        {
            id: 'm11',
            title: 'ASH',
            genre: 'Alien/horror',
            duration: '1h 35m',
            year: '2025',
            rating: '4.8/5',
            image: 'img/m11.jpg',
            description: 'A woman wakes up on a distant planet and finds the crew of her space station viciously killed. Her investigation into what happened sets in motion a terrifying chain of events.',
            cast: 'Eiza González, Aaron Paul, Iko Uwais',
            videoSrc: "video/Ash.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=uvp2EYCXYwU"
        },
        {
            id: 'm12',
            title: 'Thunderbolts',
            genre: 'Action/Adventure/CAM',
            duration: '2h 7m',
            year: '2025',
            rating: '4.4/5',
            image: 'img/m12.jpg',
            description: 'After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.',
            cast: 'Florence Pugh, Sebastian Stan, Julia Louis-Dreyfus',
            videoSrc: "video/Thunderbolts.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=-sAOWhvheK8"
        },
        {
            id: 'm13',
            title: 'Sneaks',
            genre: 'Animation',
            duration: '1hr 33m',
            year: '2025',
            rating: '4.2/5',
            image: 'img/m13.jpg',
            description: 'Ty, a misguided, one-of-a-kind designer sneaker, doesn\'t know life outside the comforts of his velvet-lined shoebox. After his sister is stolen by a shady collector, Ty must venture into New York City to find and rescue her.',
            cast: 'Anthony Mackie, Martin Lawrence, Swae Lee',
            videoSrc: "video/Sneaks.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=D9FJcmeOo6k"
        },
        {
            id: 'm14',
            title: 'Alien Invasion: Rise of the Phoenix',
            genre: 'ScienceFiction',
            duration: '90m',
            year: '2025',
            rating: '3.2/5',
            image: 'img/m14.jpg',
            description: 'An asteroid shower lands in a remote section of the Grand Canyon and begins to spread mysterious pods. Meanwhile, scientists on a space station that has been hit by the same asteroid shower, discover that a pod has mutated into a creature and is threatening the ship.',
            cast: 'Melissa Rokuskie, Christopher Showerman, Daniele Favilli',
            videoSrc: "video/Alien-Invasion.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=7uie3yo1lCk"
        },
        {
            id: 'm15',
            title: 'Death of a Unicorn',
            genre: 'Comedy/Horror',
            duration: '1hr 47m',
            year: '2025',
            rating: '4.7/5',
            image: 'img/m15.jpg',
            description: 'A weekend retreat has deadly consequences when a father (Paul Rudd) and daughter (Jenna Ortega) accidentally hit and kill a unicorn while en route to find his billionaire boss seeks to exploit the creatures miraculous curative properties.',
            cast: 'Jenna Ortega, Paul Rudd, Will Poulter',
            videoSrc: "video/Death-of-Unicorn.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=62pyfjnzIuc"
        },
        {
            id: 'm16',
            title: 'Lilo & Stitch',
            genre: 'Action/Adventure/CAM',
            duration: '1hr 48m',
            year: '2025',
            rating: '4.8/5',
            image: 'img/m16.jpg',
            description: 'A lonely Hawaiian girl befriends a runaway alien, helping to mend her fragmented family.',
            cast: 'Maia Kealoha, Sydney Agudong, Chris Sanders',
            videoSrc: "video/Lilo And Stitch.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=m5fMyIImwEY"
        },
        {
            id: 'm17',
            title: 'Taken at a Basketball Game',
            genre: 'Drama',
            duration: '88m',
            year: '2025',
            rating: '4.5/5',
            image: 'img/m17.jpg',
            description: 'A desperate fathers attempt to bond with his teenage daughter at a basketball game turns into a frantic search when she vanishes during halftime, forcing him to navigate a packed arena before its too late.',
            cast: 'D.B. Woodside, Claire Qute, Moni Ogunsuyi',
            videoSrc: "video/Taken.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=gJaFKvVxikk"
        },
        {
            id: 'm18',
            title: 'Rosario',
            genre: 'Horror',
            duration: '88m',
            year: '2025',
            rating: '4.3/5',
            image: 'img/m18.jpg',
            description: 'Rosario spends the night with her grandmothers body while she waits for the ambulance to arrive, during a severe snowfall, Rosario is attacked by otherworldly entities that have taken control of her grandmothers body.',
            cast: 'Emeraude Toubia, David Dastmalchian, Paul Ben-Victor',
            videoSrc: "video/Rosario.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=xqnhflftMj4"
        },
        {
            id: 'm19',
            title: 'Drop',
            genre: 'Drama',
            duration: '1hr 35m',
            year: '2025',
            rating: '4.2/5',
            image: 'img/m19.jpg',
            description: 'A widowed mother\'s first date in years takes a terrifying turn when she\'s bombarded with anonymous threatening messages on her phone during their upscale dinner, leaving her questioning if her charming date is behind the harassment.',
            cast: 'Meghann Fahy, Brandon Sklenar, Violett Beane',
            videoSrc: "video/Drop.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=bs_nFwh5eJw"
        },
        {
            id: 'm20',
            title: 'The Legend of Ochi',
            genre: 'Adventure/Fiction',
            duration: '90m',
            year: '2025',
            rating: '4.4/5',
            image: 'img/m20.jpg',
            description: 'In a remote village on the island of Carpathia, a shy farm girl named Yuri is raised to fear elusive animals known as ochi. But when Yuri discovers a wounded baby ochi has been left behind, she escapes on a quest to bring him home.',
            cast: 'Helena Zengel, Finn Wolfhard, Emily Watson',
            videoSrc: "video/Legend.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=_jTFLg3arYU"
        },
        {
            id: 'm21',
            title: 'Mission: Impossible - Dead Reckoning',
            genre: 'Action',
            duration: '2hr 44m',
            year: '2023',
            rating: '4.8/5',
            image: 'img/m21.jpg',
            description: 'Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity if it falls into the wrong hands.',
            cast: 'Tom Cruise, Hayley Atwell, Ving Rhames',
            videoSrc: "video/Mission.mp4",
            trailerSrc: "https://www.youtube.com/watch?v=avz06PDqDbM"
        }
    ];

    const movieGrid = document.querySelector('.movie-grid');
    const movieInput = document.getElementById('movie');
    const bookingForm = document.getElementById('bookingForm');
    const remindersList = document.getElementById('remindersList');
    
    let selectedMovie = null;

    function displayActiveReminders() {
        const reminders = JSON.parse(localStorage.getItem('movieReminders')) || [];
        remindersList.innerHTML = '';

        if (reminders.length === 0) {
            remindersList.innerHTML = '<p>You have no active reminders.</p>';
            return;
        }

        reminders.forEach(reminder => {
            const reminderTime = new Date(reminder.timestamp);
            const now = new Date();

            if (reminderTime > now) {
                const reminderCard = document.createElement('div');
                reminderCard.className = 'reminder-card';
                reminderCard.id = `reminder-${reminder.id}`;

                const formattedDate = reminderTime.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                });
                const formattedTime = reminderTime.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', hour12: true
                });

                reminderCard.innerHTML = `
                    <div class="reminder-info">
                        <h4>${reminder.movie}</h4>
                        <p>Scheduled for ${formattedTime} on ${formattedDate}</p>
                        <div class="countdown" id="countdown-${reminder.id}"></div>
                    </div>
                    <button class="cancel-btn" data-id="${reminder.id}">&times;</button>
                `;
                remindersList.appendChild(reminderCard);
            }
        });

        document.querySelectorAll('.cancel-btn').forEach(button => {
            button.addEventListener('click', function() {
                const reminderId = this.getAttribute('data-id');
                cancelReminder(reminderId);
            });
        });
    }

    function cancelReminder(reminderId) {
        let reminders = JSON.parse(localStorage.getItem('movieReminders')) || [];
        reminders = reminders.filter(r => r.id !== reminderId);
        localStorage.setItem('movieReminders', JSON.stringify(reminders));
        
        let notifiedReminders = JSON.parse(localStorage.getItem('notifiedReminders')) || [];
        notifiedReminders = notifiedReminders.filter(id => id !== reminderId);
        localStorage.setItem('notifiedReminders', JSON.stringify(notifiedReminders));
        
        displayActiveReminders();
    }
    
    // Populate movie grid
    function populateMovieGrid() {
        movieGrid.innerHTML = ''; // Clear existing content
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.setAttribute('data-id', movie.id);
            movieCard.innerHTML = `
                <img src="${movie.image}" alt="${movie.title}" class="movie-poster">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.description.substring(0, 60)}...</p>
                </div>
            `;
            movieGrid.appendChild(movieCard);
        });

        // Add event listeners to new movie cards
        movieGrid.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', function() {
                movieGrid.querySelectorAll('.movie-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                const movieId = this.getAttribute('data-id');
                selectedMovie = movies.find(m => m.id === movieId);
                movieInput.value = selectedMovie.title;
                document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // Initialize form submission
    function initBookingForm() {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!selectedMovie) {
                alert('Please select a movie first');
                return;
            }
            
            const name = document.getElementById('name').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            
            const reminderDateTime = new Date(`${date}T${time}`);
            
            if (reminderDateTime <= new Date()) {
                alert('Please select a future date and time.');
                return;
            }

            const reminders = JSON.parse(localStorage.getItem('movieReminders')) || [];
            
            const newReminder = {
                id: `rem_${Date.now()}`,
                movie: selectedMovie.title,
                name: name,
                timestamp: reminderDateTime.getTime(),
                image: selectedMovie.image
            };
            
            reminders.push(newReminder);
            localStorage.setItem('movieReminders', JSON.stringify(reminders));
            
            // Reset form
            bookingForm.reset();
            movieInput.value = '';
            movieGrid.querySelectorAll('.movie-card').forEach(c => c.classList.remove('selected'));
            selectedMovie = null;

            displayActiveReminders();
            checkForReminders();
        });
    }

    // Set min date to today
    document.getElementById('date').setAttribute('min', new Date().toISOString().split('T')[0]);

    // Initialize everything
    populateMovieGrid();
    initBookingForm();
    displayActiveReminders();
    checkForReminders();
}

// If loaded directly (not as SPA), initialize normally
if (document.querySelector('.book-now-container')) {
    document.addEventListener('DOMContentLoaded', initBookPage);
}