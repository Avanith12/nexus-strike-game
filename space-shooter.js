// 🚀 Advanced 3D Space Shooter Game with Enhanced Features

// Game variables
let scene, camera, renderer, controls;
let player, enemies = [], bullets = [], enemyBullets = [], powerUps = [], particles = [], shieldEffect = null;
let keys = {};
let minimapCanvas, minimapCtx;
let audioContext, sounds = {}, backgroundMusic = null, musicGainNode = null;
let cameraMode = 'follow'; // 'follow' or 'free'
let cameraOffset = new THREE.Vector3(0, 8, 15);
let cameraTarget = new THREE.Vector3();

// Memory management variables
let animationId = null;
let gameTimers = [];
let eventListeners = [];
let currentMusicLevel = 1, musicEnabled = true;
let musicOscillators = []; // Track active music oscillators
let gameState = {
    score: 0,
    health: 100,
    maxHealth: 100,
    level: 1,
    weaponType: 'basic',
    weaponLevel: 1,
    ammo: Infinity,
    maxAmmo: Infinity,
    lastEnemySpawn: 0,
    lastEnemyShot: 0,
    lastPowerUpSpawn: 0,
    gameOver: false,
    boostActive: false,
    boostTime: 0,
    invulnerable: false,
    invulnerableTime: 0,
    paused: false,
    scatterMode: false, // Whether scatter shot mode is active
    shotsFired: 0,
    shotsHit: 0,
    enemiesDestroyed: 0,
    powerUpsActive: [],
    bossActive: false,
    bossHealth: 0,
    bossMaxHealth: 0,
    comboMultiplier: 1,
    lastHitTime: 0,
    comboTime: 3000
};

// Enhanced game settings
const gameSettings = {
    enemySpawnRate: 1500,
    powerUpSpawnRate: 2000,
    boostDuration: 3000,
    invulnerableDuration: 2000,
    maxEnemies: 20,
    maxPowerUps: 5,
    bossSpawnLevel: 5,
    comboWindow: 3000,
    soundEnabled: true,
    musicVolume: 0.3,
    sfxVolume: 0.5
};

// Initialize the game
function init() {
    try {
        // Initialize audio context
        initAudio();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 50, 200);
    
    // Add enhanced starfield
    createEnhancedStarField();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 15);
        
        // Create renderer with advanced settings
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
    
    // Add renderer to container
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            throw new Error('Game container not found');
        }
        gameContainer.appendChild(renderer.domElement);
        
        // Add orbit controls for free camera mode
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
        controls.minDistance = 3;
        controls.maxDistance = 50;
        controls.enablePan = true; // Allow panning
        controls.enableZoom = true; // Allow zooming
    
    // Add enhanced lighting
    setupEnhancedLighting();
    
    // Create enhanced player ship
        createModernPlayer();
        
        // Initialize minimap
        initMinimap();
    
    // Setup event listeners
    setupEventListeners();
        
        // Add some initial power-ups for immediate visibility
        const initialPowerUpTimer = setTimeout(() => {
            createPowerUp('health');
            createPowerUp('weapon');
            createPowerUp('boost');
            createPowerUp('shield');
        }, 1000);
        gameTimers.push(initialPowerUpTimer);
    
    // Start game loop
    gameLoop();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showNotification('Game initialization failed. Please refresh the page.', 5000);
    }
}

// Initialize audio system
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain node for background music
        musicGainNode = audioContext.createGain();
        musicGainNode.connect(audioContext.destination);
        musicGainNode.gain.value = 0.2; // Background music volume
        
        // Create sound effects using Web Audio API
        sounds.shoot = createTone(800, 0.1, 'sine');
        sounds.explosion = createTone(200, 0.3, 'sawtooth');
        sounds.powerUp = createTone(1000, 0.2, 'square');
        sounds.hit = createTone(400, 0.15, 'triangle');
        sounds.levelUp = createTone(600, 0.5, 'sine');
        
        // Start background music
        startBackgroundMusic();
        
    } catch (e) {
        gameSettings.soundEnabled = false;
    }
}

// Create simple tone generator
function createTone(frequency, duration, type = 'sine') {
    return function() {
        if (!gameSettings.soundEnabled || !audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(gameSettings.sfxVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
}

// Create procedural background music
function startBackgroundMusic() {
    if (!audioContext || !musicEnabled) return;
    
    const playNote = (frequency, duration, startTime) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(musicGainNode);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sawtooth';
        
        // Create envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        // Track oscillator for cleanup
        musicOscillators.push(oscillator);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        // Clean up after note ends
        setTimeout(() => {
            const index = musicOscillators.indexOf(oscillator);
            if (index > -1) {
                musicOscillators.splice(index, 1);
            }
        }, duration * 1000 + 100);
    };
    
    const playChord = (frequencies, duration, startTime) => {
        frequencies.forEach(freq => playNote(freq, duration, startTime));
    };
    
    // Musical scales for different intensity levels
    const scales = {
        1: [220, 246.94, 277.18, 329.63, 369.99, 415.30, 466.16], // A minor - calm
        2: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C major - building
        3: [311.13, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33], // E♭ major - intense
        4: [329.63, 369.99, 415.30, 466.16, 523.25, 587.33, 659.25], // E minor - epic
        5: [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99], // G major - heroic
        6: [466.16, 523.25, 587.33, 659.25, 739.99, 830.61, 932.33]  // B♭ major - ultimate
    };
    
    const playMusicLoop = () => {
        if (!musicEnabled) return;
        
        const currentTime = audioContext.currentTime;
        const level = Math.min(gameState.level, 6);
        const scale = scales[level] || scales[6];
        
        // Tempo increases with level (BPM: 120 + level * 20)
        const tempo = 120 + (level - 1) * 20;
        const beatDuration = 60 / tempo;
        
        // Create a musical phrase
        const phraseLength = 8 * beatDuration;
        
        // Bass line (lower octave)
        for (let i = 0; i < 8; i++) {
            const noteTime = currentTime + i * beatDuration;
            const noteIndex = i % 4; // Simple pattern
            playNote(scale[noteIndex] * 0.5, beatDuration * 0.8, noteTime);
        }
        
        // Melody (higher octave)
        for (let i = 0; i < 8; i++) {
            const noteTime = currentTime + i * beatDuration + beatDuration * 0.5;
            const noteIndex = (i * 2) % scale.length;
            playNote(scale[noteIndex] * 2, beatDuration * 0.6, noteTime);
        }
        
        // Harmony chords
        for (let i = 0; i < 4; i++) {
            const noteTime = currentTime + i * beatDuration * 2;
            const chordNotes = [
                scale[i % scale.length],
                scale[(i + 2) % scale.length],
                scale[(i + 4) % scale.length]
            ];
            playChord(chordNotes, beatDuration * 1.5, noteTime);
        }
        
        // Schedule next loop
        setTimeout(playMusicLoop, phraseLength * 1000);
    };
    
    // Start the music loop
    playMusicLoop();
}

// Initialize minimap
function initMinimap() {
    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
}

// Update minimap
function updateMinimap() {
    if (!minimapCtx) return;
    
    minimapCtx.clearRect(0, 0, 200, 200);
    
    // Draw background
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    minimapCtx.fillRect(0, 0, 200, 200);
    
    // Draw player
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.fillRect(95, 95, 10, 10);
    
    // Draw enemies
    minimapCtx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        const x = (enemy.position.x / 40) * 100 + 100;
        const z = (enemy.position.z / 40) * 100 + 100;
        if (x >= 0 && x <= 200 && z >= 0 && z <= 200) {
            minimapCtx.fillRect(x - 2, z - 2, 4, 4);
        }
    });
    
    // Draw power-ups
    minimapCtx.fillStyle = '#ffff00';
    powerUps.forEach(powerUp => {
        const x = (powerUp.position.x / 40) * 100 + 100;
        const z = (powerUp.position.z / 40) * 100 + 100;
        if (x >= 0 && x <= 200 && z >= 0 && z <= 200) {
            minimapCtx.fillRect(x - 1, z - 1, 2, 2);
        }
    });
}

// Show notification
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

