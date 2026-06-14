/* ==========================================================================
   GENERAL LOGIC, CANVAS PARTICLES & TICKERS: MBA CHART vala
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileMenu();
    initMarketTicker();
    initStatsCounter();
    initHeroParticles();
    initContactForm();
    initScrollToTop();
    initActiveNavOnScroll();
});

/* ==========================================================================
   1. HEADER SCROLL EFFECT
   ========================================================================== */
function initHeaderScroll() {
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ==========================================================================
   2. MOBILE NAVIGATION MENU
   ========================================================================== */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        mainNav.classList.toggle('active');
    });

    // Close menu when links are clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
        });
    });
}

/* ==========================================================================
   3. SIMULATED MARKET TICKER (MARQUEE)
   ========================================================================== */
function initMarketTicker() {
    const tickerContainer = document.getElementById('marketTicker');
    if (!tickerContainer) return;

    // Financial assets data
    const assets = [
        { name: 'NIFTY 50', price: 23456.80, change: 1.15, type: 'up' },
        { name: 'BANK NIFTY', price: 49842.15, change: 0.82, type: 'up' },
        { name: 'SENSEX', price: 77150.35, change: 1.08, type: 'up' },
        { name: 'RELIANCE', price: 2945.50, change: -0.42, type: 'down' },
        { name: 'HDFC BANK', price: 1610.75, change: -1.05, type: 'down' },
        { name: 'GOLD (10g)', price: 71200.00, change: 0.25, type: 'up' },
        { name: 'CRUDE OIL', price: 6540.00, change: 1.95, type: 'up' },
        { name: 'BTC / INR', price: 5854200.00, change: -2.35, type: 'down' },
    ];

    // Helper to format currency
    function formatCurrency(val, name) {
        if (name.includes('BTC') || name.includes('GOLD')) {
            return '₹ ' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        }
        return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Render original items
    function renderTickerHTML(data) {
        return data.map(asset => `
            <div class="ticker-item" data-asset="${asset.name}">
                <span class="t-name">${asset.name}</span>
                <span class="t-price">${formatCurrency(asset.price, asset.name)}</span>
                <span class="t-badge ${asset.type}">${asset.change > 0 ? '+' : ''}${asset.change}%</span>
            </div>
        `).join('');
    }

    // Inject twice for seamless looping marquee
    tickerContainer.innerHTML = renderTickerHTML(assets) + renderTickerHTML(assets);

    // Dynamic price updates simulation
    setInterval(() => {
        const items = tickerContainer.querySelectorAll('.ticker-item');
        // Pick a random asset and simulate change
        const randomIndex = Math.floor(Math.random() * assets.length);
        const asset = assets[randomIndex];
        
        // Random change percentage between -0.3% and +0.3%
        const deltaPct = (Math.random() * 0.6 - 0.3) / 100;
        asset.price += asset.price * deltaPct;
        asset.change = parseFloat((asset.change + deltaPct * 100).toFixed(2));
        asset.type = asset.change >= 0 ? 'up' : 'down';

        // Update UI for all occurrences of this asset
        items.forEach(item => {
            if (item.getAttribute('data-asset') === asset.name) {
                const priceEl = item.querySelector('.t-price');
                const badgeEl = item.querySelector('.t-badge');

                priceEl.textContent = formatCurrency(asset.price, asset.name);
                badgeEl.textContent = `${asset.change > 0 ? '+' : ''}${asset.change}%`;
                badgeEl.className = `t-badge ${asset.type}`;
            }
        });
    }, 1500);

    // Continuous CSS marquee animations
    let scrollPos = 0;
    const speed = 0.8; // pixels per frame

    function marquee() {
        scrollPos -= speed;
        // Reset position when half is scrolled
        if (Math.abs(scrollPos) >= tickerContainer.scrollWidth / 2) {
            scrollPos = 0;
        }
        tickerContainer.style.transform = `translateX(${scrollPos}px)`;
        requestAnimationFrame(marquee);
    }
    marquee();
}

/* ==========================================================================
   4. STATISTICS COUNTER ANIMATION
   ========================================================================== */
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;

    const options = {
        threshold: 0.5,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = parseInt(target.getAttribute('data-target'));
                let current = 0;
                const duration = 2000; // 2 seconds
                const increment = Math.ceil(countTo / (duration / 16)); // ~60fps
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= countTo) {
                        target.textContent = countTo + (countTo === 90 ? '%' : '+');
                        clearInterval(timer);
                    } else {
                        target.textContent = current + '+';
                    }
                }, 16);

                observer.unobserve(target);
            }
        });
    }, options);

    stats.forEach(stat => observer.observe(stat));
}

/* ==========================================================================
   5. HERO CANVAS PARTICLES
   ========================================================================== */
function initHeroParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const colors = ['#e5b842', '#ab821d', '#ffffff', '#22222a'];
    
    // Track mouse position
    let mouse = {
        x: null,
        y: null,
        radius: 120
    };

    window.addEventListener('mousemove', (event) => {
        // Adjust for canvas position if needed
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Resize canvas
    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle constructor
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
            this.originalSize = size;
        }

        // Draw particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update properties
        update() {
            // Check boundaries
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            // Mouse collision interaction (push away)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius + this.size) {
                    if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                        this.x += 2;
                    }
                    if (mouse.x > this.x && this.x > this.size * 10) {
                        this.x -= 2;
                    }
                    if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                        this.y += 2;
                    }
                    if (mouse.y > this.y && this.y > this.size * 10) {
                        this.y -= 2;
                    }
                }
            }

            this.draw();
        }
    }

    // Populate particles array
    function initParticles() {
        particlesArray = [];
        let numberOfParticles = Math.floor((canvas.width * canvas.height) / 14000);
        numberOfParticles = Math.min(numberOfParticles, 120); // Cap particles to maintain performance
        
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];
            
            // Give golden particles slightly larger size & glow
            if (color === '#e5b842') size += 0.5;

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Draw connecting lines between close particles
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 110) {
                    opacityValue = 1 - (distance / 110);
                    // Draw lines
                    ctx.strokeStyle = `rgba(229, 184, 66, ${opacityValue * 0.12})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        requestAnimationFrame(animate);
    }
    animate();
}

/* ==========================================================================
   6. CONTACT FORM SUBMISSION
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('consultationForm');
    const successMsg = document.getElementById('formSuccess');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Fetch values
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const experience = document.getElementById('tradingExperience').value;
        const message = document.getElementById('userMessage').value.trim();

        // 10-Digit Mobile validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        // Simulate API call
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Submitting... <i class="fa-solid fa-spinner fa-spin"></i>';

        setTimeout(() => {
            // Show success notification panel
            successMsg.classList.add('active');
            form.reset();
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request <i class="fa-solid fa-paper-plane"></i>';

            // Auto-hide success message after 5 seconds to allow resubmission
            setTimeout(() => {
                successMsg.classList.remove('active');
            }, 6000);
        }, 1500);
    });
}

/* ==========================================================================
   7. SCROLL TO TOP BUTTON
   ========================================================================== */
function initScrollToTop() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ==========================================================================
   8. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
   ========================================================================== */
function initActiveNavOnScroll() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Adjust threshold offset for headers
            if (window.scrollY >= (sectionTop - 150)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });
}
