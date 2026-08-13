document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let cart = []; // Structure: { id: string, name: string, desc: string, price: number, qty: number, defaultImg: string }
    let wishlist = [];
    let currentCurrency = 'INR';
    const exchangeRates = { USD: 1, EUR: 0.92, INR: 83 };
    const currencySymbols = { USD: '$', EUR: '€', INR: '₹' };
    
    // --- Overlay & Drawer Management ---
    const searchOverlay = document.getElementById('search-overlay');
    const quizOverlay = document.getElementById('quiz-overlay');
    const productModal = document.getElementById('product-modal');
    const cartDrawer = document.getElementById('cart-drawer');
    const settingsDrawer = document.getElementById('settings-drawer');
    
    // Selectors for triggers
    const searchTrigger = document.getElementById('search-trigger');
    const notificationsTrigger = document.getElementById('notifications-trigger');
    const dnaTrigger = document.querySelector('.dna-card .cta-btn');

    const openOverlay = (el) => { if (el) el.style.display = 'flex'; };
    window.openOverlay = openOverlay;
    const closeOverlay = (el) => { if (el) el.style.display = 'none'; };
    window.closeOverlay = closeOverlay;

    // --- Theme & Currency Logic ---
    const setTheme = (mode) => {
        if (mode === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        
        document.querySelectorAll('#theme-light, #theme-dark, #theme-dark-main, #theme-light-main, #theme-dark-drawer, #theme-light-drawer').forEach(btn => {
            btn.classList.toggle('active', btn.id.includes(mode));
        });
        
        // Update nav toggle icon
        const navToggle = document.getElementById('theme-toggle-nav');
        if (navToggle) {
            navToggle.innerHTML = mode === 'light' 
                ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' // Moon
                : '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>'; // Sun
        }
    };

    const setCurrency = (curr) => {
        currentCurrency = curr;
        document.querySelectorAll('[data-currency]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === curr);
        });
        // Refresh all potentially visible price elements
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen?.id === 'home') renderHomeCollections();
        if (activeScreen?.id === 'collection') renderCollections(currentFilter);
        if (activeScreen?.id === 'cart') updateCartUI();
        if (productModal.style.display === 'flex') {
            const activeId = document.getElementById('modal-add-to-cart').dataset.activeId;
            if (activeId) openProductDetail(activeId);
        }
    };

    const formatPrice = (price) => {
        // Price is now assumed to be in base INR
        const finalPrice = (price / exchangeRates.INR) * exchangeRates[currentCurrency];

        const converted = finalPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return `${currencySymbols[currentCurrency]}${converted}`;
    };

    // Settings listeners
    document.querySelectorAll('[id^="theme-light"]').forEach(btn => btn?.addEventListener('click', () => setTheme('light')));
    document.querySelectorAll('[id^="theme-dark"]').forEach(btn => btn?.addEventListener('click', () => setTheme('dark')));
    
    // Nav Theme Toggle
    const navThemeToggle = document.getElementById('theme-toggle-nav');
    if (navThemeToggle) {
        navThemeToggle.onclick = () => {
            const isLight = document.body.classList.contains('light-mode');
            setTheme(isLight ? 'dark' : 'light');
        };
    }
    
    document.querySelectorAll('[data-currency]').forEach(btn => {
        btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });

    window.launchQuiz = () => { 
        startScentDiscoveryQuiz(); 
        openOverlay(quizOverlay); 
    };

    if (searchTrigger) searchTrigger.onclick = () => openOverlay(searchOverlay);
    if (notificationsTrigger) notificationsTrigger.onclick = () => showToast('No new notifications.');
    if (dnaTrigger) dnaTrigger.onclick = () => launchQuiz();
    document.querySelectorAll('.close-quiz, .close-drawer, .close-search').forEach(btn => {
        btn.onclick = () => {
            closeOverlay(searchOverlay);
            closeOverlay(quizOverlay);
            closeOverlay(productModal);
            closeOverlay(cartDrawer);
            closeOverlay(settingsDrawer);
            const moleculeOverlay = document.getElementById('molecule-overlay');
            const visualOverlay = document.getElementById('visual-overlay');
            const poetryOverlay = document.getElementById('poetry-overlay');
            if (moleculeOverlay) moleculeOverlay.style.display = 'none';
            if (visualOverlay) visualOverlay.style.display = 'none';
            if (poetryOverlay) poetryOverlay.style.display = 'none';
        };
    });

    // --- Scent Discovery Quiz Logic ---
    const quizStepsContent = [
        {
            question: "Choose your favorite fragrance family",
            options: [
                { text: "Floral (Romantic & Elegant)", family: "Floral" },
                { text: "Fresh (Clean & Crisp)", family: "Fresh" },
                { text: "Woody (Grounded & Natural)", family: "Woody" },
                { text: "Spicy (Warm & Exotic)", family: "Spicy" },
                { text: "Dark (Bold & Mysterious)", family: "Dark" }
            ],
            key: "family"
        },
        {
            question: "Where does your soul feel most at home?",
            options: [
                { text: "A sun-drenched beach", mood: "Fresh", context: "Beach" },
                { text: "A bustling modern city", mood: "Bold", context: "City" },
                { text: "A deep, ancient forest", mood: "Calm", context: "Forest" },
                { text: "A blooming palace garden", mood: "Romantic", context: "Garden" },
                { text: "A quiet, sacred temple", mood: "Spiritual", context: "Temple" }
            ],
            key: "environment"
        },
        {
            question: "What level of sensory intensity do you seek?",
            options: [
                { text: "A subtle whisper", intensity: "Mild" },
                { text: "A steady presence", intensity: "Medium" },
                { text: "A bold declaration", intensity: "Strong" }
            ],
            key: "intensity"
        },
        {
            question: "Define the occasion for this essence",
            options: [
                { text: "Daily signature wear", occasion: "Daily" },
                { text: "Special evening events", occasion: "Evening" },
                { text: "Professional & Sharp", occasion: "Professional" },
                { text: "Personal relaxation", occasion: "Relaxing" }
            ],
            key: "occasion"
        },
        {
            question: "Which vibration best describes you right now?",
            options: [
                { text: "Romantic & Soft", vibe: "Romantic" },
                { text: "Bold & Enigmatic", vibe: "Bold" },
                { text: "Calm & Serene", vibe: "Calm" },
                { text: "Energetic & Driven", vibe: "Energetic" }
            ],
            key: "vibe"
        },
        {
            question: "Which season resonates with your spirit?",
            options: [
                { text: "Spring Awakening", season: "Spring" },
                { text: "Summer Sun", season: "Summer" },
                { text: "Autumn Dusk", season: "Autumn" },
                { text: "Winter Silence", season: "Winter" }
            ],
            key: "season"
        }
    ];
    
    let currentQuizStep = 0;
    let quizAnswers = {};

    const startScentDiscoveryQuiz = () => {
        currentQuizStep = 0;
        quizAnswers = {};
        document.getElementById('prev-step').style.display = 'none';
        document.getElementById('next-step').style.display = 'inline-block';
        document.getElementById('next-step').innerText = 'Next Step';
        document.querySelector('.quiz-progress-bar .progress').style.width = '25%';
        renderQuizStep();
    };

    const renderQuizStep = () => {
        const container = document.getElementById('quiz-step-container');
        if (currentQuizStep >= quizStepsContent.length) {
            showQuizResult();
            return;
        }
        
        const step = quizStepsContent[currentQuizStep];
        let html = `<h2>${step.question}</h2><div class="mood-grid" style="margin-top: 2rem;">`;
        step.options.forEach((opt, idx) => {
            const isSelected = quizAnswers[step.key] === idx;
            html += `<button class="mood-card ${isSelected ? 'active' : ''}" onclick="selectQuizOption('${step.key}', ${idx})"><span class="mood-text">${opt.text}</span></button>`;
        });
        html += `</div>`;
        container.innerHTML = html;
        document.querySelector('.quiz-progress-bar .progress').style.width = `${((currentQuizStep + 1) / (quizStepsContent.length + 1)) * 100}%`;
    };

    window.selectQuizOption = (key, idx) => {
        quizAnswers[key] = idx;
        renderQuizStep();
    };

    document.getElementById('next-step').onclick = () => {
        const step = quizStepsContent[currentQuizStep];
        if (quizAnswers[step.key] === undefined) {
            showToast("Please select an option to continue.");
            return;
        }
        currentQuizStep++;
        if(currentQuizStep > 0) document.getElementById('prev-step').style.display = 'inline-block';
        if(currentQuizStep === quizStepsContent.length - 1) document.getElementById('next-step').innerText = 'Reveal My Scent';
        renderQuizStep();
    };

    document.getElementById('prev-step').onclick = () => {
        currentQuizStep--;
        if(currentQuizStep === 0) document.getElementById('prev-step').style.display = 'none';
        document.getElementById('next-step').innerText = 'Next Step';
        document.getElementById('next-step').style.display = 'inline-block';
        renderQuizStep();
    };

    const showQuizResult = () => {
        const container = document.getElementById('quiz-step-container');
        document.getElementById('prev-step').style.display = 'none';
        document.getElementById('next-step').style.display = 'none';
        document.querySelector('.quiz-progress-bar .progress').style.width = '100%';
        
        const selectedFamily = quizStepsContent[0].options[quizAnswers.family].family;
        const selectedIntensity = quizStepsContent[2].options[quizAnswers.intensity].intensity;
        const selectedVibe = quizStepsContent[4].options[quizAnswers.vibe].vibe;
        
        // Find recommendations
        const matches = perfumeData.filter(p => p.family === selectedFamily && p.intensity === selectedIntensity);
        const bestMatch = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : 
                          (perfumeData.find(p => p.family === selectedFamily) || perfumeData[0]);

        const otherMatches = perfumeData.filter(p => p.family === selectedFamily && p.id !== bestMatch.id).slice(0, 3);

        container.innerHTML = `
            <div class="result-container" style="text-align: center; animation: fadeIn 1s ease forwards;">
                <span class="tag">Your Perfect Match: ${selectedVibe}</span>
                <h2 style="margin: 1rem 0;">${bestMatch.name}</h2>
                <div style="width: 200px; height: 200px; margin: 1.5rem auto; border-radius: 50%; background: url('${bestMatch.img}') center/cover; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></div>
                <p><strong>Fragrance Family:</strong> ${bestMatch.family} • <strong>Intensity:</strong> ${bestMatch.intensity}</p>
                <div style="margin-top: 1.5rem; text-align: left; background: var(--glass-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="margin-bottom: 0.5rem"><strong>Top Notes:</strong> ${bestMatch.topNotes.join(', ')}</p>
                    <p style="margin-bottom: 0.5rem"><strong>Heart Notes:</strong> ${bestMatch.middleNotes.join(', ')}</p>
                    <p><strong>Base Notes:</strong> ${bestMatch.baseNotes.join(', ')}</p>
                </div>
                <p style="margin-top: 1.5rem; font-style: italic;">"${bestMatch.desc}"</p>
                
                <div style="margin-top: 2rem;">
                    <h4>Other Recommendations for You:</h4>
                    <div class="mini-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; margin-top:1rem;">
                        ${otherMatches.map(p => `
                            <div onclick="openProductDetail('${p.id}')" style="cursor:pointer;">
                                <img src="${p.img}" style="width:100%; height:100px; object-fit:cover; border-radius:8px;">
                                <p style="font-size:0.8rem; margin-top:5px;">${p.name}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="cta-btn" style="margin-top: 2rem;" onclick="quickAdd('${bestMatch.id}'); closeOverlay(quizOverlay);">Add to Cart - ${formatPrice(bestMatch.price)}</button>
            </div>
        `;
    };

    // --- Splash Screen Logic ---
    const splash = document.getElementById('splash-screen');
    const particleContainer = document.querySelector('.scent-particles');

    const createParticles = () => {
        if (!particleContainer) return;
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            
            const size = Math.random() * 15 + 5;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const dx = (Math.random() - 0.5) * 200;
            const dy = -Math.random() * 300;
            const delay = Math.random() * 3;

            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${x}%`;
            p.style.top = `${y}%`;
            p.style.setProperty('--dx', `${dx}px`);
            p.style.setProperty('--dy', `${dy}px`);
            p.style.animationDelay = `${delay}s`;

            particleContainer.appendChild(p);
        }
    };

    if (splash) {
        createParticles();
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 1000);
        }, 4000);
    }

    // --- Navigation Logic ---
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');

    const switchScreen = (screenId) => {
        screens.forEach(s => s.classList.remove('active'));
        navItems.forEach(n => n.classList.remove('active'));

        const targetScreen = document.getElementById(screenId);
        const targetNav = document.querySelector(`[data-screen="${screenId}"]`);

        if (targetScreen) targetScreen.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // Scent DNA Visibility Logic
        const dnaSection = document.getElementById('scent-dna');
        if (dnaSection) {
            dnaSection.style.display = (screenId === 'collection') ? 'block' : 'none';
        }

        // Close overlays when switching screens
        closeOverlay(searchOverlay);
        closeOverlay(quizOverlay);
        closeOverlay(productModal);
        
        // Contextual renders
        if (screenId === 'home') renderHomeCollections();
        if (screenId === 'collection') renderCollections();
        if (screenId === 'create') renderCreationFlow();
        if (screenId === 'cart') updateCartUI();

        window.scrollTo(0, 0);
    };

    window.filterCollectionByNote = (keyword) => {
        switchScreen('collection');
        renderCollections(keyword);
    };

    window.launchQuiz = () => {
        openOverlay(quizOverlay);
        startScentDiscoveryQuiz();
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenId = item.dataset.screen;
            if (screenId) switchScreen(screenId);
        });
    });

    window.switchScreen = switchScreen;

    // --- Creation Flow Logic ---
    const creationSteps = [
        { id: 'mood', title: 'Step 1: Your Aura', question: 'Choose an aura that reflects your spirit.', options: [{ id: 'serene', text: 'Serene & Calm', icon: '🌊' }, { id: 'bold', text: 'Energetic & Bold', icon: '🔥' }, { id: 'mysterious', text: 'Mysterious & Deep', icon: '🌑' }, { id: 'romantic', text: 'Romantic & Soft', icon: '🌸' }] },
        { id: 'environment', title: 'Step 2: The Setting', question: 'Where does your soul feel most at home?', options: [{ id: 'forest', text: 'Ancient Forest', icon: '🌲' }, { id: 'beach', text: 'Coastal Mist', icon: '🏖️' }, { id: 'gala', text: 'Midnight Gala', icon: '✨' }, { id: 'rain', text: 'Summer Rain', icon: '☁️' }] },
        { id: 'personality', title: 'Step 3: Perception', question: 'How do you wish to be perceived?', options: [{ id: 'modern', text: 'Modern & Clean', icon: '🏙️' }, { id: 'traditional', text: 'Timeless & Noble', icon: '🏛️' }, { id: 'enigmatic', text: 'Dark & Enigmatic', icon: '🎭' }, { id: 'warm', text: 'Warm & Approachable', icon: '☀️' }] },
        { id: 'texture', title: 'Step 4: Soul Texture', question: 'What texture does your essence evoke?', options: [{ id: 'silk', text: 'Fluid Silk', icon: '🧣' }, { id: 'velvet', text: 'Deep Velvet', icon: '🧶' }, { id: 'linen', text: 'Crisp Linen', icon: '🧵' }, { id: 'stone', text: 'Carved Stone', icon: '🗿' }] },
        { id: 'ingredients', title: 'Step 5: The Notes', question: 'Select your fragrance ingredients.' },
        { id: 'intensity', title: 'Step 6: Intensity', question: 'Adjust your fragrance intensity.', options: ['Mild', 'Medium', 'Strong'] },
        { id: 'bottle_size', title: 'Step 7: Bottle Size', question: 'Select the volume of your essence.', options: [{id: '30ml', text: '30ml', price: 1499}, {id: '50ml', text: '50ml', price: 2499}, {id: '75ml', text: '75ml', price: 3499}, {id: '100ml', text: '100ml', price: 4499}] },
        { id: 'bottle_shape', title: 'Step 8: Vessel Shape', question: 'Choose the silhouette of your bottle.', options: [{id: 'round', text: 'Round Glass', price: 0}, {id: 'square', text: 'Modern Square', price: 200}, {id: 'luxury_crystal', text: 'Luxury Crystal', price: 800}, {id: 'minimal_glass', text: 'Minimal Glass', price: 100}] },
        { id: 'bottle_cap', title: 'Step 9: Cap Material', question: 'Crown your creation.', options: [{id: 'metal', text: 'Polished Metal', price: 150}, {id: 'wooden', text: 'Natural Wood', price: 250}, {id: 'matte', text: 'Matte Finish', price: 100}, {id: 'crystal', text: 'Crystal Crown', price: 600}] },
        { id: 'label_style', title: 'Step 10: Label Aesthetic', question: 'Define the label style.', options: [{id: 'gold_foil', text: 'Gold Foil', price: 300}, {id: 'minimal_print', text: 'Minimal Print', price: 0}, {id: 'embossed', text: 'Blind Embossed', price: 250}] },
        { id: 'limited_edition', title: 'Step 11: Artistic Finish', question: 'Elevate with a limited artistic finish.', options: [{id: 'none', text: 'Standard Collection', price: 0}, {id: 'hand_painted', text: 'Hand Painted Motif', price: 1200}, {id: 'engraved', text: 'Custom Engraving', price: 800}] },
        { id: 'design', title: 'Step 12: Signature Name', question: 'Inscribe your masterpiece.' },
        { id: 'summary', title: 'Step 13: Final Essence', question: 'Review your creation.' }
    ];

    let creationState = { step: 0, mood: null, environment: null, personality: null, texture: null, top: 'Citrus', heart: 'Rose', base: 'Sandalwood', intensity: 'Medium', size: '50ml', shape: 'round', cap: 'metal', label: 'minimal_print', limited: 'none', name: '' };

    const generateSuggestedNames = () => {
        const adjs = {
            'Citrus': ['Sunlit', 'Sparkling', 'Golden', 'Radiant'], 'Bergamot': ['Midnight', 'Crisp', 'Sharp', 'Twilight'], 'Lavender': ['Dreaming', 'Violet', 'Hushed', 'Serene'], 'Sea Salt': ['Oceanic', 'Drifting', 'Tidal', 'Coastal'], 'Mint': ['Frost', 'Awakened', 'Lucid', 'Brisk'],
            'Rose': ['Velvet', 'Crimson', 'Eternal', 'Blushing'], 'Jasmine': ['Nocturnal', 'Weeping', 'Celestial', 'Lunar'], 'Saffron': ['Royal', 'Burning', 'Spiced', 'Opal'], 'Violet': ['Shadowed', 'Deep', 'Dusk', 'Powdered'], 'Cardamom': ['Ancient', 'Warm', 'Resined', 'Sacred']
        };
        const nouns = {
            'Sandalwood': ['Temple', 'Smoke', 'Wood', 'Silence'], 'Oud': ['Mystique', 'Kingdom', 'Resin', 'Crown'], 'Vanilla': ['Silk', 'Embrace', 'Nectar', 'Gold'], 'Amber': ['Embers', 'Tide', 'Dune', 'Glow'], 'Patchouli': ['Earth', 'Root', 'Rain', 'Moss']
        };
        let adjList = adjs[creationState.top] || ['Mystic'];
        let midList = adjs[creationState.heart] || ['Ethereal'];
        let nounList = nouns[creationState.base] || ['Essence'];
        return [
            adjList[0] + ' ' + nounList[0],
            midList[0] + ' ' + (nounList[1] || nounList[0]),
            (adjList[1] || adjList[0]) + ' ' + (midList[1] || midList[0]),
            'The ' + (nounList[2] || nounList[0]) + ' of ' + creationState.heart,
            creationState.top + ' & ' + creationState.base + ' Reserve'
        ];
    };

    const calculateCustomPrice = () => {
        let base = 500; // Base customizing fee INR
        const sizePrice = creationSteps.find(s => s.id === 'bottle_size').options.find(o => o.id === creationState.size)?.price || 2499;
        const shapePrice = creationSteps.find(s => s.id === 'bottle_shape').options.find(o => o.id === creationState.shape)?.price || 0;
        const capPrice = creationSteps.find(s => s.id === 'bottle_cap').options.find(o => o.id === creationState.cap)?.price || 0;
        const labelPrice = creationSteps.find(s => s.id === 'label_style') ? (creationSteps.find(s => s.id === 'label_style').options.find(o => o.id === creationState.label)?.price || 0) : 0;
        const limitedPrice = creationSteps.find(s => s.id === 'limited_edition') ? (creationSteps.find(s => s.id === 'limited_edition').options.find(o => o.id === creationState.limited)?.price || 0) : 0;
        return base + sizePrice + shapePrice + capPrice + labelPrice + limitedPrice;
    };

    const renderBottlePreview = () => {
        let borderRadius = '10px'; // minimal_glass baseline
        let width = '100px';
        let height = '150px';
        let filterEffect = '';
        
        if(creationState.shape === 'round') { borderRadius = '50px 50px 20px 20px'; width = '110px'; height = '140px'; }
        if(creationState.shape === 'square') { borderRadius = '2px'; width = '120px'; height = '140px'; }
        if(creationState.shape === 'luxury_crystal') { borderRadius = '8px'; width = '100px'; height = '160px'; filterEffect = 'drop-shadow(0 0 15px rgba(255,255,255,0.4))'; }
        if(creationState.shape === 'orb') { borderRadius = '50%'; width = '140px'; height = '140px'; }
        
        if(creationState.size === '30ml') { width = parseInt(width)*0.8 + 'px'; height = parseInt(height)*0.8 + 'px'; }
        if(creationState.size === '75ml') { width = parseInt(width)*1.1 + 'px'; height = parseInt(height)*1.1 + 'px'; }
        if(creationState.size === '100ml') { width = parseInt(width)*1.2 + 'px'; height = parseInt(height)*1.2 + 'px'; }

        let capColor = '#d4af37'; // metal/gold baseline
        let capBorderRadius = '4px 4px 0 0';
        if(creationState.cap === 'wooden' || creationState.cap === 'wood') capColor = '#8b5a2b';
        if(creationState.cap === 'matte') { capColor = '#222222'; capBorderRadius = '2px 2px 0 0'; }
        if(creationState.cap === 'crystal') { capColor = 'rgba(255,255,255,0.7)'; capBorderRadius = '15px 15px 0 0'; filterEffect += ' drop-shadow(0 -5px 10px rgba(255,255,255,0.6))'; }
        if(creationState.cap === 'silver') capColor = '#c0c0c0';

        let liquidHeight = '60%';
        if(creationState.intensity === 'Mild') liquidHeight = '40%';
        if(creationState.intensity === 'Strong') liquidHeight = '80%';

        let liquidColor = 'rgba(212, 175, 55, 0.4)'; // Default golden
        if(creationState.mood === 'serene') liquidColor = 'rgba(135, 206, 235, 0.4)';
        if(creationState.mood === 'mysterious') liquidColor = 'rgba(148, 0, 211, 0.4)';
        if(creationState.mood === 'romantic') liquidColor = 'rgba(255, 182, 193, 0.4)';

        let labelColor = 'rgba(255,255,255,0.8)';
        let labelText = 'black';
        let labelBorder = 'none';
        if(creationState.label === 'gold_foil') { labelColor = '#111'; labelText = '#d4af37'; labelBorder = '1px solid #d4af37'; }
        if(creationState.label === 'embossed') { labelColor = 'rgba(255,255,255,0.2)'; labelText = 'white'; labelBorder = '1px solid rgba(255,255,255,0.5)'; }

        let artisticOverlay = '';
        if(creationState.limited === 'hand_painted') artisticOverlay = `<div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at 30% 70%, rgba(255,100,100,0.2), transparent 40%), radial-gradient(circle at 70% 30%, rgba(100,200,255,0.2), transparent 40%); z-index: 1;"></div>`;
        if(creationState.limited === 'engraved') artisticOverlay = `<div style="position: absolute; top: 10%; left: 0; width: 100%; text-align: center; color: rgba(255,255,255,0.15); font-family: serif; font-size: 2rem; font-style: italic; z-index: 1; pointer-events: none;">INAI</div>`;

        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 2rem 0; animation: fadeIn 0.5s; filter: ${filterEffect};">
                <div style="width: ${parseInt(width)*0.4}px; height: 30px; background: ${capColor}; border-radius: ${capBorderRadius}; z-index: 2; margin-bottom: -5px; box-shadow: inset 0 0 10px rgba(0,0,0,0.3);"></div>
                <div style="width: ${width}; height: ${height}; border-radius: ${borderRadius}; border: 3px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); position: relative; overflow: hidden; backdrop-filter: blur(5px); display: flex; align-items: flex-end; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.2);">
                    <div style="width: 100%; height: ${liquidHeight}; background: ${liquidColor}; transition: height 1s ease, background 1s ease;">
                        <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.5); position: absolute; top: 0;"></div>
                    </div>
                    ${artisticOverlay}
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 5px 15px; background: ${labelColor}; color: ${labelText}; border: ${labelBorder}; font-size: 0.8rem; letter-spacing: 2px; border-radius: 2px; text-transform: uppercase; z-index: 5; text-align: center; max-width: 90%;">
                        ${creationState.name || 'INAI'}
                    </div>
                </div>
            </div>
        `;
    };

    const renderCreationFlow = () => {
        const container = document.getElementById('creation-flow');
        if (!container) return;
        const current = creationSteps[creationState.step];
        let html = `
            <div class="creation-progress-wrapper" style="margin-bottom: 2rem; width: 100%; max-width: 600px; margin: 0 auto 2rem auto;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    <span>Start</span>
                    <span>Finish</span>
                </div>
                <div class="quiz-progress-bar" style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                    <div class="progress" style="height: 100%; background: var(--accent-lavender); width: ${((creationState.step + 1) / creationSteps.length) * 100}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
            <div class="creation-step" style="max-width: 700px; margin: 0 auto; text-align: center; animation: slideUp 0.4s ease forwards;">
            <span class="tag">${current.title}</span><h2 style="margin: 1rem 0 2rem 0;">${current.question}</h2>`;
        
        if (['mood', 'environment', 'personality', 'texture'].includes(current.id)) {
            html += `<div class="mood-grid">${current.options.map(opt => `<button class="mood-card ${creationState[current.id] === opt.id ? 'active' : ''}" onclick="setCreationChoice('${current.id}', '${opt.id}')"><span class="mood-icon">${opt.icon}</span><span class="mood-text">${opt.text}</span></button>`).join('')}</div>`;
        } else if (current.id === 'ingredients') {
            html += `<div class="atelier-controls">
                <div class="note-layer"><h4>Top</h4><div class="note-selector">${['Citrus', 'Bergamot', 'Lavender', 'Sea Salt', 'Mint'].map(n => `<button class="note-chip ${creationState.top === n ? 'active' : ''}" onclick="setCreationNote('top', '${n}')">${n}</button>`).join('')}</div></div>
                <div class="note-layer"><h4>Heart</h4><div class="note-selector">${['Rose', 'Jasmine', 'Saffron', 'Violet', 'Cardamom'].map(n => `<button class="note-chip ${creationState.heart === n ? 'active' : ''}" onclick="setCreationNote('heart', '${n}')">${n}</button>`).join('')}</div></div>
                <div class="note-layer"><h4>Base</h4><div class="note-selector">${['Sandalwood', 'Oud', 'Vanilla', 'Amber', 'Patchouli'].map(n => `<button class="note-chip ${creationState.base === n ? 'active' : ''}" onclick="setCreationNote('base', '${n}')">${n}</button>`).join('')}</div></div>
            </div>`;
        } else if (current.id === 'intensity') {
            html += `<div class="intensity-options">${current.options.map(o => `<button class="intensity-chip ${creationState.intensity === o ? 'active' : ''}" onclick="setCreationIntensity('${o}')">${o}</button>`).join('')}</div>`;
        } else if (['bottle_size', 'bottle_shape', 'bottle_cap', 'label_style', 'limited_edition'].includes(current.id)) {
            const stateKey = current.id.replace('bottle_', '').replace('_style', '').replace('_edition', '');
            // Adjust specific state keys
            let activeKey = stateKey;
            if(current.id === 'label_style') activeKey = 'label';
            if(current.id === 'limited_edition') activeKey = 'limited';

            html += `<div class="mood-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                ${current.options.map(opt => `
                    <button class="mood-card ${creationState[activeKey] === opt.id ? 'active' : ''}" onclick="setCreationChoice('${activeKey}', '${opt.id}')" style="padding: 1.5rem 1rem;">
                        <span class="mood-text" style="font-size: 1.1rem; margin-bottom: 0.5rem;">${opt.text}</span>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">+${formatPrice(opt.price)}</span>
                    </button>
                `).join('')}
            </div>
            ${renderBottlePreview()}
            `;
        } else if (current.id === 'design') {
            const suggestedNames = generateSuggestedNames();
            html += `
                <div style="margin: 2rem 0;">
                    ${renderBottlePreview()}
                    <div class="search-input-wrapper" style="max-width: 400px; margin: 2rem auto;">
                        <input type="text" id="custom-name-input" class="glass" placeholder="Name your signature scent..." value="${creationState.name || suggestedNames[0]}" oninput="setCreationName(this.value)" style="text-align: center; font-size: 1.2rem;">
                    </div>
                    <p style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">AI Suggestions based on your notes:</p>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
                        ${suggestedNames.map(s => 
                            `<button class="note-chip" onclick="setCreationName('${s}')">${s}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else if (current.id === 'summary') {
            const finalPrice = calculateCustomPrice();
            html += `
                <div class="atelier-preview" style="flex-direction: column; align-items: center; background: var(--glass-bg); padding: 2rem; border-radius: 16px; border: 1px solid var(--border-color);">
                    ${renderBottlePreview()}
                    <div class="creation-summary" style="text-align: center; margin-top: 2rem;">
                        <h3 style="font-size: 2rem; margin-bottom: 1rem;">${creationState.name || 'Bespoke Essence'}</h3>
                        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1rem;">${creationState.top} • ${creationState.heart} • ${creationState.base}</p>
                        <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem;">
                            <span class="tag">Size: ${creationState.size}</span>
                            <span class="tag">Intensity: ${creationState.intensity}</span>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 300;">${formatPrice(finalPrice)}</div>
                    </div>
                </div>
            `;
        }
        html += `<div class="creation-nav" style="margin-top: 3rem; display: flex; justify-content: space-between; max-width: 400px; margin-left: auto; margin-right: auto;">
            ${creationState.step > 0 ? `<button class="secondary-btn" onclick="prevCreationStep()" style="flex: 1; margin-right: 1rem;">Back</button>` : '<div style="flex:1; margin-right: 1rem;"></div>'}
            <button class="cta-btn" onclick="nextCreationStep()" style="flex: 2;">${creationState.step === creationSteps.length - 1 ? 'Add to Cart' : 'Continue'}</button>
        </div></div>`;
        container.innerHTML = html;
        
        // Ensure colors are visible in dark mode
        document.querySelectorAll('.creation-step h2, .creation-step .tag, .creation-step .mood-text, .creation-step input').forEach(el => {
            el.style.color = 'var(--text-primary)';
        });
    };

    window.setCreationChoice = (key, val) => { creationState[key] = val; renderCreationFlow(); };
    window.setCreationMood = (mood) => { creationState.mood = mood; renderCreationFlow(); };
    window.setCreationNote = (layer, note) => { creationState[layer] = note; renderCreationFlow(); };
    window.setCreationIntensity = (i) => { creationState.intensity = i; renderCreationFlow(); };
    window.setCreationName = (name) => {
        creationState.name = name;
        const input = document.getElementById('custom-name-input');
        if (input && input.value !== name) {
            input.value = name;
        }
    };
    window.nextCreationStep = () => {
        if (creationState.step === creationSteps.length - 1) {
            addToCart({ 
                name: creationState.name || 'Bespoke Essence', 
                desc: `${creationState.top}, ${creationState.heart}, ${creationState.base} | ${creationState.size}`, 
                price: calculateCustomPrice() 
            });
            creationState.step = 0; switchScreen('home');
        } else { creationState.step++; renderCreationFlow(); }
    };
    window.prevCreationStep = () => { creationState.step--; renderCreationFlow(); };

    const basePerfumeData = [
        { id: 'p1', name: 'Nocturnal Silk', price: 14940, family: 'Floral', intensity: 'Strong', rating: 4.8, img: 'images/nocturnal_silk.png', notes: 'Jasmine, Oud, Vanilla', topNotes: ['Black Plum', 'Midnight Bergamot'], middleNotes: ['Night-blooming Jasmine', 'Black Orchid'], baseNotes: ['Oud', 'Madagascar Vanilla', 'Dark Woods'], allergens: 'Linalool, Benzyl Alcohol, Limonene, Citral', desc: 'A mysterious and deep fragrance.' },
        { id: 'p2', name: 'Ethereal Dew', price: 13695, family: 'Fresh', intensity: 'Mild', rating: 4.6, img: 'images/ethereal_dew.png', notes: 'Bergamot, Sea Salt, Musk', topNotes: ['Bergamot', 'Lemon Zest', 'Morning Dew'], middleNotes: ['Sea Salt', 'White Tea', 'Lily of the Valley'], baseNotes: ['White Musk', 'Driftwood', 'Ambroxan'], allergens: 'Limonene, Citral, Linalool', desc: 'Fresh morning mist experience.' },
        { id: 'p3', name: 'Kashmiri Saffron', price: 16185, family: 'Spicy', intensity: 'Medium', rating: 4.9, img: 'images/kashmiri_saffron.png', notes: 'Saffron, Rose, Amber', topNotes: ['Kashmiri Saffron', 'Pink Pepper'], middleNotes: ['Turkish Rose', 'Clove', 'Cardamom'], baseNotes: ['Golden Amber', 'Sandalwood', 'Labdanum'], heritage: true, allergens: 'Eugenol, Geraniol, Citronellol, Cinnamal', desc: 'Golden sunset of the Himalayas.' },
        { id: 'p4', name: 'Mitti (Rain)', price: 14110, family: 'Earthy', intensity: 'Medium', rating: 4.7, img: 'images/mitti_rain.png', notes: 'Petrichor, Sandalwood', topNotes: ['Ozone', 'Wet Earth', 'Green Leaves'], middleNotes: ['Geosmin', 'Iris Root'], baseNotes: ['Mysore Sandalwood', 'Vetiver', 'Patchouli'], heritage: true, allergens: 'Evernia Furfuracea, Farnesol, Linalool', desc: 'The scent of first rain on sun-parched earth.' },
        { id: 'p5', name: 'Oud Mystique', price: 19090, family: 'Woody', intensity: 'Strong', rating: 5.0, img: 'images/oud_mystique.png', notes: 'Authentic Oud, Patchouli', topNotes: ['Incense', 'Black Pepper'], middleNotes: ['Agarwood (Oud)', 'Cedar', 'Cypriol'], baseNotes: ['Dark Patchouli', 'Leather', 'Musk'], heritage: true, allergens: 'Linalool, Coumarin, Eugenol', desc: 'Ancient, deep, and majestic.' },
        { id: 'p6', name: 'Velvet Iris', price: 17430, family: 'Floral', intensity: 'Strong', rating: 4.9, img: 'images/velvet_iris.png', notes: 'Velvet Iris, Gold Dust, Musk', topNotes: ['Mandarin', 'Violet Leaf'], middleNotes: ['Tuscan Iris', 'Heliotrope', 'Ylang-Ylang'], baseNotes: ['Vanilla Bean', 'White Musk', 'Suede'], allergens: 'Alpha-Isomethyl Ionone, Linalool, Benzyl Alcohol', desc: 'A royal floral experience with a touch of gold.' },
        { id: 'p7', name: 'Citrus Solace', price: 12865, family: 'Fresh', intensity: 'Mild', rating: 4.5, img: 'images/citrus_solace.png', notes: 'Blood Orange, Wood, Sunbeams', topNotes: ['Blood Orange', 'Grapefruit', 'Neroli'], middleNotes: ['Orange Blossom', 'Petitgrain', 'Fig'], baseNotes: ['Cedarwood', 'Vetiver', 'Solar Notes'], allergens: 'Limonene, Linalool, Citral, Geraniol', desc: 'The warmth of a Mediterranean summer.' },
        { id: 'p8', name: 'Royal Spice', price: 20335, family: 'Spicy', intensity: 'Strong', rating: 5.0, img: 'images/royal_spice.png', notes: 'Black Pepper, Cardamom, Amber', topNotes: ['Black Pepper', 'Nutmeg', 'Coriander'], middleNotes: ['Cardamom', 'Cinnamon', 'Cumin'], baseNotes: ['Amber Resin', 'Olibanum', 'Tonka Bean'], heritage: true, allergens: 'Eugenol, Cinnamal, Coumarin, Linalool', desc: 'A commanding presence of ancient spices.' },
        { id: 'p9', name: 'Morning Mist', price: 11620, family: 'Fresh', intensity: 'Mild', rating: 4.4, img: 'images/morning_mist.png', notes: 'Wild Mint, Dew, Green Leaves', topNotes: ['Wild Mint', 'Eucalyptus', 'Cucumber'], middleNotes: ['Green Tea', 'Water Lily'], baseNotes: ['White Woods', 'Musk', 'Moss'], allergens: 'Limonene, Linalool, Citral', desc: 'Crisp, invigorating morning air in a bottle.' },
        { id: 'p10', name: 'Rose Royale', price: 16600, family: 'Floral', intensity: 'Medium', rating: 4.8, img: 'images/rose_royale.png', notes: 'Damask Rose, Honey, Musk', topNotes: ['Pink Pepper', 'Red Berries'], middleNotes: ['Damask Rose', 'Peony', 'Geranium'], baseNotes: ['Honey', 'White Musk', 'Amber'], allergens: 'Geraniol, Citronellol, Linalool, Eugenol', desc: 'A luxurious blooming garden of royal roses.' },
        { id: 'p11', name: 'Amber Horizon', price: 17845, family: 'Woody', intensity: 'Strong', rating: 4.9, img: 'images/amber_horizon.png', notes: 'Amber, Sandalwood, Resin', topNotes: ['Bergamot', 'Saffron'], middleNotes: ['Amber Resin', 'Labdanum'], baseNotes: ['Sandalwood', 'Patchouli', 'Vanilla'], allergens: 'Coumarin, Linalool, Benzyl Benzoate', desc: 'Warm glowing amber inspired by sunset horizons.' },
        { id: 'p12', name: 'Lotus Serenity', price: 14525, family: 'Floral', intensity: 'Mild', rating: 4.6, img: 'images/lotus_serenity.png', notes: 'Lotus, White Tea, Musk', topNotes: ['Green Apple', 'Bamboo'], middleNotes: ['Lotus Flower', 'White Tea'], baseNotes: ['White Musk', 'Soft Woods'], allergens: 'Linalool, Benzyl Alcohol, Limonene', desc: 'A peaceful aquatic floral fragrance.' },
        { id: 'p13', name: 'Desert Sandal', price: 18675, family: 'Woody', intensity: 'Strong', rating: 4.8, img: 'images/desert_sandal.png', notes: 'Sandalwood, Amber, Spices', topNotes: ['Saffron', 'Pink Pepper'], middleNotes: ['Sandalwood', 'Cedarwood'], baseNotes: ['Amber', 'Oud', 'Vanilla'], heritage: true, allergens: 'Linalool, Coumarin, Eugenol', desc: 'Smooth Mysore sandalwood blended with warm desert spices.' },
        { id: 'p14', name: 'Golden Champa', price: 17015, family: 'Floral', intensity: 'Medium', rating: 4.7, img: 'images/golden_champa.png', notes: 'Champaca, Honey, Jasmine', topNotes: ['Orange Blossom', 'Mandarin'], middleNotes: ['Champaca', 'Jasmine'], baseNotes: ['Honey', 'Musk', 'Amber'], heritage: true, allergens: 'Benzyl Alcohol, Linalool, Limonene', desc: 'Inspired by sacred temple flowers.' },
        { id: 'p15', name: 'Ocean Drift', price: 13695, family: 'Fresh', intensity: 'Mild', rating: 4.5, img: 'images/ocean_drift.png', notes: 'Sea Breeze, Citrus, Driftwood', topNotes: ['Lemon', 'Marine Notes'], middleNotes: ['Sea Salt', 'Blue Lotus'], baseNotes: ['Driftwood', 'Musk'], allergens: 'Limonene, Linalool, Citral', desc: 'Refreshing waves and ocean breeze.' },
        { id: 'p16', name: 'Velvet Amber', price: 19505, family: 'Woody', intensity: 'Strong', rating: 4.9, img: 'images/velvet_amber.png', notes: 'Amber, Tonka Bean, Vanilla', topNotes: ['Clove', 'Pink Pepper'], middleNotes: ['Amber', 'Cinnamon'], baseNotes: ['Tonka Bean', 'Vanilla', 'Musk'], allergens: 'Coumarin, Cinnamal, Benzyl Benzoate', desc: 'A warm and addictive amber fragrance.' },
        { id: 'p17', name: 'Garden Bloom', price: 14110, family: 'Floral', intensity: 'Mild', rating: 4.6, img: 'images/garden_bloom.png', notes: 'Peony, Rose, Lily', topNotes: ['Pear', 'Bergamot'], middleNotes: ['Peony', 'Rose', 'Lily'], baseNotes: ['White Musk', 'Sandalwood'], allergens: 'Citronellol, Geraniol, Linalool', desc: 'A fresh blooming spring garden.' },
        { id: 'p18', name: 'Mystic Vetiver', price: 18260, family: 'Earthy', intensity: 'Medium', rating: 4.8, img: 'images/mystic_vetiver.png', notes: 'Vetiver, Moss, Woods', topNotes: ['Lime', 'Green Pepper'], middleNotes: ['Vetiver', 'Iris'], baseNotes: ['Oakmoss', 'Cedarwood', 'Amber'], heritage: true, allergens: 'Evernia Furfuracea, Linalool, Limonene', desc: 'Deep earthy aroma inspired by forest soil.' },
        { id: 'p19', name: 'Sunset Nectar', price: 15355, family: 'Sweet', intensity: 'Medium', rating: 4.7, img: 'images/sunset_nectar.png', notes: 'Peach, Honey, Vanilla', topNotes: ['Peach', 'Apricot'], middleNotes: ['Honey', 'Orange Blossom'], baseNotes: ['Vanilla', 'Caramel', 'Musk'], allergens: 'Benzyl Benzoate, Limonene, Linalool', desc: 'A sweet golden fragrance of sunset fruits.' }
    ];

    const CURATED_DATA = [
        // Floral & Elegant (1–20)
        { name: "Velvet Bloom", family: "Floral", notes: "Peony, Rose, White Musk", top: "Pink Peony", heart: "Damask Rose", base: "White Musk", allergens: "Geraniol, Citronellol, Linalool" },
        { name: "Rose Éternelle", family: "Floral", notes: "Centifolia Rose, Honey, Amber", top: "Honey", heart: "Centifolia Rose", base: "Amber", allergens: "Geraniol, Citronellol, Coumarin" },
        { name: "Whispering Peony", family: "Floral", notes: "White Peony, White Tea, Pear", top: "Pear", heart: "White Peony", base: "White Tea", allergens: "Linalool, Geraniol" },
        { name: "Moonlit Jasmine", family: "Floral", notes: "Night Jasmine, Star Jasmine, Sandalwood", top: "Night Jasmine", heart: "Star Jasmine", base: "Sandalwood", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Orchid Reverie", family: "Floral", notes: "Black Orchid, Vanilla, Patchouli", top: "Black Orchid", heart: "Vanilla Bean", base: "Patchouli", allergens: "Linalool, Coumarin" },
        { name: "Ivory Petals", family: "Floral", notes: "Gardenia, Tuberose, Jasmine", top: "Gardenia", heart: "Tuberose", base: "Jasmine", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Crimson Blossom", family: "Floral", notes: "Hibiscus, Red Berries, White Musk", top: "Red Berries", heart: "Hibiscus", base: "Musk", allergens: "Linalool, Citronellol" },
        { name: "Garden of Silk", family: "Floral", notes: "Silk Tree, Lotus, Golden Amber", top: "Silk Tree", heart: "Lotus", base: "Amber", allergens: "Linalool, Coumarin" },
        { name: "Petal Mirage", family: "Floral", notes: "Desert Rose, Saffron, Mysore Sandalwood", top: "Desert Rose", heart: "Saffron", base: "Sandalwood", allergens: "Geraniol, Eugenol, Linalool" },
        { name: "White Gardenia", family: "Floral", notes: "White Gardenia, Lilac, Musk", top: "White Gardenia", heart: "Lilac", base: "Musk", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Magnolia Veil", family: "Floral", notes: "Magnolia, Bergamot, White Musk", top: "Bergamot", heart: "Magnolia", base: "Musk", allergens: "Linalool, Citral" },
        { name: "Fleur Mystique", family: "Floral", notes: "Mystic Bloom, Oud, Golden Amber", top: "Mystic Bloom", heart: "Oud", base: "Amber", allergens: "Linalool, Coumarin" },
        { name: "Amber Rose", family: "Floral", notes: "Turkish Rose, Amber, Vanilla", top: "Rose", heart: "Amber", base: "Vanilla", allergens: "Geraniol, Coumarin, Linalool" },
        { name: "Midnight Lily", family: "Floral", notes: "White Lily, Dark Woods, Musk", top: "Lily", heart: "Dark Woods", base: "Musk", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Blushing Orchid", family: "Floral", notes: "Orchid, Peach, Musk", top: "Peach", heart: "Orchid", base: "Musk", allergens: "Linalool, Benzyl Benzoate" },
        { name: "Golden Tuberose", family: "Floral", notes: "Tuberose, Wild Honey, Golden Resin", top: "Wild Honey", heart: "Tuberose", base: "Golden Resin", allergens: "Benzyl Alcohol, Coumarin" },
        { name: "Enchanted Magnolia", family: "Floral", notes: "Magnolia, Green Leaves, Musk", top: "Green Leaves", heart: "Magnolia", base: "Musk", allergens: "Linalool, Citral" },
        { name: "Floral Serenity", family: "Floral", notes: "Lavender, Chamomile, Madagascar Vanilla", top: "Lavender", heart: "Chamomile", base: "Vanilla", allergens: "Linalool, Coumarin" },
        { name: "Scarlet Peony", family: "Floral", notes: "Red Peony, Pink Pepper, Musk", top: "Pink Pepper", heart: "Red Peony", base: "Musk", allergens: "Geraniol, Linalool" },
        { name: "Radiant Jasmine", family: "Floral", notes: "Star Jasmine, Sicilian Lemon, Musk", top: "Lemon", heart: "Jasmine", base: "Musk", allergens: "Benzyl Alcohol, Citral, Limonene" },

        // Fresh & Clean (21–40)
        { name: "Ethereal Dew", family: "Fresh", notes: "Morning Dew, White Musk, Green Apple", top: "Green Apple", heart: "Morning Dew", base: "White Musk", allergens: "Limonene, Linalool" },
        { name: "Ocean Whisper", family: "Fresh", notes: "Sea Salt, Ozone, Seaweed", top: "Ozone", heart: "Sea Salt", base: "Seaweed", allergens: "Limonene, Linalool" },
        { name: "Morning Breeze", family: "Fresh", notes: "Clean Linen, Cotton, Lavender", top: "Linen", heart: "Cotton", base: "Lavender", allergens: "Linalool, Limonene" },
        { name: "Aqua Lumina", family: "Fresh", notes: "Pure Water, Bergamot, Musk", top: "Bergamot", heart: "Water", base: "Musk", allergens: "Citral, Limonene" },
        { name: "Silver Rain", family: "Fresh", notes: "Rain Accord, Metallic Notes, Musk", top: "Rain", heart: "Silver Notes", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Pure Horizon", family: "Fresh", notes: "Sky Accord, White Woods, Musk", top: "Sky Accord", heart: "White Woods", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Crystal Waters", family: "Fresh", notes: "Mountain Air, Mineral Water, Musk", top: "Mountain Air", heart: "Water", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Arctic Mist", family: "Fresh", notes: "Icy Mint, Eucalyptus, Musk", top: "Ice Accord", heart: "Mint", base: "Eucalyptus", allergens: "Limonene, Linalool" },
        { name: "Azure Drift", family: "Fresh", notes: "Marine Notes, Blueberries, Musk", top: "Blueberries", heart: "Marine Notes", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Luminous Sky", family: "Fresh", notes: "Sunlight Accord, Ozone, Musk", top: "Sunlight", heart: "Ozone", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Fresh Aurora", family: "Fresh", notes: "Brisk Citrus, Green Leaves, Pine", top: "Citrus", heart: "Green Leaves", base: "Pine", allergens: "Citral, Limonene" },
        { name: "Cloud Garden", family: "Fresh", notes: "White Flowers, Ozone, Musk", top: "White Flowers", heart: "Ozone", base: "Musk", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Alpine Breeze", family: "Fresh", notes: "Pine, Snow Accord, Cedar", top: "Snow Accord", heart: "Pine", base: "Cedar", allergens: "Limonene, Linalool" },
        { name: "Frozen Petals", family: "Fresh", notes: "Icy Rose, Mint, Musk", top: "Mint", heart: "Icy Rose", base: "Musk", allergens: "Geraniol, Limonene" },
        { name: "Blue Horizon", family: "Fresh", notes: "Deep Sea, Clear Sky, Musk", top: "Sky", heart: "Sea", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Spring Cascade", family: "Fresh", notes: "Waterfall Accord, Ivy, Musk", top: "Ivy", heart: "Waterfall", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Frosted Citrus", family: "Fresh", notes: "Frozen Lemon, Key Lime, Musk", top: "Frozen Lemon", heart: "Lime", base: "Musk", allergens: "Citral, Limonene" },
        { name: "Whispering Tide", family: "Fresh", notes: "Sea Shells, Salt, Musk", top: "Shells", heart: "Salt", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Dewdrop Essence", family: "Fresh", notes: "Morning Dew, Wildflowers, Musk", top: "Morning Dew", heart: "Wildflowers", base: "Musk", allergens: "Linalool, Limonene" },
        { name: "Celestial Air", family: "Fresh", notes: "Ether Accord, Stardust, Musk", top: "Ether", heart: "Stardust", base: "Musk", allergens: "Limonene, Linalool" },

        // Woody & Earthy (41–60)
        { name: "Kashmiri Saffron", family: "Woody", notes: "Pure Saffron, Mysore Sandalwood, Turkish Rose", top: "Saffron", heart: "Rose", base: "Sandalwood", allergens: "Eugenol, Geraniol, Linalool" },
        { name: "Oud Mystique", family: "Woody", notes: "Authentic Oud, Patchouli, Dark Resin", top: "Resin", heart: "Oud", base: "Patchouli", allergens: "Linalool, Coumarin" },
        { name: "Cedar Empire", family: "Woody", notes: "Atlas Cedar, Oakmoss, Pine", top: "Pine", heart: "Cedar", base: "Moss", allergens: "Evernia Furfuracea, Limonene" },
        { name: "Sandalwood Crown", family: "Woody", notes: "Mysore Sandalwood, Warm Spices, Musk", top: "Spices", heart: "Sandalwood", base: "Musk", allergens: "Eugenol, Linalool" },
        { name: "Timber Noir", family: "Woody", notes: "Black Wood, Oud, Patchouli", top: "Black Wood", heart: "Oud", base: "Patchouli", allergens: "Linalool, Coumarin" },
        { name: "Forest Reverence", family: "Woody", notes: "English Oak, Wet Moss, Fern", top: "Fern", heart: "Oak", base: "Moss", allergens: "Evernia Furfuracea, Linalool" },
        { name: "Earthbound Amber", family: "Woody", notes: "Golden Amber, Wet Earth, Sandalwood", top: "Earth", heart: "Amber", base: "Sandalwood", allergens: "Coumarin, Linalool" },
        { name: "Golden Vetiver", family: "Woody", notes: "Vetiver, Ruby Grapefruit, Cedar", top: "Grapefruit", heart: "Vetiver", base: "Cedar", allergens: "Limonene, Linalool" },
        { name: "Oakwood Legacy", family: "Woody", notes: "Oak, Cask Whiskey, Tobacco", top: "Whiskey", heart: "Oak", base: "Tobacco", allergens: "Coumarin, Linalool" },
        { name: "Smoked Cedar", family: "Woody", notes: "Smoked Cedarwood, Leather, Birch Tar", top: "Birch", heart: "Smoked Cedar", base: "Leather", allergens: "Linalool, Limonene" },
        { name: "Mystic Agarwood", family: "Woody", notes: "Agarwood (Oud), Frankincense, Amber", top: "Incense", heart: "Agarwood", base: "Amber", allergens: "Linalool, Coumarin" },
        { name: "Velvet Patchouli", family: "Woody", notes: "Patchouli, Vanilla Bean, Musk", top: "Vanilla", heart: "Patchouli", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Moss & Ember", family: "Woody", notes: "Oakmoss, Smoke Accord, Cedar", top: "Smoke", heart: "Moss", base: "Cedar", allergens: "Evernia Furfuracea, Linalool" },
        { name: "Himalayan Woods", family: "Woody", notes: "Himalayan Pine, Atlas Cedar, Musk", top: "Pine", heart: "Cedar", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Desert Sandal", family: "Woody", notes: "Mysore Sandalwood, Saffron, Oud", top: "Saffron", heart: "Sandalwood", base: "Oud", allergens: "Eugenol, Linalool" },
        { name: "Ancient Bark", family: "Woody", notes: "Old Wood Accord, Moss, Resin", top: "Resin", heart: "Old Wood", base: "Moss", allergens: "Evernia Furfuracea, Coumarin" },
        { name: "Woodland Essence", family: "Woody", notes: "Spruce, Pine, Musk", top: "Spruce", heart: "Pine", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Amber Timber", family: "Woody", notes: "Golden Amber, Cedar, Patchouli", top: "Cedar", heart: "Amber", base: "Patchouli", allergens: "Coumarin, Linalool" },
        { name: "Wild Vetiver", family: "Woody", notes: "Haitian Vetiver, Bergamot, Musk", top: "Bergamot", heart: "Vetiver", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Mystic Forest", family: "Woody", notes: "Evergreen, Oakmoss, Cedar", top: "Evergreen", heart: "Moss", base: "Cedar", allergens: "Evernia Furfuracea, Linalool" },

        // Oriental & Spicy (61–80)
        { name: "Royal Amber", family: "Spicy", notes: "Golden Amber, Cardamom, Sandalwood", top: "Cardamom", heart: "Amber", base: "Sandalwood", allergens: "Coumarin, Eugenol, Linalool" },
        { name: "Midnight Saffron", family: "Spicy", notes: "Saffron, Black Pepper, Oud", top: "Black Pepper", heart: "Saffron", base: "Oud", allergens: "Eugenol, Linalool" },
        { name: "Velvet Spice", family: "Spicy", notes: "Ceylon Cinnamon, Nutmeg, Vanilla", top: "Nutmeg", heart: "Cinnamon", base: "Vanilla", allergens: "Cinnamal, Coumarin" },
        { name: "Desert Mirage", family: "Spicy", notes: "Saffron, Fresh Ginger, Amber", top: "Ginger", heart: "Saffron", base: "Amber", allergens: "Eugenol, Coumarin" },
        { name: "Golden Incense", family: "Spicy", notes: "Incense, Gold Resin, Musk", top: "Gold Resin", heart: "Incense", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Sultan’s Secret", family: "Spicy", notes: "Royal Spices, Agarwood, Musk", top: "Royal Spices", heart: "Oud", base: "Musk", allergens: "Eugenol, Cinnamal, Linalool" },
        { name: "Crimson Oud", family: "Spicy", notes: "Oud, Red Pepper, Damask Rose", top: "Red Pepper", heart: "Oud", base: "Rose", allergens: "Geraniol, Eugenol" },
        { name: "Arabian Ember", family: "Spicy", notes: "Amber, Exotic Spices, Oud", top: "Spices", heart: "Amber", base: "Oud", allergens: "Coumarin, Eugenol" },
        { name: "Mystic Bazaar", family: "Spicy", notes: "Exotic Spices, Black Tea, Musk", top: "Tea", heart: "Exotic Spices", base: "Musk", allergens: "Eugenol, Linalool" },
        { name: "Spiced Silk", family: "Spicy", notes: "Clove, Silk Accord, Amber", top: "Clove", heart: "Silk Accord", base: "Amber", allergens: "Eugenol, Coumarin" },
        { name: "Imperial Saffron", family: "Spicy", notes: "Kashmiri Saffron, Imperial Spices, Oud", top: "Imperial Spices", heart: "Saffron", base: "Oud", allergens: "Eugenol, Linalool" },
        { name: "Amber Dynasty", family: "Spicy", notes: "Royal Amber, Dynastic Spices, Musk", top: "Dynastic Spices", heart: "Amber", base: "Musk", allergens: "Coumarin, Eugenol" },
        { name: "Dark Cardamom", family: "Spicy", notes: "Cardamom, Roasted Coffee, Oud", top: "Coffee", heart: "Cardamom", base: "Oud", allergens: "Eugenol, Linalool" },
        { name: "Spiced Amberwood", family: "Spicy", notes: "Amber Resin, Warm Wood, Spices", top: "Spices", heart: "Amber", base: "Wood", allergens: "Coumarin, Eugenol" },
        { name: "Secret Caravan", family: "Spicy", notes: "Ancient Spices, Sandalwood, Musk", top: "Travel Spices", heart: "Sandalwood", base: "Musk", allergens: "Eugenol, Linalool" },
        { name: "Royal Myrrh", family: "Spicy", notes: "Sacred Myrrh, Royal Resin, Musk", top: "Royal Resin", heart: "Myrrh", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Velvet Incense", family: "Spicy", notes: "Frankincense, Velvet Accord, Musk", top: "Velvet Accord", heart: "Incense", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Exotic Ember", family: "Spicy", notes: "Smouldering Ember, Spices, Musk", top: "Spices", heart: "Ember Accord", base: "Musk", allergens: "Eugenol, Coumarin" },
        { name: "Shadowed Spice", family: "Spicy", notes: "Black Pepper, Dark Spices, Oud", top: "Black Pepper", heart: "Spices", base: "Oud", allergens: "Eugenol, Linalool" },
        { name: "Night Bazaar", family: "Spicy", notes: "Cardamom, Black Tea, Oud", top: "Tea", heart: "Midnight Spices", base: "Oud", allergens: "Eugenol, Linalool" },

        // Dark, Luxury & Mysterious (81–100)
        { name: "Nocturnal Silk", family: "Dark", notes: "Blackened Silk, Oud, Vanilla Musk", top: "Blackened Silk", heart: "Oud", base: "Musk", allergens: "Linalool, Coumarin, Benzyl Alcohol" },
        { name: "Phantom Bloom", family: "Dark", notes: "Dark Flora, Black Incense, Musk", top: "Incense", heart: "Dark Flora", base: "Musk", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Black Velvet", family: "Dark", notes: "Velvet Accord, Black Woods, Musk", top: "Black Woods", heart: "Velvet Accord", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Obsidian Aura", family: "Dark", notes: "Obsidian Accord, Oud, Musk", top: "Obsidian Accord", heart: "Oud", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Midnight Elixir", family: "Dark", notes: "Dark Resin, Exotic Spices, Musk", top: "Spices", heart: "Dark Resin", base: "Musk", allergens: "Eugenol, Coumarin" },
        { name: "Dark Aurora", family: "Dark", notes: "Aurora Accord, Pine, Musk", top: "Pine", heart: "Aurora Accord", base: "Musk", allergens: "Limonene, Linalool" },
        { name: "Eclipse Essence", family: "Dark", notes: "Moonlight Accord, Cedar, Musk", top: "Moonlight", heart: "Cedar", base: "Musk", allergens: "Linalool, Limonene" },
        { name: "Velvet Abyss", family: "Dark", notes: "Deep Woods, Velvet Accord, Musk", top: "Velvet", heart: "Deep Woods", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Lunar Obsession", family: "Dark", notes: "Moonflower, Golden Amber, Musk", top: "Moonflower", heart: "Amber", base: "Musk", allergens: "Benzyl Alcohol, Coumarin" },
        { name: "Shadow Garden", family: "Dark", notes: "Nocturnal Gardenia, Oud, Musk", top: "Nocturnal Gardenia", heart: "Oud", base: "Musk", allergens: "Benzyl Alcohol, Linalool" },
        { name: "Moonlit Velvet", family: "Dark", notes: "Moonlight Accord, Velvet, Musk", top: "Moonlight", heart: "Velvet", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Noir Symphony", family: "Dark", notes: "Dark Notes, Music Accord, Musk", top: "Music Accord", heart: "Dark Notes", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Infinite Dusk", family: "Dark", notes: "Eternal Sunset, Cedar, Musk", top: "Eternal Sunset", heart: "Cedar", base: "Musk", allergens: "Linalool, Limonene" },
        { name: "Starlit Obsidian", family: "Dark", notes: "Starlight Accord, Obsidian, Musk", top: "Starlight", heart: "Obsidian", base: "Musk", allergens: "Linalool, Limonene" },
        { name: "Eternal Noir", family: "Dark", notes: "Undying Dark, Oud, Musk", top: "Undying Dark", heart: "Oud", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Nightfall Whisper", family: "Dark", notes: "Shadows Accord, Sandalwood, Musk", top: "Shadows", heart: "Sandalwood", base: "Musk", allergens: "Linalool, Limonene" },
        { name: "Obsidian Dream", family: "Dark", notes: "Deep Sleep Accord, Dark Woods, Musk", top: "Deep Sleep", heart: "Dark Woods", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Dark Reverie", family: "Dark", notes: "Dark Thoughts Accord, Oud, Musk", top: "Dark Thoughts", heart: "Oud", base: "Musk", allergens: "Linalool, Coumarin" },
        { name: "Twilight Elixir", family: "Dark", notes: "Sunset Resin, Spices, Musk", top: "Spices", heart: "Sunset Resin", base: "Musk", allergens: "Eugenol, Coumarin" },
        { name: "Infinite Midnight", family: "Dark", notes: "Eternal Night, Darkness Accord, Musk", top: "Darkness Accord", heart: "Eternal Night", base: "Musk", allergens: "Linalool, Limonene" }
    ];

    const generatePerfumes = () => {
        let perfumes = [...basePerfumeData];
        const intensities = ['Mild', 'Medium', 'Strong'];

        const getAllergensForNotes = (name, family, notes) => {
            const allergens = new Set(['Linalool', 'Limonene']); // Core basics
            const combined = (name + ' ' + family + ' ' + notes).toLowerCase();
            
            if (combined.includes('rose') || combined.includes('bloom') || combined.includes('petal') || combined.includes('peony') || combined.includes('geranium')) {
                allergens.add('Geraniol');
                allergens.add('Citronellol');
            }
            if (combined.includes('jasmine') || combined.includes('floral') || combined.includes('gardenia') || combined.includes('lily')) {
                allergens.add('Benzyl Alcohol');
            }
            if (combined.includes('citrus') || combined.includes('lemon') || combined.includes('bergamot') || combined.includes('orange') || combined.includes('fresh') || combined.includes('blood orange')) {
                allergens.add('Citral');
            }
            if (combined.includes('spice') || combined.includes('saffron') || combined.includes('cinnamon') || combined.includes('clove') || combined.includes('cardamom') || combined.includes('pepper')) {
                allergens.add('Eugenol');
                allergens.add('Cinnamal');
            }
            if (combined.includes('amber') || combined.includes('vanilla') || combined.includes('sweet') || combined.includes('tonka') || combined.includes('honey')) {
                allergens.add('Coumarin');
                allergens.add('Benzyl Benzoate');
            }
            if (combined.includes('moss') || combined.includes('earth') || combined.includes('vetiver') || combined.includes('forest')) {
                allergens.add('Evernia Furfuracea');
            }
            if (combined.includes('iris') || combined.includes('violet')) {
                allergens.add('Alpha-Isomethyl Ionone');
            }

            return Array.from(allergens).join(', ');
        };

        CURATED_DATA.forEach((data, index) => {
            const i = index + 20;
            const intensity = intensities[index % intensities.length];
            const price = 11620 + (i * 166); // Normalized to INR logic
            const excludedFromAI = [35, 42, 49, 56, 70, 84, 98];

            perfumes.push({
                id: `p${i}`,
                name: data.name,
                price: price,
                family: data.family,
                intensity: intensity,
                rating: (4.0 + Math.random()).toFixed(1),
                img: `https://picsum.photos/400/500?random=${i}`,
                notes: data.notes,
                topNotes: [data.top, 'Bergamot'],
                middleNotes: [data.heart, data.family],
                baseNotes: [data.base, 'Musk'],
                allergens: data.allergens || getAllergensForNotes(data.name, data.family, data.notes),
                desc: `A unique craft from our ${data.family} series.`,
                aiRecommended: (i % 7 === 0) && !excludedFromAI.includes(i)
            });
        });
        return perfumes;
    };

    const perfumeData = generatePerfumes();

    // --- Profile Editing Logic ---
    window.toggleEditProfile = () => {
        const infoGrid = document.getElementById('editable-info');
        const editBtn = document.getElementById('edit-profile-btn');
        const isEditing = editBtn.innerText === 'Save Changes';

        if (!isEditing) {
            // Enter edit mode
            infoGrid.querySelectorAll('p').forEach(p => {
                const key = p.dataset.key;
                const value = p.innerText;
                p.innerHTML = `<input type="text" value="${value}" class="glass-input" style="width: 100%; border: none; background: rgba(0,0,0,0.1); color: white; padding: 5px; border-radius: 4px;">`;
            });
            editBtn.innerText = 'Save Changes';
            editBtn.classList.add('active');
            
            // Show Cancel button if it doesn't exist
            if (!document.getElementById('cancel-edit-btn')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancel-edit-btn';
                cancelBtn.className = 'secondary-btn';
                cancelBtn.innerText = 'Cancel';
                cancelBtn.style.marginLeft = '10px';
                cancelBtn.style.padding = '4px 12px';
                cancelBtn.onclick = () => location.reload(); // Simple cancel
                editBtn.parentElement.appendChild(cancelBtn);
            }
        } else {
            // Save changes
            infoGrid.querySelectorAll('p').forEach(p => {
                const input = p.querySelector('input');
                if (input) {
                    p.innerText = input.value;
                }
            });
            editBtn.innerText = 'Edit Profile';
            editBtn.classList.remove('active');
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.remove();
            showToast('Profile updated successfully.');
        }
    };

    // --- Home Screen Feature Initializers ---
    const initHomeScreenFeatures = () => {
        // Fragrance Wheel
        const wheelData = {
            'Floral': { notes: ['Rose', 'Jasmine', 'Peony'], perfumes: ['p1', 'p20', 'p10'] },
            'Fresh': { notes: ['Bergamot', 'Sea Salt', 'Mint'], perfumes: ['p2', 'p21', 'p22'] },
            'Woody': { notes: ['Sandalwood', 'Cedar', 'Oud'], perfumes: ['p5', 'p41', 'p42'] },
            'Spicy': { notes: ['Saffron', 'Cardamom', 'Pepper'], perfumes: ['p3', 'p61', 'p62'] },
            'Dark': { notes: ['Black Velvet', 'Incense', 'Moonlight'], perfumes: ['p1', 'p81', 'p82'] }
        };

        window.exploreFamily = (family) => {
            const display = document.getElementById('wheel-explorer-display');
            const data = wheelData[family];
            if (!data) return;

            display.innerHTML = `
                <div style="animation: fadeIn 0.5s ease;">
                    <h4>${family} Notes</h4>
                    <div class="tag-row" style="margin-top: 1rem;">${data.notes.map(n => `<span class="tag" style="cursor:pointer;" onclick="filterCollectionByNote('${n}')">${n}</span>`).join('')}</div>
                    <p style="margin-top: 1.5rem;">Recommended Scents:</p>
                    <div class="mini-scroll" style="display: flex; gap: 1rem; overflow-x: auto; margin-top: 1rem; padding-bottom: 0.5rem;">
                        ${data.perfumes.map(id => {
                            const p = perfumeData.find(x => x.id === id);
                            return p ? `<div class="mini-card" onclick="openProductDetail('${p.id}')" style="min-width: 150px; padding: 1rem;">
                                <img src="${p.img}" style="height: 100px; margin-bottom: 0.5rem;">
                                <h5 style="font-size: 0.9rem;">${p.name}</h5>
                            </div>` : '';
                        }).join('')}
                    </div>
                </div>
            `;
        };

        // Quick Finder
        window.quickFindPerfume = () => {
            const family = document.getElementById('finder-family').value;
            const intensity = document.getElementById('finder-intensity').value;
            const query = document.getElementById('finder-search').value.toLowerCase();
            const resultsContainer = document.getElementById('finder-results');

            let filtered = perfumeData.filter(p => {
                const matchFam = family === 'All' || p.family.toLowerCase() === family.toLowerCase();
                const matchInt = intensity === 'All' || p.intensity.toLowerCase() === intensity.toLowerCase();
                const matchQuery = !query || 
                                  p.name.toLowerCase().includes(query) || 
                                  p.notes.toLowerCase().includes(query) || 
                                  p.family.toLowerCase().includes(query) ||
                                  p.topNotes.some(n => n.toLowerCase().includes(query)) ||
                                  p.middleNotes.some(n => n.toLowerCase().includes(query)) ||
                                  p.baseNotes.some(n => n.toLowerCase().includes(query));
                return matchFam && matchInt && matchQuery;
            });

            if (filtered.length === 0) {
                resultsContainer.innerHTML = '<p class="empty-msg">No matches found for this vibration.</p>';
                return;
            }
            resultsContainer.innerHTML = filtered.slice(0, 6).map(p => `
                <div class="mini-card" onclick="openProductDetail('${p.id}')" style="min-width: 140px; padding: 1rem; flex: 1;">
                    <img src="${p.img}" style="height: 100px; margin-bottom: 0.5rem; object-fit: cover;">
                    <h5 style="font-size: 0.85rem;">${p.name}</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${p.family}</p>
                </div>
            `).join('');
        };
    };

    // --- Profile Tab Management ---
    window.switchProfileTab = (tabId) => {
        document.querySelectorAll('.profile-tabs .nav-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        const content = document.getElementById('profile-tab-content');
        if (!content) return;

        let html = '';
        switch(tabId) {
            case 'identity':
                html = `
                    <div class="profile-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Personal Details</h3>
                            <button class="secondary-btn" id="edit-profile-btn" onclick="toggleEditProfile()" style="padding: 4px 12px;">Edit Profile</button>
                        </div>
                        <div class="profile-info-grid" id="editable-info">
                            <div class="info-item"><label>Full Name</label><p data-key="name" contenteditable="false">Guest User</p></div>
                            <div class="info-item"><label>Email Address</label><p data-key="email" contenteditable="false">guest@inai.com</p></div>
                            <div class="info-item"><label>Phone Number</label><p data-key="phone" contenteditable="false">+91 98765 43210</p></div>
                            <div class="info-item"><label>Date of Birth</label><p data-key="birth" contenteditable="false">Not inscribed</p></div>
                        </div>
                    </div>
                `;
                break;
            case 'orders':
                html = `<div class="profile-section"><h3>Order History</h3><p class="empty-msg">No echoes of past curations found.</p></div>`;
                break;
            case 'addresses':
                html = `
                    <div class="profile-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Saved Addresses</h3>
                            <button class="secondary-btn" style="padding: 4px 12px;">Add New</button>
                        </div>
                        <p class="empty-msg">No shipping sanctuaries registered.</p>
                    </div>
                `;
                break;
            case 'payments':
                html = `<div class="profile-section"><h3>Payment Methods</h3><p class="empty-msg">No payment rituals saved.</p></div>`;
                break;
            case 'wishlist':
                if (wishlist.length === 0) {
                    html = `<div class="profile-section"><h3>Wishlist Vault</h3><p class="empty-msg">Your vault is currently empty.</p></div>`;
                } else {
                    html = `<div class="profile-section"><h3>Wishlist Vault</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-top: 1rem;">
                            ${wishlist.map(id => {
                                const p = perfumeData.find(x => x.id === id);
                                if (!p) return '';
                                return `
                                    <div class="mini-card" onclick="openProductDetail('${p.id}')" style="position:relative;">
                                        <button onclick="event.stopPropagation(); toggleWishlist('${p.id}')" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; z-index:10; font-size:12px; display:flex; align-items:center; justify-content:center;">✕</button>
                                        <img src="${p.img}" alt="${p.name}" style="height: 120px; object-fit: cover;">
                                        <h4 style="margin-top: 0.5rem; font-size: 0.9rem;">${p.name}</h4>
                                        <span style="font-size: 0.8rem;">${formatPrice(p.price)}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>`;
                }
                break;
        }
        content.innerHTML = `<div style="animation: fadeIn 0.4s ease;">${html}</div>`;
    };

    // Attach listeners and initializations
    document.querySelectorAll('.profile-tabs .nav-item').forEach(item => {
        item.addEventListener('click', () => switchProfileTab(item.dataset.tab));
    });

    const infoData = {
        'story': {
            title: 'Our Story',
            subtitle: 'The Soul of INAI',
            content: `
                <div class="info-section">
                    <h3>Brand Background</h3>
                    <p>Founded in the heart of timeless traditions and modern innovation, INAI was born from a desire to bridge the gap between ancient olfactory wisdom and future-forward technology. Our name represents the intersection of intuition and intelligence.</p>
                </div>
                <div class="info-section">
                    <h3>Inspiration</h3>
                    <p>We are inspired by the invisible threads that connect a scent to a memory. INAI seeks to capture those fleeting moments—the dew on a morning rose, the smoke of a guttering candle, the crisp air of a mounting peak—and preserve them in glass.</p>
                </div>
                <div class="info-section">
                    <h3>Mission & Vision</h3>
                    <p>Our mission is to democratize luxury perfumery through AI, allowing every individual to find or create a scent that is uniquely theirs. We envision a world where fragrance is not just a product, but a personal signature of the soul.</p>
                </div>
            `
        },
        'process': {
            title: 'Our Process',
            subtitle: 'From Molecule to Masterpiece',
            content: `
                <div class="info-section">
                    <h3>Creation Steps</h3>
                    <p>Every INAI fragrance begins as a digital essence. Our AI analyzes thousands of note combinations against user preferences to suggest a baseline. From there, our master perfumers refine the composition with ethically sourced raw materials.</p>
                </div>
                <div class="info-section">
                    <h3>The Fragrance Pyramid</h3>
                    <p>We believe in the evolution of scent. <strong>Top Notes</strong> provide the initial spark (0-15 mins). <strong>Heart Notes</strong> form the character (15 mins - 4 hrs). <strong>Base Notes</strong> provide the lasting depth (4 hrs - 12+ hrs).</p>
                </div>
            `
        },
        'sustainability': {
            title: 'Sustainability',
            subtitle: 'Conscious Luxury',
            content: `
                <div class="info-section">
                    <h3>Eco-Friendly Packaging</h3>
                    <p>Our bottles are designed to be treasures, not trash. We use recycled glass and our packaging is 100% plastic-free, utilizing mushroom-based foam and FSC-certified paper.</p>
                </div>
                <div class="info-section">
                    <h3>Ethical Sourcing</h3>
                    <p>We partner directly with small-scale farmers in India and around the globe. By cutting out middle-men, we ensure fair wages and sustainable harvesting practices for rare ingredients like Mysore Sandalwood and Kashmiri Saffron.</p>
                </div>
            `
        },
        'shipping': {
            title: 'Shipping',
            subtitle: 'Global Passage',
            content: `
                <div class="info-section">
                    <h3>Delivery Timelines</h3>
                    <p>Domestic (India): 3-5 business days. International: 7-14 business days. Custom Atelier creations require 2 additional days for the maturation ritual.</p>
                </div>
                <div class="info-section">
                    <h3>International Options</h3>
                    <p>We ship to over 150 countries. Complimentary global passage is provided for all collections over ₹5,000.</p>
                </div>
            `
        },
        'returns': {
            title: 'Returns & Refunds',
            subtitle: 'Our Covenant',
            content: `
                <div class="info-section">
                    <h3>Return Policy</h3>
                    <p>Fragrance is personal. If your essence does not resonate, we offer a 14-day discovery return policy. The bottle must be at least 95% full.</p>
                </div>
                <div class="info-section">
                    <h3>Refund Process</h3>
                    <p>Once your return is received and inspected, we notify you of your refund status. Approved refunds are processed within 5-7 business days to your original payment method.</p>
                </div>
            `
        },
        'contact': {
            title: 'Contact Us',
            subtitle: 'We are here to help',
            content: `
                <div class="info-section">
                    <h3>Customer Support</h3>
                    <p>Email: essence@inai.com<br>Phone: +91 1800-INAI-ESSENCE</p>
                </div>
                <form class="contact-form glass" style="padding: 2rem; margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                    <input type="text" placeholder="Your Name" class="glass-input">
                    <input type="email" placeholder="Your Email" class="glass-input">
                    <textarea placeholder="Your Message" class="glass-input" style="height: 150px;"></textarea>
                    <button type="button" class="cta-btn" onclick="showToast('Message sent! Our artisans will respond soon.')">Send Inquiry</button>
                </form>
            `
        }
    };

    window.showInfoPage = (type) => {
        const data = infoData[type];
        if (!data) return;

        const titleEl = document.getElementById('info-title');
        const subtitleEl = document.getElementById('info-subtitle');
        const bodyEl = document.getElementById('info-body');

        if (titleEl) titleEl.innerText = data.title;
        if (subtitleEl) subtitleEl.innerText = data.subtitle;
        if (bodyEl) bodyEl.innerHTML = data.content;
        switchScreen('info-screen');
    };

    window.generatePoetry = () => {
        const select = document.getElementById('poetry-scent-select');
        const display = document.getElementById('poetry-display');
        if (!select || !display) return;

        const chosen = select.value;
        const poems = {
            'Nocturnal Silk': `Wrapped in dark velvet and shadow's embrace,\nA touch of black plum in a sacred space.\nOud and vanilla in twilight soft spun,\nWhere silk meets the starlight when day is all done.`,
            'Ethereal Dew': `Morning breath whispers through petals of white,\nBergamot dancing in glistening light.\nSea salt and blossom where sky meets the sea,\nPure as the dewdrop that sets spirit free.`,
            'Mitti (Rain)': `Parched earth awakening to sky's gentle weeping,\nAncient rain secrets the soil has been keeping.\nPetrichor, sandalwood, ozone divine,\nNature's first drop in a vessel of mine.`,
            'Royal Spice': `Cardamom crowns and a warm amber fire,\nSpices of kings and a noble desire.\nCinnamon whispers of kingdoms long past,\nAn essence majestic that ever shall last.`
        };

        display.style.opacity = '0';
        setTimeout(() => {
            display.innerText = poems[chosen] || `A subtle fragrance, soft and rare,\nA golden ember in the air.\nIt lingers gently on the skin,\nWhere dreams end and memories begin.`;
            display.style.opacity = '1';
        }, 300);
    };

    // Attach footer and house links
    document.querySelectorAll('.house-link, .footer-links a').forEach(link => {
        const contentId = link.dataset.content;
        if (contentId) {
            link.onclick = (e) => {
                e.preventDefault();
                showInfoPage(contentId);
            };
        }
    });

    initHomeScreenFeatures();




    let currentFilter = 'All';

    const renderCollections = (filter = 'All') => {
        const grid = document.getElementById('main-collection-grid');
        if (!grid) return;
        currentFilter = filter;
        
        const filteredData = filter === 'All' ? perfumeData : 
                           filter === 'AI Recommended' ? perfumeData.filter(p => p.aiRecommended) :
                           perfumeData.filter(p => {
                               const term = filter.toLowerCase();
                               return p.family.toLowerCase() === term || 
                                      p.name.toLowerCase().includes(term) || 
                                      p.notes.toLowerCase().includes(term) ||
                                      p.desc.toLowerCase().includes(term);
                           });
        
        grid.innerHTML = filteredData.map(p => `
            <div class="collection-card glass" onclick="openProductPage('${p.id}')">
                ${p.heritage ? `<span class="heritage-badge">Indian Heritage</span>` : ''}
                ${p.aiRecommended ? `<span class="heritage-badge" style="top: 3rem; color: var(--text-secondary);">AI Selection</span>` : ''}
                <div class="card-img" style="background: url('${p.img}') center/cover;">
                    <div class="card-quick-actions">
                        <button class="quick-action-btn" onclick="event.stopPropagation(); toggleWishlist('${p.id}')">Wishlist</button>
                        <button class="quick-action-btn" onclick="event.stopPropagation(); openProductDetail('${p.id}')">Quick View</button>
                        <button class="quick-action-btn" onclick="event.stopPropagation(); quickAdd('${p.id}')">Add</button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${p.name}</h3>
                    <p style="margin-bottom: 0.5rem;">${p.family} • ${p.intensity}</p>
                    <div class="card-notes" title="${p.notes}">
                        Notes: ${p.notes}
                    </div>
                    <div class="card-allergens" title="${p.allergens}">
                        Allergens: ${p.allergens}
                    </div>
                    <div class="price">${formatPrice(p.price)}</div>
                </div>
            </div>
        `).join('');
    };

    const renderHomeCollections = () => {
        const trendingScroll = document.getElementById('trending-scroll');
        const personalizedScroll = document.getElementById('personalized-scroll');
        const newArrivalsScroll = document.getElementById('new-arrivals-scroll');
        const seasonalScroll = document.getElementById('seasonal-scroll');
        
        const renderCards = (items) => items.map(p => `
            <div class="mini-card" onclick="openProductPage('${p.id}')">
                <img data-src="${p.img}" alt="${p.name}" class="lazy-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
                <h4>${p.name}</h4>
                <div class="card-notes" style="font-size: 0.7rem; margin-top: 0.3rem;">${p.notes}</div>
                <span>${formatPrice(p.price)}</span>
            </div>
        `).join('');

        if (trendingScroll) trendingScroll.innerHTML = renderCards(perfumeData.slice(0, 8));
        if (newArrivalsScroll) newArrivalsScroll.innerHTML = renderCards([perfumeData[6], perfumeData[4], perfumeData[3], perfumeData[1], perfumeData[8], perfumeData[10], perfumeData[12], perfumeData[14]]);
        if (seasonalScroll) seasonalScroll.innerHTML = renderCards([perfumeData[2], perfumeData[4], perfumeData[5], perfumeData[7], perfumeData[3], perfumeData[9], perfumeData[11], perfumeData[13]]);
        
        observeLazyImages();
    };

    window.quickAdd = (id) => { 
        const p = perfumeData.find(x => x.id === id); 
        if (p) addToCart({ 
            id: p.id,
            name: p.name, 
            price: p.price, 
            desc: p.notes,
            img: p.img,
            defaultImg: p.img
        }); 
    };

    window.openProductPage = (id) => {
        const p = perfumeData.find(x => x.id === id);
        if (p) {
            document.getElementById('detail-title').innerText = p.name;
            document.getElementById('detail-price').innerText = formatPrice(p.price);
            document.getElementById('detail-desc').innerText = p.desc;
            document.getElementById('detail-top').innerText = p.topNotes.join(', ');
            document.getElementById('detail-heart').innerText = p.middleNotes.join(', ');
            document.getElementById('detail-base').innerText = p.baseNotes.join(', ');
            document.getElementById('detail-img').style.background = `url('${p.img}') center/cover`;
            
            const detailAllergens = document.getElementById('detail-allergens-list');
            if (detailAllergens) detailAllergens.innerText = p.allergens || 'None';

            const addBtn = document.getElementById('detail-add-btn');
            addBtn.onclick = () => quickAdd(p.id);
            
            switchScreen('product-detail');
        }
    };

    window.openProductDetail = (id) => {
        const p = perfumeData.find(x => x.id === id);
        if (p) {
            document.getElementById('modal-title').innerText = p.name;
            document.getElementById('modal-price').innerText = formatPrice(p.price);
            document.getElementById('modal-notes').innerText = p.notes;
            document.getElementById('modal-desc').innerText = p.desc;
            const allergensEl = document.getElementById('allergens-list');
            if (allergensEl) allergensEl.innerText = p.allergens || 'None';
            document.getElementById('modal-img').style.background = `url('${p.img}') center/cover`;
            const addBtn = document.getElementById('modal-add-to-cart');
            addBtn.dataset.activeId = p.id;
            addBtn.onclick = () => { quickAdd(p.id); closeOverlay(productModal); };
            openOverlay(productModal);
        }
    };

    // --- Cart & Checkout Logic ---
    const getCartTotal = () => cart.reduce((s, x) => s + (x.price * x.qty), 0);

    const updateCartUI = () => {
        const cartList = document.getElementById('cart-list');
        const cartDrawerItems = document.getElementById('cart-drawer-items');
        
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        const cartTotalEl = document.getElementById('cart-total');
        const cartDrawerTotalEl = document.getElementById('cart-drawer-total');
        const giftWrapCheckbox = document.getElementById('gift-wrap');

        // Add event listener to gift wrap checkbox if not already added
        if (giftWrapCheckbox && !giftWrapCheckbox.hasAttribute('data-listening')) {
            giftWrapCheckbox.addEventListener('change', updateCartUI);
            giftWrapCheckbox.setAttribute('data-listening', 'true');
        }
        
        const htmlContent = cart.length === 0 
            ? '<p class="empty-msg">Your collection is empty.</p>'
            : cart.map((item, i) => `
                <div class="cart-item glass" style="display: flex; gap: 1.5rem; align-items: center; padding: 1.5rem; margin-bottom: 1.2rem; position: relative; border-left: 4px solid transparent; transition: all 0.3s ease;">
                    <div style="width: 100px; height: 100px; border-radius: 12px; background: url('${item.defaultImg || item.img || 'images/default_bottle.png'}') center/cover; flex-shrink: 0; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></div>
                    <div class="item-info" style="flex: 1;">
                        <h4 style="margin: 0 0 0.4rem 0; font-size: 1.25rem; font-family: var(--font-header);">${item.name}</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${item.desc}</p>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem;">
                            <div class="qty-control" style="display: flex; align-items: center; gap: 0.8rem; background: var(--glass-bg); padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-color);">
                                <button class="qty-btn" style="background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 0 4px; font-size: 1.2rem;" onclick="updateCartQty(${i}, -1)">−</button>
                                <span style="font-weight: 500; min-width: 20px; text-align: center;">${item.qty}</span>
                                <button class="qty-btn" style="background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 0 4px; font-size: 1.2rem;" onclick="updateCartQty(${i}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="item-meta" style="text-align: right; display: flex; flex-direction: column; gap: 0.8rem; justify-content: space-between; height: 100px;">
                        <span style="display: block; font-weight: 600; font-size: 1.2rem; color: var(--text-primary);">${formatPrice(item.price * item.qty)}</span>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <button class="text-btn" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--accent-lavender); background: none; border: none; cursor: pointer; transition: border 0.3s;" onclick="moveToWishlist(${i})">Move to Wishlist</button>
                            <button class="text-btn" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); background: none; border: none; cursor: pointer; transition: border 0.3s;" onclick="removeFromCart(${i})">Remove</button>
                        </div>
                    </div>
                </div>`).join('');
        
        if (cartList) {
            cartList.innerHTML = htmlContent;
            if (cart.length > 0) {
                cartList.innerHTML += `
                    <div style="margin-top: 3rem;">
                        <h3>Frequently Bought Together</h3>
                        <div class="h-scroll" style="margin-top: 1rem;">
                            ${perfumeData.slice(2, 5).map(p => `
                                <div class="mini-card" onclick="openProductPage('${p.id}')">
                                    <img src="${p.img}" alt="${p.name}">
                                    <h4>${p.name}</h4>
                                    <span>${formatPrice(p.price)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        if (cartDrawerItems) cartDrawerItems.innerHTML = htmlContent;
        
        const subtotal = getCartTotal();
        let giftWrapPrice = 0;
        if (giftWrapCheckbox && giftWrapCheckbox.checked && cart.length > 0) {
            giftWrapPrice = currentCurrency === 'INR' ? 499 : 6;
        }
        const total = subtotal > 0 ? subtotal + giftWrapPrice : 0;
        
        if (cartSubtotalEl) cartSubtotalEl.innerText = formatPrice(subtotal);
        if (cartDrawerTotalEl) cartDrawerTotalEl.innerText = formatPrice(subtotal);
        if (cartTotalEl) cartTotalEl.innerText = formatPrice(total);
    };

    window.updateCartQty = (idx, delta) => {
        if (cart[idx].qty + delta > 0) {
            cart[idx].qty += delta;
        } else {
            cart.splice(idx, 1);
        }
        updateCartUI();
    };

    window.addToCart = (item) => { 
        const existing = cart.find(x => x.name === item.name && x.price === item.price);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...item, qty: 1 }); 
        }
        updateCartUI(); 
        showToast(`${item.name} added!`); 
    };
    
    window.removeFromCart = (i) => { cart.splice(i, 1); updateCartUI(); };

    window.processCheckout = () => {
        if(cart.length === 0) {
            showToast('Your cart is empty.');
            return;
        }
        
        const subtotal = getCartTotal();
        const giftWrapCheckbox = document.getElementById('gift-wrap');
        const giftWrapPrice = (giftWrapCheckbox && giftWrapCheckbox.checked) ? (currentCurrency === 'INR' ? 499 : 6) : 0;
        const total = subtotal + giftWrapPrice;

        // Mock Checkout Flow UI Overwrite
        const container = document.getElementById('cart-list') || document.getElementById('cart-drawer-items');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; animation: slideUp 0.5s ease;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" style="width: 60px; height: 60px; margin-bottom: 1.5rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="16 10 12 14 8 10"></polyline>
                    </svg>
                    <h2>Order Confirmed</h2>
                    <p style="color: var(--text-primary); margin: 1rem 0; font-size: 1.1rem;">Your personalized fragrance is being crafted...</p>
                    <p style="color: var(--text-secondary); margin: 0.5rem 0;">Estimated Delivery: 3-5 Business Days</p>
                    <div style="font-size: 1.5rem; margin: 2rem 0; font-weight: bold;">Total Paid: ${formatPrice(total)}</div>
                    <button class="cta-btn" onclick="cart = []; updateCartUI(); switchScreen('home'); closeOverlay(document.getElementById('cart-drawer')); document.querySelector('.cart-summary').style.display = 'block';">Return to Home</button>
                </div>
            `;
            // Hide typical checkout buttons during confirmation
            document.querySelectorAll('.checkout-btn').forEach(b => b.style.display = 'none');
            const summaryBox = document.querySelector('.cart-summary');
            if(summaryBox) summaryBox.style.display = 'none';

            setTimeout(() => {
                document.querySelectorAll('.checkout-btn').forEach(b => b.style.display = 'block');
                if(summaryBox) summaryBox.style.display = 'block';
            }, 8000); // Hacky reset for demo
        }
    };

    const showToast = (msg) => {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerText = msg;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    };

    document.querySelectorAll('.checkout-btn').forEach(btn => btn.onclick = processCheckout);

    // --- Search Logic ---
    const siteSearch = document.getElementById('site-search');
    if (siteSearch) {
        siteSearch.oninput = (e) => {
            const results = document.getElementById('search-results');
            const q = e.target.value.toLowerCase();
            if (q.length < 2) { results.innerHTML = ''; return; }
            const matches = perfumeData.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.notes.toLowerCase().includes(q) || 
                p.family.toLowerCase().includes(q) ||
                (p.allergens && p.allergens.toLowerCase().includes(q))
            );
            results.innerHTML = matches.map(p => `
                <div class="search-match" onclick="openProductDetail('${p.id}')">
                    <div class="match-name">${p.name}</div>
                    <div class="match-info">${p.family} • ${p.notes}</div>
                </div>
            `).join('');
        };
    }

    // --- Advanced Scent Experience Logic ---
    
    // 1. Your Scent DNA Profile
    let dnaStep = 0;
    let dnaAnswers = {};
    const dnaQuestions = [
        { q: "Which morning atmosphere resonates with you?", options: ["Dewy Garden", "Brisk Mountain Air", "Sun-drenched Citrus Grove", "Coastal Mist"] },
        { q: "Select your preferred texture of elegance.", options: ["Sheer Silk", "Deep Velvet", "Crinkled Linen", "Polished Stone"] },
        { q: "Choose your favorite twilight ritual.", options: ["Stargazing in silence", "Evening gala with friends", "Cozying up by a fire", "Walking in a night garden"] },
        { q: "What level of sensory presence do you desire?", options: ["A subtle whisper", "A steady signature", "A bold declaration"] }
    ];

    window.openScentDNA = () => {
        dnaStep = 0;
        dnaAnswers = {};
        openOverlay(document.getElementById('dna-profile-overlay'));
        renderDNAModal();
    };

    const renderDNAModal = () => {
        const container = document.getElementById('dna-quiz-container');
        if (dnaStep < dnaQuestions.length) {
            const current = dnaQuestions[dnaStep];
            const sel = dnaAnswers[dnaStep] !== undefined ? dnaAnswers[dnaStep] : null;
            container.innerHTML = `
                <span class="tag">DNA Builder: Step ${dnaStep + 1}/${dnaQuestions.length}</span>
                <h2 style="margin: 1.5rem 0;">${current.q}</h2>
                <div class="mood-grid" style="margin-top: 2rem;">
                    ${current.options.map((opt, i) => `
                        <button class="mood-card" style="${sel === i ? 'border: 2px solid var(--text-primary); transform: scale(1.02);' : ''}" onclick="selectDNAOption(${i})"><span class="mood-text">${opt}</span></button>
                    `).join('')}
                </div>
                <div style="margin-top: 2rem; display: flex; justify-content: space-between;">
                    ${dnaStep > 0 ? `<button class="secondary-btn" onclick="dnaStep--; renderDNAModal()">Back</button>` : `<button class="secondary-btn" onclick="closeOverlay(document.getElementById('dna-profile-overlay'))">Cancel</button>`}
                    <button class="cta-btn" ${sel === null ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="nextDNA()">Next</button>
                </div>
            `;
        } else {
            generateDNAProfile();
        }
    };

    window.selectDNAOption = (idx) => {
        dnaAnswers[dnaStep] = idx;
        renderDNAModal();
    };

    window.nextDNA = () => {
        if (dnaAnswers[dnaStep] !== undefined) {
            dnaStep++;
            renderDNAModal();
        }
    };

    const generateDNAProfile = () => {
        const container = document.getElementById('dna-quiz-container');
        // Simple logic to determine profile
        let profileName = "Versatile Essence Explorer";
        let preferred = ["Bergamot", "White Musk"];
        let avoided = ["Heavy Oud"];
        let intensity = "Medium";

        if (dnaAnswers[1] === 1) { // Velvet
            profileName = "Bold Woody Signature";
            preferred = ["Oud", "Sandalwood", "Amber"];
            intensity = "Strong";
        } else if (dnaAnswers[0] === 2) { // Citrus
            profileName = "Warm Floral Lover";
            preferred = ["Orange Blossom", "Jasmine", "Vanilla"];
            intensity = "Medium";
        } else if (dnaAnswers[0] === 1 || dnaAnswers[3] === 0) { // Fresh
            profileName = "Ethereal Fresh minimalist";
            preferred = ["Sea Salt", "Tea", "Mint"];
            intensity = "Mild";
        }

        const recommendations = perfumeData.filter(p => preferred.some(n => p.notes.includes(n))).slice(0, 2);

        container.innerHTML = `
            <div class="dna-profile-result">
                <span class="tag">Your DNA Signature</span>
                <div class="dna-badge">${profileName}</div>
                <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; text-align: left;">
                    <div class="glass" style="padding: 1.5rem; border-radius: 12px;">
                        <h4 style="color: var(--accent-lavender); font-size: 0.9rem;">RESONATING NOTES</h4>
                        <p style="margin-top: 0.5rem;">${preferred.join(', ')}</p>
                    </div>
                    <div class="glass" style="padding: 1.5rem; border-radius: 12px;">
                        <h4 style="color: var(--text-secondary); font-size: 0.9rem;">NOTES TO AVOID</h4>
                        <p style="margin-top: 0.5rem;">${avoided.join(', ')}</p>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; text-align: left;">
                    <h4 style="font-size: 0.9rem; color: var(--text-secondary);">INTENSITY PREFERENCE: <span style="color: var(--text-primary);">${intensity}</span></h4>
                </div>
                <div style="margin-top: 2rem; text-align: left;">
                    <h4 style="margin-bottom: 1rem;">Recommended for Your DNA:</h4>
                    <div style="display: flex; gap: 1rem;">
                        ${recommendations.map(p => `
                            <div class="mini-card" onclick="openProductDetail('${p.id}')" style="flex: 1; min-width: 0; padding: 1rem;">
                                <img src="${p.img}" style="height: 80px; margin-bottom: 0.5rem;">
                                <h5 style="font-size: 0.8rem;">${p.name}</h5>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="cta-btn" style="width: 100%; margin-top: 2rem;" onclick="showToast('Profile saved to your essence vault!'); closeOverlay(document.getElementById('dna-profile-overlay'))">Save to Profile</button>
            </div>
        `;
    };

    // 2. Compare Fragrances
    let comparisonSelection = [];
    window.openCompareScents = () => {
        comparisonSelection = [];
        const selector = document.getElementById('comparison-selector');
        const perfumesToPick = perfumeData; // Show all
        selector.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; max-height: 400px; overflow-y: auto; padding-right: 1rem;">
                ${perfumesToPick.map(p => `
                    <div class="comparison-pick ${comparisonSelection.includes(p.id) ? 'active' : ''}" onclick="toggleComparisonPick('${p.id}', this)" style="cursor: pointer; position: relative;">
                        <img src="${p.img}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px;">
                        <p style="font-size: 0.7rem; margin-top: 5px; text-align: center;">${p.name}</p>
                    </div>
                `).join('')}
            </div>
            <button class="cta-btn" style="width: 100%; margin-top: 2rem;" onclick="generateComparison()">Compare Selected</button>
        `;
        document.getElementById('comparison-table-container').innerHTML = '';
        openOverlay(document.getElementById('comparison-overlay'));
    };

    window.toggleComparisonPick = (id, el) => {
        if (comparisonSelection.includes(id)) {
            comparisonSelection = comparisonSelection.filter(x => x !== id);
            el.style.opacity = '1';
            el.style.border = 'none';
        } else {
            if (comparisonSelection.length >= 3) {
                showToast("Limit: 3 perfumes for comparison.");
                return;
            }
            comparisonSelection.push(id);
            el.style.opacity = '0.5';
            el.style.border = '2px solid var(--accent-lavender)';
        }
    };

    window.generateComparison = () => {
        if (comparisonSelection.length < 2) {
            showToast("Please select at least 2 perfumes.");
            return;
        }
        const selected = comparisonSelection.map(id => perfumeData.find(p => p.id === id));
        const table = document.getElementById('comparison-table-container');
        table.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        ${selected.map(p => `<th>${p.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Family</td>${selected.map(p => `<td>${p.family}</td>`).join('')}</tr>
                    <tr><td>Top Notes</td>${selected.map(p => `<td>${p.topNotes.join(', ')}</td>`).join('')}</tr>
                    <tr><td>Heart Notes</td>${selected.map(p => `<td>${p.middleNotes.join(', ')}</td>`).join('')}</tr>
                    <tr><td>Base Notes</td>${selected.map(p => `<td>${p.baseNotes.join(', ')}</td>`).join('')}</tr>
                    <tr><td>Allergens</td>${selected.map(p => `<td>${p.allergens || 'None'}</td>`).join('')}</tr>
                    <tr><td>Longevity</td>${selected.map(p => `<td>${p.intensity === 'Strong' ? '12+ Hours' : '6-8 Hours'}</td>`).join('')}</tr>
                    <tr><td>Intensity</td>${selected.map(p => `<td>${p.intensity}</td>`).join('')}</tr>
                    <tr><td>Best For</td>${selected.map(p => `<td>${p.family === 'Fresh' ? 'Daytime' : 'Evening'}</td>`).join('')}</tr>
                    <tr><td>Price</td>${selected.map(p => `<td>${formatPrice(p.price)}</td>`).join('')}</tr>
                </tbody>
            </table>
        `;
    };

    // 3. Your Scent Story
    window.openScentStory = () => {
        const select = document.getElementById('story-scent-select');
        select.innerHTML = perfumeData.slice(0, 10).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        document.getElementById('story-display').innerHTML = '<p class="empty-msg">Select a fragrance to unveil its atmospheric soul.</p>';
        document.getElementById('story-actions').style.display = 'none';
        openOverlay(document.getElementById('scent-story-overlay'));
    };

    window.generateScentStory = () => {
        const id = document.getElementById('story-scent-select').value;
        const p = perfumeData.find(x => x.id === id);
        const display = document.getElementById('story-display');
        
        display.style.opacity = '0';
        setTimeout(() => {
            let story = "";
            let tagline = "Echoes of Velvet Night";
            
            if (p.family === 'Floral') {
                story = `Like a sun-drenched walk through an imperial garden at dawn, the notes of ${p.topNotes[0]} bloom delicately against the pulse. It is a narrative of elegance and fleeting whispers.`;
                tagline = "A Bloom in the Moonlight";
            } else if (p.family === 'Woody') {
                story = `Ancient roots and sacred resins converge in ${p.name}. The grounding presence of ${p.baseNotes[0]} invokes a memory of monolithic strength and silent, timeless forests.`;
                tagline = "Ancient Silence, Bottled";
            } else if (p.family === 'Fresh') {
                story = `Crisp and ethereal, this essence captures the sharp clarity of ${p.topNotes[0]} surrendering to the vast oceanic depth of ${p.middleNotes[0]}. It is the scent of sudden lucidity.`;
                tagline = "The Infinite Awakening";
            } else {
                story = `A mysterious encounter between ${p.topNotes[0]} and the depth of ${p.baseNotes[0]}. It defies definition, lingering like a secret told in a lost language.`;
                tagline = `The Enigma of ${p.name}`;
            }

            display.innerHTML = `<p class="story-display">${story}</p><span class="story-tagline">“${tagline}”</span>`;
            display.style.opacity = '1';
            document.getElementById('story-actions').style.display = 'flex';
            
            document.getElementById('copy-story-btn').onclick = () => {
                navigator.clipboard.writeText(`${story}\n"${tagline}"`);
                showToast('Story inscribed to clipboard.');
            };
            document.getElementById('save-story-btn').onclick = () => showToast('Narrative saved to your profile.');
        }, 500);
    };

    // 4. Trending Scent Insights
    const renderTrendingInsights = () => {
        const container = document.getElementById('trending-insights-content');
        if (!container) return;
        
        const insights = [
            { label: "Most Loved Note", val: "Mysore Sandalwood", icon: "🪵" },
            { label: "Trending Family", val: "Spicy Oriental", icon: "✨" },
            { label: "Perfect Duo", val: "Rose + Oud", icon: "🌹" },
            { label: "Monthly Growth", val: "+24% Jasmine", icon: "📈" }
        ];

        container.innerHTML = insights.map(i => `
            <div class="insight-item glass" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${i.icon}</div>
                <span class="insight-val" style="font-size: 1.5rem;">${i.val}</span>
                <p style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">${i.label}</p>
            </div>
        `).join('');
    };

    // --- Lazy Loading & Wishlist ---
    const observeLazyImages = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.lazy-img').forEach(img => observer.observe(img));
    };

    const observeLazyBackgrounds = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.style.background = `url('${el.dataset.bg}') center/cover`;
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('[data-bg]').forEach(el => observer.observe(el));
    };

    window.toggleWishlist = (id) => {
        const index = wishlist.indexOf(id);
        if (index > -1) {
            wishlist.splice(index, 1);
            showToast("Removed from your wishlist vault.");
        } else {
            wishlist.push(id);
            showToast("Added to your wishlist vault.");
        }
        const tab = document.querySelector('.profile-tabs .nav-item[data-tab="wishlist"]');
        if (tab && tab.classList.contains('active')) switchProfileTab('wishlist');
    };

    // --- Initial State ---
    // --- Feature logic for Wishlist, Promo, Profile ---
    window.moveToWishlist = (idx) => {
        const item = cart[idx];
        if (!wishlist.includes(item.id)) {
            wishlist.push(item.id);
        }
        showToast(`${item.name} moved to wishlist vault.`);
        cart.splice(idx, 1);
        updateCartUI();
    };

    // --- Profile Avatar Upload ---
    const avatarUpload = document.getElementById('avatar-upload');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    const userAvatar = document.getElementById('user-avatar');

    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.onclick = () => avatarUpload.click();
        avatarUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    userAvatar.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                    if (removeAvatarBtn) removeAvatarBtn.style.display = 'flex';
                    showToast('Identity visual updated.');
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.onclick = () => {
            userAvatar.innerHTML = 'G';
            removeAvatarBtn.style.display = 'none';
            if (avatarUpload) avatarUpload.value = '';
            showToast('Identity visual removed.');
        };
    }

    // --- Settings Persistence & Sync ---
    const settingsToggles = ['2fa-toggle', 'ai-toggle', 'push-toggle', '2fa-toggle-drawer', 'ai-toggle-drawer', 'push-toggle-drawer'];
    settingsToggles.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const baseKey = id.replace('-drawer', '');
            const saved = localStorage.getItem(baseKey);
            if (saved !== null) el.checked = saved === 'true';
            el.onchange = () => {
                localStorage.setItem(baseKey, el.checked);
                
                // Sync duplicate toggle in drawer or main section
                const otherId = id.includes('-drawer') ? baseKey : `${id}-drawer`;
                const otherEl = document.getElementById(otherId);
                if (otherEl) otherEl.checked = el.checked;

                const labelSpan = el.closest('.setting-item')?.querySelector('.setting-label span');
                if (labelSpan) showToast(`${labelSpan.innerText} updated.`);
            };
        }
    });

    // --- Initial State ---
    switchScreen('home');
    renderHomeCollections();
    renderTrendingInsights();
    console.log('Inai Mobile Initialized');
});