function createEnhancedStarField() {
    // Create multiple layers of stars with nebula effects
    for (let layer = 0; layer < 5; layer++) {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = layer === 0 ? 5000 : 2000; // More stars in background
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 600;
            positions[i + 1] = (Math.random() - 0.5) * 600;
            positions[i + 2] = (Math.random() - 0.5) * 600;
            
            const color = new THREE.Color();
            if (layer === 0) {
                // Background stars - blue/white
                color.setHSL(Math.random() * 0.1 + 0.5, 0.3, Math.random() * 0.3 + 0.7);
            } else {
                // Foreground stars - colorful
                color.setHSL(Math.random() * 0.2 + 0.4, 0.8, Math.random() * 0.5 + 0.5);
            }
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
            
            sizes[i / 3] = Math.random() * 3 + 1;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 3 - layer * 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9 - layer * 0.15,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        stars.userData = { layer: layer, rotationSpeed: 0.0001 * (layer + 1) };
        scene.add(stars);
    }
    
    // Add nebula clouds
    createNebulaClouds();
}

// Create nebula clouds for atmosphere
function createNebulaClouds() {
    for (let i = 0; i < 3; i++) {
        const cloudGeometry = new THREE.SphereGeometry(50, 32, 32);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6 + i * 0.1, 0.8, 0.3),
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 200
        );
        cloud.userData = { rotationSpeed: 0.0005 };
        scene.add(cloud);
    }
}

function setupEnhancedLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    
    // Secondary directional light for fill
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
    
    // Colored point lights for atmosphere
    const blueLight = new THREE.PointLight(0x0088ff, 0.8, 150);
    blueLight.position.set(-30, 15, -30);
    blueLight.castShadow = true;
    blueLight.shadow.mapSize.width = 1024;
    blueLight.shadow.mapSize.height = 1024;
    scene.add(blueLight);
    
    const redLight = new THREE.PointLight(0xff0088, 0.6, 120);
    redLight.position.set(30, 10, 30);
    redLight.castShadow = true;
    redLight.shadow.mapSize.width = 1024;
    redLight.shadow.mapSize.height = 1024;
    scene.add(redLight);
    
    const greenLight = new THREE.PointLight(0x00ff88, 0.5, 100);
    greenLight.position.set(0, 20, 0);
    scene.add(greenLight);
    
    // Add spotlights for dramatic effect
    const spotLight1 = new THREE.SpotLight(0xffffff, 0.8, 200, Math.PI / 6, 0.3);
    spotLight1.position.set(0, 50, 0);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.castShadow = true;
    scene.add(spotLight1);
    scene.add(spotLight1.target);
    
    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    rimLight.position.set(0, 0, -20);
    scene.add(rimLight);
}

function createModernPlayer() {
    const playerGroup = new THREE.Group();
    
    // Main ship body - sleek fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.6, 2.5, 8);
    const fuselageMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00aaff, 
        emissive: 0x002244,
        emissiveIntensity: 0.4,
        shininess: 100
    });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    playerGroup.add(fuselage);
    
    // Cockpit - glass dome
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.7,
        emissive: 0x001122,
        emissiveIntensity: 0.2
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, 0);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    playerGroup.add(cockpit);
    
    // Wings - swept back design
    const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0066cc, 
        emissive: 0x001133,
        emissiveIntensity: 0.3
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.8, 0, -0.3);
    leftWing.rotation.z = -0.2;
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;
    playerGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.8, 0, -0.3);
    rightWing.rotation.z = 0.2;
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;
    playerGroup.add(rightWing);
    
    // Missile launchers - visible tubes
    const launcherGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const launcherMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333, 
        emissive: 0x111111,
        emissiveIntensity: 0.2
    });
    
    const leftLauncher = new THREE.Mesh(launcherGeometry, launcherMaterial);
    leftLauncher.position.set(-0.4, 0, 1.2);
    leftLauncher.rotation.z = Math.PI / 2;
    leftLauncher.castShadow = true;
    leftLauncher.receiveShadow = true;
    playerGroup.add(leftLauncher);
    
    const rightLauncher = new THREE.Mesh(launcherGeometry, launcherMaterial);
    rightLauncher.position.set(0.4, 0, 1.2);
    rightLauncher.rotation.z = Math.PI / 2;
    rightLauncher.castShadow = true;
    rightLauncher.receiveShadow = true;
    playerGroup.add(rightLauncher);
    
    // Engine exhaust ports
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444, 
        emissive: 0x222222,
        emissiveIntensity: 0.3
    });
    
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-0.3, 0, -1.3);
    leftEngine.castShadow = true;
    leftEngine.receiveShadow = true;
    playerGroup.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(0.3, 0, -1.3);
    rightEngine.castShadow = true;
    rightEngine.receiveShadow = true;
    playerGroup.add(rightEngine);
    
    // Navigation lights
    const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const redLightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000, 
        emissive: 0xff0000,
        emissiveIntensity: 0.8
    });
    const greenLightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8
    });
    
    const leftLight = new THREE.Mesh(lightGeometry, redLightMaterial);
    leftLight.position.set(-0.6, 0.2, 0.5);
    playerGroup.add(leftLight);
    
    const rightLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
    rightLight.position.set(0.6, 0.2, 0.5);
    playerGroup.add(rightLight);
    
    player = playerGroup;
    player.position.set(0, 0, 0);
    scene.add(player);
}

function createEnhancedPlayer() {
    // Create main ship body with professional materials
    const bodyGeometry = new THREE.ConeGeometry(0.8, 2.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2a5a2a,
        shininess: 100,
        specular: 0x444444,
        emissive: 0x001100
    });
    player = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    player.position.set(0, 0, 0);
    player.castShadow = true;
    player.receiveShadow = true;
    
    // Add detailed wings with better geometry
    const wingGeometry = new THREE.BoxGeometry(0.4, 0.15, 1.8);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a4a1a,
        shininess: 80,
        specular: 0x333333
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.7, 0, 0);
    leftWing.castShadow = true;
    player.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.7, 0, 0);
    rightWing.castShadow = true;
    player.add(rightWing);
    
    // Add wing tips
    const wingTipGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
    const wingTipMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x004400,
        shininess: 200
    });
    
    const leftWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    leftWingTip.position.set(-0.7, 0, -0.9);
    leftWingTip.rotation.x = Math.PI;
    player.add(leftWingTip);
    
    const rightWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    rightWingTip.position.set(0.7, 0, -0.9);
    rightWingTip.rotation.x = Math.PI;
    player.add(rightWingTip);
    
    // Add engine glow with particle effect
    const engineGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.9,
        emissive: 0xff3300
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(0, -1.3, 0);
    player.add(engine);
    
    // Add engine exhaust particles
    createEngineExhaust(player);
    
    // Add cockpit with glass effect
    const cockpitGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
        shininess: 300,
        specular: 0x666666
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.6, 0);
    player.add(cockpit);
    
    // Add navigation lights
    const navLightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const redLightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000
    });
    const greenLightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x00ff00
    });
    
    const leftNavLight = new THREE.Mesh(navLightGeometry, redLightMaterial);
    leftNavLight.position.set(-0.5, 0.2, 0.5);
    player.add(leftNavLight);
    
    const rightNavLight = new THREE.Mesh(navLightGeometry, greenLightMaterial);
    rightNavLight.position.set(0.5, 0.2, 0.5);
    player.add(rightNavLight);
    
    // Add weapon mounts
    const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const weaponMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        shininess: 150
    });
    
    const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    leftWeapon.position.set(-0.3, 0.1, 1.2);
    player.add(leftWeapon);
    
    const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    rightWeapon.position.set(0.3, 0.1, 1.2);
    player.add(rightWeapon);
    
    scene.add(player);
}

// Create engine exhaust particles
function createEngineExhaust(ship) {
    const exhaustGeometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 0.2;
        positions[i3 + 1] = -1.5 + Math.random() * 0.5;
        positions[i3 + 2] = (Math.random() - 0.5) * 0.2;
        
        // Orange to red gradient
        const color = new THREE.Color();
        color.setHSL(0.1 + Math.random() * 0.1, 1, 0.5);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    exhaustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    exhaustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    exhaustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const exhaustMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const exhaust = new THREE.Points(exhaustGeometry, exhaustMaterial);
    exhaust.userData = { 
        originalPositions: positions.slice(),
        velocities: new Float32Array(particleCount * 3),
        life: 1.0
    };
    
    // Initialize velocities
    for (let i = 0; i < particleCount * 3; i += 3) {
        exhaust.userData.velocities[i] = (Math.random() - 0.5) * 0.02;
        exhaust.userData.velocities[i + 1] = -0.05 - Math.random() * 0.02;
        exhaust.userData.velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    ship.add(exhaust);
    ship.userData.exhaust = exhaust;
}

// ===========================================
// ENEMY CREATION - Creates different types of enemy ships
// ===========================================
function createEnemy(type = 'basic') {
    // Define different enemy types with their properties
    const enemyTypes = {
        basic: { 
            color: 0x8b0000, // Dark red color
            emissive: 0x440000, // Red glow
            size: 0.8, // Ship size multiplier
            health: 1, // Hit points
            speed: 0.02, // Movement speed
            shape: 'fighter' // Ship design type
        },
        fast: { 
            color: 0xff4500, // Orange color
            emissive: 0x662200, // Orange glow
            size: 0.6, // Smaller but faster
            health: 1, // Same health as basic
            speed: 0.04, // Twice as fast
            shape: 'interceptor' // Sleek design
        },
        heavy: { 
            color: 0x4b0082, // Purple color
            emissive: 0x220044, // Purple glow
            size: 1.2, // Larger ship
            health: 3, // Three times the health
            speed: 0.015, // Slower movement
            shape: 'bomber' // Heavy design
        },
        boss: { 
            color: 0x8b008b, // Magenta color
            emissive: 0x440044, // Magenta glow
            size: 2.0, // Very large ship
            health: 10, // Ten times the health
            speed: 0.01, // Very slow
            shape: 'destroyer' // Massive design
        }
    };
    
    // Get the configuration for this enemy type (default to basic if type not found)
    const config = enemyTypes[type] || enemyTypes.basic;
    
    // Create the 3D model for this enemy ship
    const enemy = createModernEnemyShip(config.shape, config);
    
    // Position the enemy randomly in 3D space
    enemy.position.set(
        (Math.random() - 0.5) * 50, // X: -25 to 25
        Math.random() * 20 + 5, // Y: 5 to 25 (above ground)
        (Math.random() - 0.5) * 50  // Z: -25 to 25
    );
    
    // Enable shadows for realistic lighting
    enemy.castShadow = true;
    enemy.receiveShadow = true;
    
    // Add special details for boss enemies
    if (type === 'boss') {
        // Add large wings for boss ships
        const bossWingGeometry = new THREE.BoxGeometry(0.3, 0.1, 1.5);
        const bossWingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x660066, // Dark purple
            emissive: 0x220022 // Subtle purple glow
        });
        
        // Left wing
        const leftWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
        leftWing.position.set(-1.2, 0, 0);
        enemy.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
        rightWing.position.set(1.2, 0, 0);
        enemy.add(rightWing);
        
        // Add glowing engine effect for boss
        const bossEngineGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const bossEngineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0088, // Bright magenta
            emissive: 0xff0088, // Bright glow
            transparent: true,
            opacity: 0.8
        });
        const bossEngine = new THREE.Mesh(bossEngineGeometry, bossEngineMaterial);
        bossEngine.position.set(0, -1, 0);
        enemy.add(bossEngine);
    }
    
    // Add red navigation lights to all enemies (like aircraft lights)
    const navLightGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const enemyLightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000, // Red color
        emissive: 0xff0000 // Red glow
    });
    
    // Left navigation light
    const leftLight = new THREE.Mesh(navLightGeometry, enemyLightMaterial);
    leftLight.position.set(-config.size * 0.5, 0, config.size * 0.5);
    enemy.add(leftLight);
    
    // Right navigation light
    const rightLight = new THREE.Mesh(navLightGeometry, enemyLightMaterial);
    rightLight.position.set(config.size * 0.5, 0, config.size * 0.5);
    enemy.add(rightLight);
    
    // Store enemy data for game logic
    enemy.userData = {
        type: type, // Enemy type (basic, fast, heavy, boss)
        speed: config.speed, // Movement speed
        health: config.health, // Current health
        maxHealth: config.health, // Maximum health
        lastShot: 0, // Timestamp of last shot fired
        shootRate: type === 'boss' ? 500 : 1500, // How often enemy shoots (ms)
        rotationSpeed: 0.01 + Math.random() * 0.02 // Random rotation speed
    };
    
    // Add enemy to the scene and enemy array
    scene.add(enemy);
    enemies.push(enemy);
}

function createModernEnemyShip(shipType, config) {
    const enemyGroup = new THREE.Group();
    
    switch(shipType) {
        case 'fighter':
            return createEnemyFighter(enemyGroup, config);
        case 'interceptor':
            return createEnemyInterceptor(enemyGroup, config);
        case 'bomber':
            return createEnemyBomber(enemyGroup, config);
        case 'destroyer':
            return createEnemyDestroyer(enemyGroup, config);
        default:
            return createEnemyFighter(enemyGroup, config);
    }
}

function createEnemyFighter(group, config) {
    // Main body - aggressive angular design
    const bodyGeometry = new THREE.ConeGeometry(config.size * 0.4, config.size * 1.5, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color, 
        emissive: config.emissive,
        emissiveIntensity: 0.4,
        shininess: 80
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Wings - sharp and angular
    const wingGeometry = new THREE.BoxGeometry(config.size * 0.8, 0.05, config.size * 0.4);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color * 0.8, 
        emissive: config.emissive * 0.8,
        emissiveIntensity: 0.3
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-config.size * 0.3, 0, 0);
    leftWing.castShadow = true;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(config.size * 0.3, 0, 0);
    rightWing.castShadow = true;
    group.add(rightWing);
    
    // Weapon pods
    const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, config.size * 0.3, 6);
    const weaponMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x666666, 
        emissive: 0x333333,
        emissiveIntensity: 0.2
    });
    
    const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    leftWeapon.position.set(-config.size * 0.2, 0, config.size * 0.6);
    leftWeapon.rotation.z = Math.PI / 2;
    group.add(leftWeapon);
    
    const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    rightWeapon.position.set(config.size * 0.2, 0, config.size * 0.6);
    rightWeapon.rotation.z = Math.PI / 2;
    group.add(rightWeapon);
    
    // Engine glow
    const engineGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6600, 
        emissive: 0xff3300,
        emissiveIntensity: 0.8
    });
    
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-config.size * 0.2, 0, -config.size * 0.7);
    group.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(config.size * 0.2, 0, -config.size * 0.7);
    group.add(rightEngine);
    
    return group;
}

function createEnemyInterceptor(group, config) {
    // Sleek, fast design
    const bodyGeometry = new THREE.CylinderGeometry(config.size * 0.2, config.size * 0.3, config.size * 1.2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color, 
        emissive: config.emissive,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Swept wings
    const wingGeometry = new THREE.BoxGeometry(config.size * 0.6, 0.03, config.size * 0.2);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color * 0.9, 
        emissive: config.emissive * 0.9,
        emissiveIntensity: 0.4
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-config.size * 0.25, 0, -config.size * 0.2);
    leftWing.rotation.z = -0.3;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(config.size * 0.25, 0, -config.size * 0.2);
    rightWing.rotation.z = 0.3;
    group.add(rightWing);
    
    // Twin engines
    const engineGeometry = new THREE.CylinderGeometry(0.08, 0.12, config.size * 0.4, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff8800, 
        emissive: 0xff4400,
        emissiveIntensity: 0.9
    });
    
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-config.size * 0.15, 0, -config.size * 0.8);
    group.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(config.size * 0.15, 0, -config.size * 0.8);
    group.add(rightEngine);
    
    return group;
}

function createEnemyBomber(group, config) {
    // Heavy, intimidating design
    const bodyGeometry = new THREE.BoxGeometry(config.size * 0.6, config.size * 0.4, config.size * 1.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color, 
        emissive: config.emissive,
        emissiveIntensity: 0.3,
        shininess: 60
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Large wings
    const wingGeometry = new THREE.BoxGeometry(config.size * 1.2, 0.08, config.size * 0.6);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color * 0.7, 
        emissive: config.emissive * 0.7,
        emissiveIntensity: 0.2
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-config.size * 0.4, 0, 0);
    leftWing.castShadow = true;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(config.size * 0.4, 0, 0);
    rightWing.castShadow = true;
    group.add(rightWing);
    
    // Multiple engines
    const engineGeometry = new THREE.CylinderGeometry(0.1, 0.15, config.size * 0.5, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffaa00, 
        emissive: 0xff5500,
        emissiveIntensity: 0.7
    });
    
    const engines = [
        [-config.size * 0.3, 0, -config.size * 0.9],
        [config.size * 0.3, 0, -config.size * 0.9],
        [-config.size * 0.15, 0, -config.size * 1.1],
        [config.size * 0.15, 0, -config.size * 1.1]
    ];
    
    engines.forEach(pos => {
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(pos[0], pos[1], pos[2]);
        group.add(engine);
    });
    
    // Weapon turrets
    const turretGeometry = new THREE.CylinderGeometry(0.08, 0.08, config.size * 0.3, 8);
    const turretMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444, 
        emissive: 0x222222,
        emissiveIntensity: 0.3
    });
    
    const leftTurret = new THREE.Mesh(turretGeometry, turretMaterial);
    leftTurret.position.set(-config.size * 0.2, config.size * 0.1, config.size * 0.7);
    group.add(leftTurret);
    
    const rightTurret = new THREE.Mesh(turretGeometry, turretMaterial);
    rightTurret.position.set(config.size * 0.2, config.size * 0.1, config.size * 0.7);
    group.add(rightTurret);
    
    return group;
}

function createEnemyDestroyer(group, config) {
    // Massive, menacing boss ship
    const bodyGeometry = new THREE.ConeGeometry(config.size * 0.8, config.size * 2.5, 12);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color, 
        emissive: config.emissive,
        emissiveIntensity: 0.4,
        shininess: 90
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Multiple wing sections
    const wingGeometry = new THREE.BoxGeometry(config.size * 1.5, 0.1, config.size * 0.8);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color * 0.8, 
        emissive: config.emissive * 0.8,
        emissiveIntensity: 0.3
    });
    
    const wings = [
        [-config.size * 0.6, 0, -config.size * 0.3],
        [config.size * 0.6, 0, -config.size * 0.3],
        [-config.size * 0.4, 0, config.size * 0.2],
        [config.size * 0.4, 0, config.size * 0.2]
    ];
    
    wings.forEach(pos => {
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(pos[0], pos[1], pos[2]);
        wing.castShadow = true;
        group.add(wing);
    });
    
    // Multiple weapon systems
    const weaponGeometry = new THREE.CylinderGeometry(0.12, 0.12, config.size * 0.4, 8);
    const weaponMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555, 
        emissive: 0x333333,
        emissiveIntensity: 0.4
    });
    
    const weapons = [
        [-config.size * 0.3, 0, config.size * 1.0],
        [config.size * 0.3, 0, config.size * 1.0],
        [-config.size * 0.5, 0, config.size * 0.5],
        [config.size * 0.5, 0, config.size * 0.5],
        [0, 0, config.size * 1.2]
    ];
    
    weapons.forEach(pos => {
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(pos[0], pos[1], pos[2]);
        weapon.rotation.z = Math.PI / 2;
        group.add(weapon);
    });
    
    // Massive engines
    const engineGeometry = new THREE.CylinderGeometry(0.2, 0.3, config.size * 0.8, 12);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6600, 
        emissive: 0xff3300,
        emissiveIntensity: 1.0
    });
    
    const engines = [
        [-config.size * 0.4, 0, -config.size * 1.2],
        [config.size * 0.4, 0, -config.size * 1.2],
        [-config.size * 0.2, 0, -config.size * 1.5],
        [config.size * 0.2, 0, -config.size * 1.5]
    ];
    
    engines.forEach(pos => {
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(pos[0], pos[1], pos[2]);
        group.add(engine);
    });
    
    // Command bridge
    const bridgeGeometry = new THREE.SphereGeometry(config.size * 0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const bridgeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.6,
        emissive: 0x001122,
        emissiveIntensity: 0.3
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, config.size * 0.2, config.size * 0.3);
    group.add(bridge);
    
    return group;
}

// ===========================================
// POWER-UP CREATION - Creates collectible power-ups
// ===========================================
function createPowerUp(type) {
    // Define different power-up types with their visual properties
    const powerUpTypes = {
        health: { color: 0x00ff00, shape: 'sphere', size: 1.5 }, // Green sphere - restores health
        weapon: { color: 0x0088ff, shape: 'box', size: 1.2 }, // Blue box - upgrades weapon
        boost: { color: 0xffff00, shape: 'cone', size: 1.2 }, // Yellow cone - speed boost
        shield: { color: 0x00ffff, shape: 'octahedron', size: 1.2 } // Cyan octahedron - temporary invulnerability
    };
    
    // Get the configuration for this power-up type
    const config = powerUpTypes[type];
    let geometry;
    
    // Create the appropriate 3D shape based on power-up type
    switch(config.shape) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5 * config.size, 12, 12);
            break;
        case 'box':
            geometry = new THREE.BoxGeometry(0.8 * config.size, 0.8 * config.size, 0.8 * config.size);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(0.4 * config.size, 1 * config.size, 12);
            break;
        case 'octahedron':
            geometry = new THREE.OctahedronGeometry(0.6 * config.size);
            break;
    }
    
    // Create glowing material for the power-up
    const material = new THREE.MeshPhongMaterial({ 
        color: config.color, // Base color
        transparent: true, // Enable transparency
        opacity: 0.9, // 90% opaque
        emissive: config.color, // Glowing effect
        emissiveIntensity: 0.5, // Glow strength
        shininess: 100 // Surface shininess
    });
    const powerUp = new THREE.Mesh(geometry, material);
    
    // Position the power-up randomly near the player
    powerUp.position.set(
        (Math.random() - 0.5) * 20, // X: -10 to 10
        Math.random() * 8 + 3, // Y: 3 to 11 (above ground)
        (Math.random() - 0.5) * 20  // Z: -10 to 10
    );
    
    // Store power-up data for animation and collection
    powerUp.userData = {
        type: type, // Power-up type
        rotationSpeed: 0.08, // How fast it rotates
        bobSpeed: 0.005, // How fast it bobs up and down
        collected: false // Whether it's been collected
    };
    
    // Enable shadows for realistic lighting
    powerUp.castShadow = true;
    powerUp.receiveShadow = true;
    
    // Add to scene and power-up array
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// ===========================================
// BULLET CREATION - Creates projectiles fired by player and enemies
// ===========================================
function createBullet(startPos, direction, isPlayerBullet = true, bulletType = 'basic') {
    // Define different bullet types with their properties
    const bulletTypes = {
        basic: { 
            color: 0xffff00, // Yellow color
            size: 0.15, // Bullet size
            speed: 0.4, // Movement speed
            damage: 1, // Damage dealt
            shape: 'sphere', // 3D shape
            emissiveIntensity: 0.3, // Glow strength
            trail: false // Whether it has a trail effect
        },
        rapid: { 
            color: 0x00ffff, // Cyan color
            size: 0.12, // Smaller but faster
            speed: 0.5, // Faster movement
            damage: 1, // Same damage
            shape: 'sphere',
            emissiveIntensity: 0.4,
            trail: false
        },
        spread: { 
            color: 0xff8800, // Orange color
            size: 0.18, // Larger bullet
            speed: 0.3, // Slower movement
            damage: 1, // Same damage
            shape: 'sphere',
            emissiveIntensity: 0.5,
            trail: false
        },
        laser: { 
            color: 0xff0088, // Magenta color
            size: 0.25, // Large bullet
            speed: 0.6, // Very fast
            damage: 2, // Double damage
            shape: 'cylinder', // Cylindrical shape
            emissiveIntensity: 0.6,
            trail: true // Has trail effect
        },
        plasma: { 
            color: 0xff00ff, // Bright magenta
            size: 0.3, // Very large
            speed: 0.4, // Medium speed
            damage: 3, // Triple damage
            shape: 'octahedron', // Diamond shape
            emissiveIntensity: 0.8,
            trail: true
        },
        energy: { 
            color: 0x00ff00, // Bright green
            size: 0.35, // Largest bullet
            speed: 0.5, // Fast speed
            damage: 4, // Quadruple damage
            shape: 'dodecahedron', // Complex shape
            emissiveIntensity: 1.0, // Maximum glow
            trail: true
        },
        scatter: { 
            color: 0xff8800, // Orange color
            size: 0.12, // Small but fast
            speed: 0.4, // Medium speed
            damage: 1, // Standard damage
            shape: 'sphere',
            emissiveIntensity: 0.4,
            trail: false
        }
    };
    
    const config = bulletTypes[bulletType] || bulletTypes.basic;
    
    // Create different bullet shapes based on type
    let geometry;
    switch(config.shape) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(config.size, 12, 12);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(config.size * 0.5, config.size * 0.5, config.size * 2, 8);
            break;
        case 'octahedron':
            geometry = new THREE.OctahedronGeometry(config.size);
            break;
        case 'dodecahedron':
            geometry = new THREE.DodecahedronGeometry(config.size);
            break;
        default:
            geometry = new THREE.SphereGeometry(config.size, 12, 12);
    }
    
    const material = new THREE.MeshPhongMaterial({ 
        color: config.color,
        emissive: config.color,
        emissiveIntensity: config.emissiveIntensity,
        transparent: true,
        opacity: 0.9
    });
    
    const bullet = new THREE.Mesh(geometry, material);
    
    bullet.position.copy(startPos);
    bullet.userData = {
        direction: direction.clone(),
        speed: config.speed,
        isPlayerBullet: isPlayerBullet,
        damage: config.damage,
        bulletType: bulletType,
        trail: config.trail,
        originalColor: config.color
    };
    
    bullet.castShadow = true;
    bullet.receiveShadow = true;
    
    // Add bullet trail effect for advanced bullets
    if (config.trail) {
        addBulletTrail(bullet, config.color);
    }
    
    scene.add(bullet);
    
    if (isPlayerBullet) {
        bullets.push(bullet);
    } else {
        enemyBullets.push(bullet);
    }
}

function addBulletTrail(bullet, color) {
    // Create a trail effect for advanced bullets
    const trailGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.3, 6);
    const trailMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        emissive: color,
        emissiveIntensity: 0.3
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.copy(bullet.position);
    trail.lookAt(bullet.position.clone().add(bullet.userData.direction));
    bullet.userData.trail = trail;
    scene.add(trail);
}

function createExplosion(position, size = 1) {
    // Limit particle count based on size to prevent performance issues
    const particleCount = Math.min(50, Math.max(20, Math.floor(size * 30)));
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Position
        positions[i3] = position.x;
        positions[i3 + 1] = position.y;
        positions[i3 + 2] = position.z;
        
        // Velocity - scale with size
        const velocityScale = 0.2 * size;
        velocities[i3] = (Math.random() - 0.5) * velocityScale;
        velocities[i3 + 1] = (Math.random() - 0.5) * velocityScale;
        velocities[i3 + 2] = (Math.random() - 0.5) * velocityScale;
        
        // Color - more varied colors
        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2, 1, 0.5 + Math.random() * 0.3);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1 * size,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending // Better visual effect
    });
    
    const explosion = new THREE.Points(geometry, material);
    explosion.userData = {
        velocities: velocities,
        life: 1.0,
        decay: 0.03, // Faster decay to prevent accumulation
        maxAge: 1000 // Maximum age in milliseconds
    };
    
    scene.add(explosion);
    particles.push(explosion);
    
    // Limit total particles to prevent memory issues
    if (particles.length > 20) {
        const oldParticle = particles.shift();
        scene.remove(oldParticle);
        if (oldParticle.geometry) oldParticle.geometry.dispose();
        if (oldParticle.material) oldParticle.material.dispose();
    }
}

// ===========================================
// SCATTER SHOT SYSTEM - Shoots bullets in all directions
// ===========================================
function shootScatter() {
    if (gameState.gameOver) return;
    
    // Update shots fired counter
    gameState.shotsFired += 8; // Count each bullet
    
    const bulletStart = player.position.clone();
    bulletStart.y += 1;
    
    // Shoot bullets in 8 directions (every 45 degrees)
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8; // 0, 45, 90, 135, 180, 225, 270, 315 degrees
        const direction = new THREE.Vector3(
            Math.sin(angle), // X direction
            0, // Y direction (keep horizontal)
            Math.cos(angle) // Z direction
        );
        
        // Create scatter bullet with special properties
        createBullet(bulletStart, direction, true, 'scatter');
    }
    
    // Show notification
    showNotification('SCATTER SHOT!', 2000);
    
    // Play special sound effect
    if (sounds.powerUp) sounds.powerUp();
}

function shoot() {
    if (gameState.gameOver) return;
    
    // Check if scatter mode is active
    if (gameState.scatterMode) {
        shootScatter();
        return;
    }
    
    // Update shots fired counter
    gameState.shotsFired++;
    
    const bulletStart = player.position.clone();
    bulletStart.y += 1;
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(player.quaternion);
    
    // Different shooting patterns based on weapon level
    const weaponLevel = gameState.weaponLevel || 1;
    let bulletType = 'basic';
    
    // Upgrade bullet type based on weapon level
    if (weaponLevel >= 6) bulletType = 'energy';
    else if (weaponLevel >= 5) bulletType = 'plasma';
    else if (weaponLevel >= 4) bulletType = 'laser';
    else if (weaponLevel >= 3) bulletType = 'spread';
    else if (weaponLevel >= 2) bulletType = 'rapid';
    
    switch(gameState.weaponType) {
        case 'basic':
            createBullet(bulletStart, direction, true, bulletType);
            break;
        case 'rapid':
            createBullet(bulletStart, direction, true, bulletType);
            break;
        case 'spread':
            // Triple shot with upgraded bullets
            createBullet(bulletStart, direction.clone().rotateY(0.2), true, bulletType);
            createBullet(bulletStart, direction, true, bulletType);
            createBullet(bulletStart, direction.clone().rotateY(-0.2), true, bulletType);
            break;
        case 'laser':
            createBullet(bulletStart, direction, true, bulletType);
            break;
    }
}

function setupEventListeners() {
    // Keydown handler
    const keydownHandler = (event) => {
        keys[event.code] = true;
        
        if (event.code === 'Space') {
            event.preventDefault();
            shoot();
        }
        
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            event.preventDefault();
            activateBoost();
        }
        
        if (event.code === 'KeyR') {
            event.preventDefault();
            reloadWeapon();
        }
        
        if (event.code === 'KeyP') {
            event.preventDefault();
            togglePause();
        }
        
        if (event.code === 'KeyM') {
            event.preventDefault();
            toggleMute();
        }
        
        if (event.code === 'KeyC') {
            event.preventDefault();
            toggleCameraMode();
        }
        
        if (event.code === 'KeyV') {
            event.preventDefault();
            toggleScatterMode();
        }
    };
    
    // Keyup handler
    const keyupHandler = (event) => {
        keys[event.code] = false;
    };
    
    // Resize handler
    const resizeHandler = onWindowResize;
    
    // Click handler for audio context and shooting
    const clickHandler = (event) => {
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Shoot on left mouse click
        if (event.button === 0) { // Left mouse button
            event.preventDefault();
            shoot();
        }
    };
    
    // Add event listeners and store references
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
    window.addEventListener('resize', resizeHandler);
    document.addEventListener('click', clickHandler);
    
    // Store references for cleanup
    eventListeners.push(
        { element: document, event: 'keydown', handler: keydownHandler },
        { element: document, event: 'keyup', handler: keyupHandler },
        { element: window, event: 'resize', handler: resizeHandler },
        { element: document, event: 'click', handler: clickHandler }
    );
}

// Additional utility functions
function reloadWeapon() {
    if (gameState.gameOver) return;
    
    // Show reload notification even with infinite ammo
    showNotification('Weapon Reloaded!', 2000);
    if (sounds.powerUp) sounds.powerUp();
}

function togglePause() {
    gameState.paused = !gameState.paused;
    
    // Handle music pause/resume
    if (musicGainNode) {
        if (gameState.paused) {
            // Pause music by setting gain to 0
            musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioContext.currentTime);
            musicGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        } else {
            // Resume music by restoring gain
            musicGainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
            musicGainNode.gain.exponentialRampToValueAtTime(gameSettings.soundEnabled ? 0.2 : 0.001, audioContext.currentTime + 0.1);
        }
    }
    
    showNotification(gameState.paused ? 'Game Paused' : 'Game Resumed', 1500);
}

function toggleMute() {
    gameSettings.soundEnabled = !gameSettings.soundEnabled;
    musicEnabled = gameSettings.soundEnabled;
    
    if (musicGainNode) {
        // Smooth transition for music
        musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioContext.currentTime);
        musicGainNode.gain.exponentialRampToValueAtTime(
            gameSettings.soundEnabled ? 0.2 : 0.001, 
            audioContext.currentTime + 0.2
        );
    }
    
    // Handle audio context state
    if (gameSettings.soundEnabled && audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.log('Audio resume failed:', e));
    }
    
    showNotification(gameSettings.soundEnabled ? 'Sound On' : 'Sound Off', 1500);
}

function toggleCameraMode() {
    cameraMode = cameraMode === 'follow' ? 'free' : 'follow';
    
    if (cameraMode === 'follow') {
        controls.enabled = false;
        // Reset camera position to follow player
        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);
        showNotification('Camera: Follow Spaceship', 2000);
    } else {
        controls.enabled = true;
        // Set camera target to current player position
        controls.target.copy(player.position);
        controls.update();
        showNotification('Camera: Free Mode', 2000);
    }
}

// ===========================================
// SCATTER MODE TOGGLE - Activates/deactivates scatter shot
// ===========================================
function toggleScatterMode() {
    gameState.scatterMode = !gameState.scatterMode;
    
    if (gameState.scatterMode) {
        showNotification('SCATTER MODE ON - Press SPACE to shoot in all directions!', 3000);
    } else {
        showNotification('SCATTER MODE OFF - Normal shooting restored', 2000);
    }
}

function showLeaderboard() {
    // Simple leaderboard using localStorage
    const scores = JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
    scores.push({
        score: gameState.score,
        level: gameState.level,
        enemiesDestroyed: gameState.enemiesDestroyed,
        accuracy: gameState.shotsFired > 0 ? (gameState.shotsHit / gameState.shotsFired * 100).toFixed(1) : 0,
        date: new Date().toLocaleDateString()
    });
    
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10
    
    localStorage.setItem('spaceShooterScores', JSON.stringify(scores));
    
    let leaderboardText = '🏆 LEADERBOARD 🏆\n\n';
    scores.forEach((score, index) => {
        leaderboardText += `${index + 1}. Score: ${score.score} | Level: ${score.level} | Accuracy: ${score.accuracy}%\n`;
    });
    
    alert(leaderboardText);
}

function updateCombo() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastHitTime > gameState.comboTime) {
        gameState.comboMultiplier = 1;
    }
}

function updateCamera() {
    if (cameraMode === 'follow' && player) {
        // Smooth camera following
        cameraTarget.copy(player.position).add(cameraOffset);
        
        // Smooth interpolation for camera movement
        camera.position.lerp(cameraTarget, 0.05);
        
        // Make camera look at player
        const lookTarget = player.position.clone();
        lookTarget.y += 2; // Look slightly above player
        
        camera.lookAt(lookTarget);
    }
}

function activateBoost() {
    if (gameState.boostActive || gameState.gameOver) return;
    
    gameState.boostActive = true;
    gameState.boostTime = gameSettings.boostDuration;
    
    // Visual effect - update all player materials
    player.traverse((child) => {
        if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0x00ff00);
        }
    });
    
    showNotification('Boost Activated!', 2000);
    if (sounds.powerUp) sounds.powerUp();
    
}

function updatePlayer() {
    if (gameState.gameOver) return;
    
    const speed = gameState.boostActive ? 0.15 : 0.1;
    
    // Move player with better controls
    if (keys['KeyW']) player.position.z -= speed;
    if (keys['KeyS']) player.position.z += speed;
    if (keys['KeyA']) player.position.x -= speed;
    if (keys['KeyD']) player.position.x += speed;
    
    // Add vertical movement (Q and E keys)
    if (keys['KeyQ']) player.position.y += speed;
    if (keys['KeyE']) player.position.y -= speed;
    
    // Keep player in bounds
    player.position.x = Math.max(-25, Math.min(25, player.position.x));
    player.position.z = Math.max(-25, Math.min(25, player.position.z));
    player.position.y = Math.max(-5, Math.min(20, player.position.y));
    
    // Update boost
    if (gameState.boostActive) {
        gameState.boostTime -= 16; // ~60fps
        if (gameState.boostTime <= 0) {
            gameState.boostActive = false;
            // Reset all player materials to original colors
            player.traverse((child) => {
                if (child.material && child.material.emissive) {
                    // Reset to original emissive colors based on ship part
                    if (child.material.color && child.material.color.getHex() === 0x00aaff) {
                        child.material.emissive.setHex(0x002244); // Fuselage
                    } else if (child.material.color && child.material.color.getHex() === 0x0066cc) {
                        child.material.emissive.setHex(0x001133); // Wings
                    } else if (child.material.color && child.material.color.getHex() === 0x88ccff) {
                        child.material.emissive.setHex(0x001122); // Cockpit
                    } else {
                        child.material.emissive.setHex(0x000000); // Default
                    }
                }
            });
        }
    }
    
    // Update invulnerability
    if (gameState.invulnerable) {
        gameState.invulnerableTime -= 16;
        if (gameState.invulnerableTime <= 0) {
            gameState.invulnerable = false;
            // Reset opacity for all player materials
            player.traverse((child) => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = 1;
                }
            });
            removeShieldEffect();
        } else {
            // Update shield effect position
            if (shieldEffect) {
                shieldEffect.position.copy(player.position);
                shieldEffect.rotation.y += 0.05;
            }
            // Blinking effect for all player materials
            const blinkOpacity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            player.traverse((child) => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = blinkOpacity;
                }
            });
        }
    }
}

function updateEnemies() {
    const currentTime = Date.now();
    
    // Spawn enemies based on level
    const spawnRate = Math.max(500, gameSettings.enemySpawnRate - (gameState.level * 100));
    if (currentTime - gameState.lastEnemySpawn > spawnRate && enemies.length < gameSettings.maxEnemies) {
        const enemyTypes = ['basic', 'fast', 'heavy'];
        if (gameState.level > 3) enemyTypes.push('boss');
        
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        createEnemy(randomType);
        gameState.lastEnemySpawn = currentTime;
    }
    
    // Update existing enemies
    enemies.forEach((enemy, index) => {
        // Move enemy towards player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position);
        direction.normalize();
        direction.multiplyScalar(enemy.userData.speed);
        
        enemy.position.add(direction);
        
        // Rotate enemy
        enemy.rotation.y += 0.02;
        
        // Enemy shooting
        if (currentTime - enemy.userData.lastShot > enemy.userData.shootRate) {
            const bulletStart = enemy.position.clone();
            bulletStart.y -= 1;
            
            const shootDirection = new THREE.Vector3();
            shootDirection.subVectors(player.position, enemy.position);
            shootDirection.normalize();
            
            createBullet(bulletStart, shootDirection, false);
            enemy.userData.lastShot = currentTime;
        }
        
        // Check collision with player - use enemy size for accurate collision
        const enemySize = enemy.userData.type === 'boss' ? 3.0 : 
                         enemy.userData.type === 'heavy' ? 2.0 : 
                         enemy.userData.type === 'fast' ? 1.2 : 1.5;
        const collisionDistance = enemySize + 1.0; // Player radius + enemy radius
        
        if (enemy.position.distanceTo(player.position) < collisionDistance && !gameState.invulnerable) {
            takeDamage(10);
            createExplosion(enemy.position, enemySize);
            scene.remove(enemy);
            enemies.splice(index, 1);
        }
    });
}

function updatePowerUps() {
    const currentTime = Date.now();
    
    // Spawn power-ups
    if (currentTime - gameState.lastPowerUpSpawn > gameSettings.powerUpSpawnRate && powerUps.length < gameSettings.maxPowerUps) {
        const powerUpTypes = ['health', 'weapon', 'boost', 'shield'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        createPowerUp(randomType);
        gameState.lastPowerUpSpawn = currentTime;
    }
    
    // Update existing power-ups
    powerUps.forEach((powerUp, index) => {
        // Rotate power-up
        powerUp.rotation.y += powerUp.userData.rotationSpeed;
        powerUp.rotation.x += powerUp.userData.rotationSpeed * 0.5;
        
        // Float up and down
        powerUp.position.y += Math.sin(Date.now() * powerUp.userData.bobSpeed) * 0.01;
        
        // Check collision with player
        if (powerUp.position.distanceTo(player.position) < 1.5) {
            collectPowerUp(powerUp.userData.type);
            scene.remove(powerUp);
            powerUps.splice(index, 1);
        }
        
        // Remove power-ups that are too far away
        if (powerUp.position.distanceTo(player.position) > 50) {
            scene.remove(powerUp);
            powerUps.splice(index, 1);
        }
    });
}

function collectPowerUp(type) {
    switch(type) {
        case 'health':
            gameState.health = Math.min(gameState.maxHealth, gameState.health + 25);
            showNotification('Health Restored!', '#00ff00');
            break;
        case 'weapon':
            // Increase weapon level instead of changing weapon type
            gameState.weaponLevel = (gameState.weaponLevel || 1) + 1;
            const maxLevel = 6;
            if (gameState.weaponLevel > maxLevel) gameState.weaponLevel = maxLevel;
            
            const levelNames = ['Basic', 'Enhanced', 'Advanced', 'Laser', 'Plasma', 'Energy'];
            const levelName = levelNames[gameState.weaponLevel - 1] || 'Unknown';
            showNotification(`Weapon Upgraded: ${levelName} Level ${gameState.weaponLevel}!`, '#0088ff');
            break;
        case 'boost':
            activateBoost();
            showNotification('Speed Boost Activated!', '#ffff00');
            break;
        case 'shield':
            gameState.invulnerable = true;
            gameState.invulnerableTime = gameSettings.invulnerableDuration;
            showNotification('Shield Activated!', '#00ffff');
            // Add shield visual effect
            addShieldEffect();
            break;
    }
    
    // Play collection sound
    if (sounds.powerUp) sounds.powerUp();
    
}

function addShieldEffect() {
    // Remove existing shield effect
    if (shieldEffect) {
        scene.remove(shieldEffect);
    }
    
    // Create shield sphere around player
    const shieldGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    const shieldMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2,
        wireframe: true
    });
    
    shieldEffect = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldEffect.position.copy(player.position);
    scene.add(shieldEffect);
    
}

function removeShieldEffect() {
    if (shieldEffect) {
        scene.remove(shieldEffect);
        // Properly dispose of geometry and material
        if (shieldEffect.geometry) {
            shieldEffect.geometry.dispose();
        }
        if (shieldEffect.material) {
            shieldEffect.material.dispose();
        }
        shieldEffect = null;
    }
}

function takeDamage(amount) {
    if (gameState.invulnerable) return;
    
    gameState.health -= amount;
    gameState.invulnerable = true;
    gameState.invulnerableTime = gameSettings.invulnerableDuration;
    
    if (gameState.health <= 0) {
        gameOver();
    }
}

function updateBullets() {
    // Update player bullets
    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed));
        
        // Check collision with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.position.distanceTo(enemy.position) < 1) {
                // Hit! Use bullet damage
                const damage = bullet.userData.damage || 1;
                enemy.userData.health -= damage;
                
                if (enemy.userData.health <= 0) {
                    // Enemy destroyed
                    createExplosion(enemy.position, 1.5);
                    scene.remove(enemy);
                    enemies.splice(enemyIndex, 1);
                    
                    // Update statistics
                    gameState.enemiesDestroyed++;
                    gameState.shotsHit++;
                    
                    // Update combo system
                    const currentTime = Date.now();
                    if (currentTime - gameState.lastHitTime <= gameState.comboTime) {
                        gameState.comboMultiplier = Math.min(gameState.comboMultiplier + 0.5, 5.0);
                    } else {
                        gameState.comboMultiplier = 1.0;
                    }
                    gameState.lastHitTime = currentTime;
                    
                    // Score based on enemy type, bullet damage, and combo multiplier
                    const scores = { basic: 10, fast: 15, heavy: 25, boss: 100 };
                    const baseScore = (scores[enemy.userData.type] || 10) * damage;
                    const comboScore = Math.floor(baseScore * gameState.comboMultiplier);
                    gameState.score += comboScore;
                    
                    // Level up
                    if (gameState.score > gameState.level * 500) {
                        gameState.level++;
                    }
                }
                
                // Remove bullet and trail
                if (bullet.userData.trail) {
                    scene.remove(bullet.userData.trail);
                    if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
                    if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
                }
                scene.remove(bullet);
                bullets.splice(index, 1);
            }
        });
        
        // Update bullet trail if it exists
        if (bullet.userData.trail) {
            bullet.userData.trail.position.copy(bullet.position);
            bullet.userData.trail.lookAt(bullet.position.clone().add(bullet.userData.direction));
        }
        
        // Remove bullets that are too far
        if (bullet.position.distanceTo(player.position) > 60) {
            // Clean up trail
            if (bullet.userData.trail) {
                scene.remove(bullet.userData.trail);
                if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
                if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
            }
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
    
    // Update enemy bullets
    enemyBullets.forEach((bullet, index) => {
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed));
        
        // Check collision with player
        if (bullet.position.distanceTo(player.position) < 1 && !gameState.invulnerable) {
            scene.remove(bullet);
            enemyBullets.splice(index, 1);
            takeDamage(5);
        }
        
        // Remove bullets that are too far
        if (bullet.position.distanceTo(player.position) > 60) {
            scene.remove(bullet);
            enemyBullets.splice(index, 1);
        }
    });
}

function updateParticles() {
    particles.forEach((particle, index) => {
        const positions = particle.geometry.attributes.position.array;
        const velocities = particle.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
        }
        
        particle.geometry.attributes.position.needsUpdate = true;
        
        particle.userData.life -= particle.userData.decay;
        particle.material.opacity = particle.userData.life;
        
        // Remove particles that are too old or have faded out
        if (particle.userData.life <= 0 || particle.userData.maxAge <= 0) {
            scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
            particles.splice(index, 1);
        } else {
            // Decrease max age
            particle.userData.maxAge -= 16; // ~60fps
        }
    });
    
    // Update engine exhaust
    if (player && player.userData.exhaust) {
        const exhaust = player.userData.exhaust;
        const positions = exhaust.geometry.attributes.position.array;
        const velocities = exhaust.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Reset particles that have moved too far
            if (positions[i + 1] < -3) {
                positions[i] = exhaust.userData.originalPositions[i];
                positions[i + 1] = exhaust.userData.originalPositions[i + 1];
                positions[i + 2] = exhaust.userData.originalPositions[i + 2];
            }
        }
        
        exhaust.geometry.attributes.position.needsUpdate = true;
    }
}

function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('level').textContent = `Level: ${gameState.level}`;
    
    // Update combo display
    const comboElement = document.getElementById('combo');
    if (comboElement) {
        comboElement.textContent = `Combo: ${gameState.comboMultiplier.toFixed(1)}x`;
        // Change color based on combo level
        if (gameState.comboMultiplier >= 3) {
            comboElement.style.color = '#ff0000';
            comboElement.style.textShadow = '0 0 10px #ff0000';
        } else if (gameState.comboMultiplier >= 2) {
            comboElement.style.color = '#ff8800';
            comboElement.style.textShadow = '0 0 8px #ff8800';
        } else {
            comboElement.style.color = '#ffff00';
            comboElement.style.textShadow = '0 0 5px #ffff00';
        }
    }
    
    // Update health display
    document.getElementById('health').textContent = `Health: ${gameState.health}`;
    const healthFill = document.getElementById('healthFill');
    if (healthFill) {
        const healthPercent = (gameState.health / gameState.maxHealth) * 100;
        healthFill.style.width = `${healthPercent}%`;
    }
    
    // Update level progress bar
    const levelFill = document.getElementById('levelFill');
    if (levelFill) {
        const levelProgress = (gameState.score % 500) / 500 * 100;
        levelFill.style.width = `${levelProgress}%`;
    }
    
    // Update weapon level display
    const weaponLevel = gameState.weaponLevel || 1;
    const levelNames = ['Basic', 'Enhanced', 'Advanced', 'Laser', 'Plasma', 'Energy'];
    const levelName = levelNames[weaponLevel - 1] || 'Unknown';
    document.getElementById('weaponLevel').textContent = `Weapon: ${levelName} Lv.${weaponLevel}`;
}

function gameOver() {
    gameState.gameOver = true;
    
    // Update game over screen with correct statistics
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('enemiesDestroyed').textContent = gameState.enemiesDestroyed;
    
    // Calculate accuracy
    const accuracy = gameState.shotsFired > 0 ? (gameState.shotsHit / gameState.shotsFired * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    // Stop animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Clear all timers
    gameTimers.forEach(timer => clearTimeout(timer));
    gameTimers = [];
    
    // Reset game state
    gameState = {
        score: 0,
        health: 100,
        maxHealth: 100,
        level: 1,
        weaponType: 'basic',
        weaponLevel: 1,
        ammo: Infinity,
        maxAmmo: Infinity,
        lastEnemySpawn: 0,
        lastEnemyShot: 0,
        lastPowerUpSpawn: 0,
        gameOver: false,
        boostActive: false,
        boostTime: 0,
        invulnerable: false,
        invulnerableTime: 0,
        paused: false,
        shotsFired: 0,
        shotsHit: 0,
        enemiesDestroyed: 0,
        powerUpsActive: [],
        bossActive: false,
        bossHealth: 0,
        bossMaxHealth: 0,
        comboMultiplier: 1,
        lastHitTime: 0,
        comboTime: 3000,
        currentMap: 'spaceStation'
    };
    
    // Clear all objects and dispose of Three.js resources
    enemies.forEach(enemy => {
        scene.remove(enemy);
        // Dispose of all child objects recursively
        enemy.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    });
    
    bullets.forEach(bullet => {
        scene.remove(bullet);
        if (bullet.geometry) bullet.geometry.dispose();
        if (bullet.material) bullet.material.dispose();
        // Clean up bullet trails
        if (bullet.userData.trail) {
            scene.remove(bullet.userData.trail);
            if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
            if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
        }
    });
    
    enemyBullets.forEach(bullet => {
        scene.remove(bullet);
        if (bullet.geometry) bullet.geometry.dispose();
        if (bullet.material) bullet.material.dispose();
        // Clean up bullet trails
        if (bullet.userData.trail) {
            scene.remove(bullet.userData.trail);
            if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
            if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
        }
    });
    
    powerUps.forEach(powerUp => {
        scene.remove(powerUp);
        if (powerUp.geometry) powerUp.geometry.dispose();
        if (powerUp.material) powerUp.material.dispose();
    });
    
    particles.forEach(particle => {
        scene.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
    });
    
    // Clear arrays
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];
    
    // Reset shield effect
    if (shieldEffect) {
        scene.remove(shieldEffect);
        if (shieldEffect.geometry) shieldEffect.geometry.dispose();
        if (shieldEffect.material) shieldEffect.material.dispose();
        shieldEffect = null;
    }
    
    // Reset player
    player.position.set(0, 0, 0);
    // Reset all player materials
    player.traverse((child) => {
        if (child.material) {
            if (child.material.opacity !== undefined) {
                child.material.opacity = 1;
            }
            if (child.material.emissive) {
                child.material.emissive.setHex(0x004400);
            }
        }
    });
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Update UI
    updateUI();
    
    // Restart game loop
    gameLoop();
}

// ===========================================
// MAIN GAME LOOP - Updates all game systems and renders the scene
// ===========================================
function gameLoop() {
    try {
        // Only update game logic if game is not over and not paused
        if (!gameState.gameOver && !gameState.paused) {
            // Update all game systems in order
            updatePlayer(); // Handle player movement and input
            updateEnemies(); // Move enemies and handle enemy AI
            updatePowerUps(); // Animate power-ups and handle collection
            updateBullets(); // Move bullets and handle collisions
            updateParticles(); // Update explosion and engine effects
            updateCombo(); // Update combo system
            updateUI(); // Update HUD display
            updateMinimap(); // Redraw minimap
            updateCamera(); // Update camera position
            
            // Animate starfield rotation for dynamic background
            scene.children.forEach(child => {
                if (child.userData && child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                }
            });
        }
    
        // Update camera controls if in free mode
        if (cameraMode === 'free') {
            controls.update(); // Update orbit controls for mouse interaction
        }
    
        // Render the 3D scene to the screen
        renderer.render(scene, camera);
    
        // Schedule the next frame (typically 60 FPS)
        animationId = requestAnimationFrame(gameLoop);
    } catch (error) {
        // Handle any errors in the game loop
        console.error('Game loop error:', error);
        // Try to recover by restarting the game loop after a short delay
        setTimeout(() => {
            animationId = requestAnimationFrame(gameLoop);
        }, 100);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Global functions
window.restartGame = restartGame;

// Test function to check if button works
window.testRestart = function() {
    alert('Restart button is working!');
};

// Initialize when page loads - REMOVED for story intro
// document.addEventListener('DOMContentLoaded', init);


// Map configurations
const mapConfigs = {
    spaceStation: {
        name: 'Space Station',
        background: { color: 0x1a1a2e },
        starField: { color: 0xffffff, count: 1000 },
        enemyTypes: ['basic', 'fast'],
        enemyColors: [0x00ff00, 0x00ffff],
        ambientLight: 0x1a1a2e
    },
    asteroidField: {
        name: 'Asteroid Field',
        background: { color: 0x2c1810 },
        starField: { color: 0xffa500, count: 800 },
        enemyTypes: ['heavy', 'basic'],
        enemyColors: [0x8b4513, 0x654321],
        ambientLight: 0x2c1810
    },
    nebula: {
        name: 'Nebula',
        background: { color: 0x4a148c },
        starField: { color: 0xff69b4, count: 1200 },
        enemyTypes: ['fast', 'boss'],
        enemyColors: [0xe91e63, 0x7b1fa2],
        ambientLight: 0x4a148c
    },
    geometric: {
        name: '3D Geometric',
        background: { color: 0x0a0a0a },
        starField: { color: 0x00ffff, count: 1500 },
        enemyTypes: ['basic', 'fast', 'heavy'],
        enemyColors: [0xff6b6b, 0x4ecdc4, 0xffe66d],
        ambientLight: 0x0a0a0a
    }
};

// Change map function
function changeMap(mapType) {
    if (!mapConfigs[mapType]) return;
    
    gameState.currentMap = mapType;
    
    // Update UI
    document.getElementById('currentMap').textContent = `Map: ${mapConfigs[mapType].name}`;
    
    // Update active button
    document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-map="${mapType}"]`).classList.add('active');
    
    // Change background
    scene.background = new THREE.Color(mapConfigs[mapType].background.color);
    
    // Update starfield
    updateStarField(mapConfigs[mapType]);
    
    // Update lighting
    updateLighting(mapConfigs[mapType]);
    
    // Clear existing enemies
    enemies.forEach(enemy => scene.remove(enemy));
    enemies.length = 0;
    
    // Show notification
    showNotification(`Map changed to ${mapConfigs[mapType].name}!`);
}

// Update starfield based on map
function updateStarField(config) {
    // Remove existing starfield
    const existingStars = scene.children.filter(child => child.userData.isStarField);
    existingStars.forEach(star => scene.remove(star));
    
    // Create new starfield
    createEnhancedStarField(config.starField.count, config.starField.color);
}

// Update lighting based on map
function updateLighting(config) {
    // Update ambient light
    const ambientLight = scene.children.find(child => child.type === 'AmbientLight');
    if (ambientLight) {
        ambientLight.color.setHex(config.ambientLight);
    }
}

// Enhanced starfield creation with map-specific colors
function createEnhancedStarField(count = 1000, starColor = 0xffffff) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Random positions
        positions[i3] = (Math.random() - 0.5) * 200;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
        positions[i3 + 2] = (Math.random() - 0.5) * 200;
        
        // Map-specific colors
        const color = new THREE.Color(starColor);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const starField = new THREE.Points(geometry, material);
    starField.userData.isStarField = true;
    scene.add(starField);
}

// Comprehensive cleanup function
function cleanupGame() {
    // Stop animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Clear all timers
    gameTimers.forEach(timer => clearTimeout(timer));
    gameTimers = [];
    
    // Remove all event listeners
    eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    eventListeners = [];
    
    // Dispose of all Three.js objects
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
    
    // Dispose of renderer
    if (renderer) {
        renderer.dispose();
    }
    
    // Dispose of controls
    if (controls) {
        controls.dispose();
    }
    
    // Clean up audio oscillators
    musicOscillators.forEach(oscillator => {
        try {
            oscillator.stop();
            oscillator.disconnect();
        } catch (e) {
            // Oscillator may already be stopped
        }
    });
    musicOscillators = [];
    
    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
}

// Initialize when DOM is loaded - REMOVED for story intro
// document.addEventListener('DOMContentLoaded', init);