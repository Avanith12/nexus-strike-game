let scene,
    camera,
    renderer,
    controls;

let player,
    enemies = [],
    bullets = [],
    enemyBullets = [],
    powerUps = [],
    particles = [],
    shieldEffect = null;

let keys = {};

let minimapCanvas,
    minimapCtx;

let audioContext,
    sounds = {},
    backgroundMusic = null,
    musicGainNode = null;

let cameraMode = 'follow';
let cameraOffset = new THREE.Vector3(0, 8, 15);
let cameraTarget = new THREE.Vector3();

let playerSpeed = 0;
let engineTrail = null;

let redFlashElement = null;
let lowHealthFlashActive = false;
let lowHealthFlashInterval = null;

let animationId = null;
let gameTimers = [];
let eventListeners = [];

let currentMusicLevel = 1,
    musicEnabled = true;
let musicOscillators = [];

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
    paused: false,

    boostActive: false,
    boostTime: 0,
    invulnerable: false,
    invulnerableTime: 0,
    scatterMode: false,
    powerUpsActive: [],

    shotsFired: 0,
    shotsHit: 0,
    enemiesDestroyed: 0,

    bossActive: false,
    bossHealth: 0,
    bossMaxHealth: 0,

    comboMultiplier: 1,
    lastHitTime: 0,
    comboTime: 3000
};

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

function init() {
    try {

        console.log('%c' +
        ' █████╗ ██╗   ██╗ █████╗ ███╗   ██╗██╗████████╗██╗  ██╗    ██╗  ██╗\n' +
        '██╔══██╗██║   ██║██╔══██╗████╗  ██║██║╚══██╔══╝██║  ██║    ██║ ██╔╝\n' +
        '███████║██║   ██║███████║██╔██╗ ██║██║   ██║   ███████║    █████╔╝ \n' +
        '██╔══██║██║   ██║██╔══██║██║╚██╗██║██║   ██║   ██╔══██║    ██╔═██╗ \n' +
        '██║  ██║╚██████╔╝██║  ██║██║ ╚████║██║   ██║   ██║  ██║    ██║  ██╗\n' +
        '╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝  ╚═╝\n',
        'color: #00ffff; font-weight: bold; font-size: 12px; font-family: monospace;');
        console.log('%c🚀 NEXUS STRIKE - A Three.js Space Shooter Experience', 'color: #00ff00; font-size: 14px; font-weight: bold;');
        console.log('%c Game designed by Avanith Kanamarlapudi', 'color: #ffaa00; font-size: 12px; font-style: italic;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');

        initAudio();

        initRedFlash();

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        scene.fog = new THREE.Fog(0x000011, 50, 200);

        createEnhancedStarField();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 15);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            throw new Error('Game container not found');
        }
        gameContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI;
        controls.minDistance = 3;
        controls.maxDistance = 50;
        controls.enablePan = true;
        controls.enableZoom = true;

    setupEnhancedLighting();

        createModernPlayer();

        initMinimap();

    setupEventListeners();

        const initialPowerUpTimer = setTimeout(() => {
            createPowerUp('health');
            createPowerUp('weapon');
            createPowerUp('boost');
            createPowerUp('shield');
        }, 1000);
        gameTimers.push(initialPowerUpTimer);

    gameLoop();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showNotification('Game initialization failed. Please refresh the page.', 5000);
    }
}

function initAudio() {
    try {

        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        musicGainNode = audioContext.createGain();
        musicGainNode.connect(audioContext.destination);
        musicGainNode.gain.value = 0.2;

        sounds.shoot = createTone(800, 0.1, 'sine');
        sounds.explosion = createTone(200, 0.3, 'sawtooth');
        sounds.powerUp = createTone(1000, 0.2, 'square');
        sounds.hit = createTone(400, 0.15, 'triangle');
        sounds.levelUp = createTone(600, 0.5, 'sine');

        startBackgroundMusic();

    } catch (e) {

        console.warn('Audio initialization failed:', e);
        gameSettings.soundEnabled = false;
    }
}

function createTone(frequency, duration, type = 'sine') {

    return function() {

        if (!gameSettings.soundEnabled || !audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const currentTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(gameSettings.sfxVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
    };
}

function startBackgroundMusic() {

    if (!audioContext || !musicEnabled) return;

    const playNote = (frequency, duration, startTime) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(musicGainNode);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        musicOscillators.push(oscillator);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

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

    const scales = {
        1: [220, 246.94, 277.18, 329.63, 369.99, 415.30, 466.16],
        2: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
        3: [311.13, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
        4: [329.63, 369.99, 415.30, 466.16, 523.25, 587.33, 659.25],
        5: [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99],
        6: [466.16, 523.25, 587.33, 659.25, 739.99, 830.61, 932.33]
    };

    const playMusicLoop = () => {
        if (!musicEnabled) return;

        const currentTime = audioContext.currentTime;
        const level = Math.min(gameState.level, 6);
        const scale = scales[level] || scales[6];

        const tempo = 120 + (level - 1) * 20;
        const beatDuration = 60 / tempo;

        const phraseLength = 8 * beatDuration;

        for (let i = 0; i < 8; i++) {
            const noteTime = currentTime + i * beatDuration;
            const noteIndex = i % 4;
            playNote(scale[noteIndex] * 0.5, beatDuration * 0.8, noteTime);
        }

        for (let i = 0; i < 8; i++) {
            const noteTime = currentTime + i * beatDuration + beatDuration * 0.5;
            const noteIndex = (i * 2) % scale.length;
            playNote(scale[noteIndex] * 2, beatDuration * 0.6, noteTime);
        }

        for (let i = 0; i < 4; i++) {
            const noteTime = currentTime + i * beatDuration * 2;
            const chordNotes = [
                scale[i % scale.length],
                scale[(i + 2) % scale.length],
                scale[(i + 4) % scale.length]
            ];
            playChord(chordNotes, beatDuration * 1.5, noteTime);
        }

        setTimeout(playMusicLoop, phraseLength * 1000);
    };

    playMusicLoop();
}

function initMinimap() {
    minimapCanvas = document.getElementById('minimapCanvas');
    if (!minimapCanvas) {
        console.warn('Minimap canvas not found, skipping minimap initialization');
        return;
    }
    minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
}

function updateMinimap() {
    if (!minimapCtx) return;

    minimapCtx.clearRect(0, 0, 200, 200);

    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    minimapCtx.fillRect(0, 0, 200, 200);

    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.fillRect(95, 95, 10, 10);

    minimapCtx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        const x = (enemy.position.x / 40) * 100 + 100;
        const z = (enemy.position.z / 40) * 100 + 100;
        if (x >= 0 && x <= 200 && z >= 0 && z <= 200) {
            minimapCtx.fillRect(x - 2, z - 2, 4, 4);
        }
    });

    minimapCtx.fillStyle = '#ffff00';
    powerUps.forEach(powerUp => {
        const x = (powerUp.position.x / 40) * 100 + 100;
        const z = (powerUp.position.z / 40) * 100 + 100;
        if (x >= 0 && x <= 200 && z >= 0 && z <= 200) {
            minimapCtx.fillRect(x - 1, z - 1, 2, 2);
        }
    });
}

function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

function createEngineTrail() {
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
    });

    const trailPoints = [];
    for (let i = 0; i < 30; i++) {
        trailPoints.push(new THREE.Vector3(0, 0, 0));
    }

    trailGeometry.setFromPoints(trailPoints);
    engineTrail = new THREE.Line(trailGeometry, trailMaterial);
    engineTrail.userData = {
        points: trailPoints,
        currentIndex: 0,
        lastPosition: new THREE.Vector3(0, 0, 0),
        isMoving: false
    };

    scene.add(engineTrail);
}

function createEnhancedStarField() {

    for (let layer = 0; layer < 5; layer++) {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = layer === 0 ? 5000 : 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 600;
            positions[i + 1] = (Math.random() - 0.5) * 600;
            positions[i + 2] = (Math.random() - 0.5) * 600;

            const color = new THREE.Color();
            if (layer === 0) {

                color.setHSL(Math.random() * 0.1 + 0.5, 0.3, Math.random() * 0.3 + 0.7);
            } else {

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

    createNebulaClouds();
}

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

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

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

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

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

    const spotLight1 = new THREE.SpotLight(0xffffff, 0.8, 200, Math.PI / 6, 0.3);
    spotLight1.position.set(0, 50, 0);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.castShadow = true;
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    rimLight.position.set(0, 0, -20);
    scene.add(rimLight);
}

function createModernPlayer() {
    const playerGroup = new THREE.Group();

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

    createEngineTrail();
}

function createEnhancedPlayer() {

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

    createEngineExhaust(player);

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

    for (let i = 0; i < particleCount * 3; i += 3) {
        exhaust.userData.velocities[i] = (Math.random() - 0.5) * 0.02;
        exhaust.userData.velocities[i + 1] = -0.05 - Math.random() * 0.02;
        exhaust.userData.velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    ship.add(exhaust);
    ship.userData.exhaust = exhaust;
}

function createEnemy(type = 'basic') {

    const enemyTypes = {
        basic: {
            color: 0x8b0000,
            emissive: 0x440000,
            size: 0.8,
            health: 1,
            speed: 0.02,
            shape: 'fighter'
        },
        fast: {
            color: 0xff4500,
            emissive: 0x662200,
            size: 0.6,
            health: 1,
            speed: 0.04,
            shape: 'interceptor'
        },
        heavy: {
            color: 0x4b0082,
            emissive: 0x220044,
            size: 1.2,
            health: 3,
            speed: 0.015,
            shape: 'bomber'
        },
        boss: {
            color: 0x8b008b,
            emissive: 0x440044,
            size: 2.0,
            health: 10,
            speed: 0.01,
            shape: 'destroyer'
        }
    };

    const config = enemyTypes[type] || enemyTypes.basic;

    const enemy = createModernEnemyShip(config.shape, config);

    enemy.position.set(
        (Math.random() - 0.5) * 50,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 50
    );

    enemy.castShadow = true;
    enemy.receiveShadow = true;

    if (type === 'boss') {

        const bossWingGeometry = new THREE.BoxGeometry(0.3, 0.1, 1.5);
        const bossWingMaterial = new THREE.MeshPhongMaterial({
            color: 0x660066,
            emissive: 0x220022
        });

        const leftWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
        leftWing.position.set(-1.2, 0, 0);
        enemy.add(leftWing);

        const rightWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
        rightWing.position.set(1.2, 0, 0);
        enemy.add(rightWing);

        const bossEngineGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const bossEngineMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0088,
            emissive: 0xff0088,
            transparent: true,
            opacity: 0.8
        });
        const bossEngine = new THREE.Mesh(bossEngineGeometry, bossEngineMaterial);
        bossEngine.position.set(0, -1, 0);
        enemy.add(bossEngine);
    }

    const navLightGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const enemyLightMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000
    });

    const leftLight = new THREE.Mesh(navLightGeometry, enemyLightMaterial);
    leftLight.position.set(-config.size * 0.5, 0, config.size * 0.5);
    enemy.add(leftLight);

    const rightLight = new THREE.Mesh(navLightGeometry, enemyLightMaterial);
    rightLight.position.set(config.size * 0.5, 0, config.size * 0.5);
    enemy.add(rightLight);

    enemy.userData = {
        type: type,
        speed: config.speed,
        health: config.health,
        maxHealth: config.health,
        lastShot: 0,
        shootRate: type === 'boss' ? 500 : 1500,
        rotationSpeed: 0.01 + Math.random() * 0.02
    };

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

function createPowerUp(type) {

    const powerUpTypes = {
        health: { color: 0x00ff00, shape: 'sphere', size: 1.5 },
        weapon: { color: 0x0088ff, shape: 'box', size: 1.2 },
        boost: { color: 0xffff00, shape: 'cone', size: 1.2 },
        shield: { color: 0x00ffff, shape: 'octahedron', size: 1.2 }
    };

    const config = powerUpTypes[type];
    let geometry;

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

    const material = new THREE.MeshPhongMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.9,
        emissive: config.color,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    const powerUp = new THREE.Mesh(geometry, material);

    powerUp.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 20
    );

    powerUp.userData = {
        type: type,
        rotationSpeed: 0.08,
        bobSpeed: 0.005,
        collected: false
    };

    powerUp.castShadow = true;
    powerUp.receiveShadow = true;

    scene.add(powerUp);
    powerUps.push(powerUp);
}

function createBullet(startPos, direction, isPlayerBullet = true, bulletType = 'basic') {

    const bulletTypes = {
        basic: {
            color: 0xffff00,
            size: 0.15,
            speed: 0.4,
            damage: 1,
            shape: 'sphere',
            emissiveIntensity: 0.3,
            trail: false
        },
        rapid: {
            color: 0x00ffff,
            size: 0.12,
            speed: 0.5,
            damage: 1,
            shape: 'sphere',
            emissiveIntensity: 0.4,
            trail: false
        },
        spread: {
            color: 0xff8800,
            size: 0.18,
            speed: 0.3,
            damage: 1,
            shape: 'sphere',
            emissiveIntensity: 0.5,
            trail: false
        },
        laser: {
            color: 0xff0088,
            size: 0.25,
            speed: 0.6,
            damage: 2,
            shape: 'cylinder',
            emissiveIntensity: 0.6,
            trail: true
        },
        plasma: {
            color: 0xff00ff,
            size: 0.3,
            speed: 0.4,
            damage: 3,
            shape: 'octahedron',
            emissiveIntensity: 0.8,
            trail: true
        },
        energy: {
            color: 0x00ff00,
            size: 0.35,
            speed: 0.5,
            damage: 4,
            shape: 'dodecahedron',
            emissiveIntensity: 1.0,
            trail: true
        },
        scatter: {
            color: 0xff8800,
            size: 0.12,
            speed: 0.4,
            damage: 1,
            shape: 'sphere',
            emissiveIntensity: 0.4,
            trail: false
        }
    };

    const config = bulletTypes[bulletType] || bulletTypes.basic;

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

    const particleCount = Math.min(50, Math.max(20, Math.floor(size * 30)));
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        positions[i3] = position.x;
        positions[i3 + 1] = position.y;
        positions[i3 + 2] = position.z;

        const velocityScale = 0.2 * size;
        velocities[i3] = (Math.random() - 0.5) * velocityScale;
        velocities[i3 + 1] = (Math.random() - 0.5) * velocityScale;
        velocities[i3 + 2] = (Math.random() - 0.5) * velocityScale;

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
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geometry, material);
    explosion.userData = {
        velocities: velocities,
        life: 1.0,
        decay: 0.03,
        maxAge: 1000
    };

    scene.add(explosion);
    particles.push(explosion);

    if (particles.length > 20) {
        const oldParticle = particles.shift();
        scene.remove(oldParticle);
        if (oldParticle.geometry) oldParticle.geometry.dispose();
        if (oldParticle.material) oldParticle.material.dispose();
    }
}

function shootScatter() {
    if (gameState.gameOver) return;

    gameState.shotsFired += 8;

    const bulletStart = player.position.clone();
    bulletStart.y += 1;

    const weaponLevel = gameState.weaponLevel || 1;
    let bulletType = 'scatter';

    if (weaponLevel >= 6) bulletType = 'energy';
    else if (weaponLevel >= 5) bulletType = 'plasma';
    else if (weaponLevel >= 4) bulletType = 'laser';
    else if (weaponLevel >= 3) bulletType = 'spread';
    else if (weaponLevel >= 2) bulletType = 'rapid';

    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const direction = new THREE.Vector3(
            Math.sin(angle),
            0,
            Math.cos(angle)
        );

        createBullet(bulletStart, direction, true, bulletType);
    }

    if (sounds.powerUp) sounds.powerUp();
}

function shoot() {
    if (gameState.gameOver) return;

    if (gameState.scatterMode) {
        shootScatter();
        return;
    }

    gameState.shotsFired++;

    const bulletStart = player.position.clone();
    bulletStart.y += 1;

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(player.quaternion);

    const weaponLevel = gameState.weaponLevel || 1;
    let bulletType = 'basic';

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

    const keyupHandler = (event) => {
        keys[event.code] = false;
    };

    const resizeHandler = onWindowResize;

    const clickHandler = (event) => {

        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (event.button === 0) {
            event.preventDefault();
            shoot();
        }
    };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
    window.addEventListener('resize', resizeHandler);
    document.addEventListener('click', clickHandler);

    eventListeners.push(
        { element: document, event: 'keydown', handler: keydownHandler },
        { element: document, event: 'keyup', handler: keyupHandler },
        { element: window, event: 'resize', handler: resizeHandler },
        { element: document, event: 'click', handler: clickHandler }
    );
}

function reloadWeapon() {
    if (gameState.gameOver) return;

    showNotification('Weapon Reloaded!', 2000);
    if (sounds.powerUp) sounds.powerUp();
}

function togglePause() {
    gameState.paused = !gameState.paused;

    if (musicGainNode) {
        if (gameState.paused) {

            musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioContext.currentTime);
            musicGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        } else {

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

        musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioContext.currentTime);
        musicGainNode.gain.exponentialRampToValueAtTime(
            gameSettings.soundEnabled ? 0.2 : 0.001,
            audioContext.currentTime + 0.2
        );
    }

    if (gameSettings.soundEnabled && audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.log('Audio resume failed:', e));
    }

    if (gameSettings.soundEnabled && musicEnabled) {

        musicOscillators.forEach(oscillator => {
            try {
                if (oscillator.state !== 'closed') {
                    oscillator.stop();
                    oscillator.disconnect();
                }
            } catch (e) {

            }
        });
        musicOscillators = [];

        setTimeout(() => {
            startBackgroundMusic();
        }, 300);
    }

    showNotification(gameSettings.soundEnabled ? 'Sound On' : 'Sound Off', 1500);
}

function toggleCameraMode() {
    cameraMode = cameraMode === 'follow' ? 'free' : 'follow';

    if (cameraMode === 'follow') {
        controls.enabled = false;

        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);
        showNotification('Camera: Follow Spaceship', 2000);
    } else {
        controls.enabled = true;

        controls.target.copy(player.position);
        controls.update();
        showNotification('Camera: Free Mode', 2000);
    }
}

function toggleScatterMode() {
    gameState.scatterMode = !gameState.scatterMode;

    if (gameState.scatterMode) {
        showNotification('BURST MODE ACTIVATED - Press SPACE to fire in all directions!', 3000);
    } else {
        showNotification('BURST MODE DEACTIVATED - Normal firing restored', 2000);
    }
}

function showLeaderboard() {

    const scores = JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
    scores.push({
        score: gameState.score,
        level: gameState.level,
        enemiesDestroyed: gameState.enemiesDestroyed,
        accuracy: gameState.shotsFired > 0 ? (gameState.shotsHit / gameState.shotsFired * 100).toFixed(1) : 0,
        date: new Date().toLocaleDateString()
    });

    scores.sort((a, b) => b.score - a.score);
    scores.splice(10);

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

function updateEngineTrail() {
    if (!engineTrail || !player) return;

    const trailData = engineTrail.userData;
    const currentPos = player.position.clone();
    const movement = currentPos.distanceTo(trailData.lastPosition);

    if (movement > 0.01) {
        trailData.isMoving = true;

        const rearPosition = currentPos.clone();
        rearPosition.z += 1.5;

        for (let i = trailData.points.length - 1; i > 0; i--) {
            trailData.points[i].copy(trailData.points[i - 1]);
        }
        trailData.points[0].copy(rearPosition);

        engineTrail.geometry.setFromPoints(trailData.points);

        const intensity = Math.min(1.0, playerSpeed * 15);
        engineTrail.material.opacity = intensity * 0.9;

        if (gameState.boostActive) {
            engineTrail.material.color.setHex(0x00ff00);
        } else {
            engineTrail.material.color.setHex(0xff6600);
        }

        trailData.lastPosition.copy(currentPos);
    } else {

        trailData.isMoving = false;
        engineTrail.material.opacity *= 0.95;
    }
}

function updateCamera() {
    if (cameraMode === 'follow' && player) {

        cameraTarget.copy(player.position).add(cameraOffset);

        camera.position.lerp(cameraTarget, 0.05);

        const lookTarget = player.position.clone();
        lookTarget.y += 2;

        camera.lookAt(lookTarget);
    }
}

function activateBoost() {
    if (gameState.boostActive || gameState.gameOver) return;

    gameState.boostActive = true;
    gameState.boostTime = gameSettings.boostDuration;

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
    const oldPosition = player.position.clone();

    if (keys['KeyW']) player.position.z -= speed;
    if (keys['KeyS']) player.position.z += speed;
    if (keys['KeyA']) player.position.x -= speed;
    if (keys['KeyD']) player.position.x += speed;

    if (keys['KeyQ']) player.position.y += speed;
    if (keys['KeyE']) player.position.y -= speed;

    const movement = player.position.distanceTo(oldPosition);
    playerSpeed = movement;

    player.position.x = Math.max(-25, Math.min(25, player.position.x));
    player.position.z = Math.max(-25, Math.min(25, player.position.z));
    player.position.y = Math.max(-5, Math.min(20, player.position.y));

    if (gameState.boostActive) {
        gameState.boostTime -= 16;
        if (gameState.boostTime <= 0) {
            gameState.boostActive = false;

            player.traverse((child) => {
                if (child.material && child.material.emissive) {

                    if (child.material.color && child.material.color.getHex() === 0x00aaff) {
                        child.material.emissive.setHex(0x002244);
                    } else if (child.material.color && child.material.color.getHex() === 0x0066cc) {
                        child.material.emissive.setHex(0x001133);
                    } else if (child.material.color && child.material.color.getHex() === 0x88ccff) {
                        child.material.emissive.setHex(0x001122);
                    } else {
                        child.material.emissive.setHex(0x000000);
                    }
                }
            });
        }
    }

    if (gameState.invulnerable) {
        gameState.invulnerableTime -= 16;
        if (gameState.invulnerableTime <= 0) {
            gameState.invulnerable = false;

            player.traverse((child) => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = 1;
                }
            });
            removeShieldEffect();
        } else {

            if (shieldEffect) {
                shieldEffect.position.copy(player.position);
                shieldEffect.rotation.y += 0.05;
            }

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

    const spawnRate = Math.max(500, gameSettings.enemySpawnRate - (gameState.level * 100));
    if (currentTime - gameState.lastEnemySpawn > spawnRate && enemies.length < gameSettings.maxEnemies) {
        const enemyTypes = ['basic', 'fast', 'heavy'];
        if (gameState.level > 3) enemyTypes.push('boss');

        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        createEnemy(randomType);
        gameState.lastEnemySpawn = currentTime;
    }

    enemies.forEach((enemy, index) => {

        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position);
        direction.normalize();
        direction.multiplyScalar(enemy.userData.speed);

        enemy.position.add(direction);

        enemy.rotation.y += 0.02;

        if (currentTime - enemy.userData.lastShot > enemy.userData.shootRate) {
            const bulletStart = enemy.position.clone();
            bulletStart.y -= 1;

            const shootDirection = new THREE.Vector3();
            shootDirection.subVectors(player.position, enemy.position);
            shootDirection.normalize();

            createBullet(bulletStart, shootDirection, false);
            enemy.userData.lastShot = currentTime;
        }

        const enemySize = enemy.userData.type === 'boss' ? 3.0 :
                         enemy.userData.type === 'heavy' ? 2.0 :
                         enemy.userData.type === 'fast' ? 1.2 : 1.5;
        const collisionDistance = enemySize + 1.0;

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

    if (currentTime - gameState.lastPowerUpSpawn > gameSettings.powerUpSpawnRate && powerUps.length < gameSettings.maxPowerUps) {
        const powerUpTypes = ['health', 'weapon', 'boost', 'shield'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        createPowerUp(randomType);
        gameState.lastPowerUpSpawn = currentTime;
    }

    powerUps.forEach((powerUp, index) => {

        powerUp.rotation.y += powerUp.userData.rotationSpeed;
        powerUp.rotation.x += powerUp.userData.rotationSpeed * 0.5;

        powerUp.position.y += Math.sin(Date.now() * powerUp.userData.bobSpeed) * 0.01;

        if (powerUp.position.distanceTo(player.position) < 1.5) {
            collectPowerUp(powerUp.userData.type);
            scene.remove(powerUp);
            powerUps.splice(index, 1);
        }

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
            showNotification('Health Restored!', 2000);
            break;
        case 'weapon':

            gameState.weaponLevel = (gameState.weaponLevel || 1) + 1;
            const maxLevel = 6;
            if (gameState.weaponLevel > maxLevel) gameState.weaponLevel = maxLevel;

            const levelNames = ['Basic', 'Enhanced', 'Advanced', 'Laser', 'Plasma', 'Energy'];
            const levelName = levelNames[gameState.weaponLevel - 1] || 'Unknown';
            showNotification(`Weapon Upgraded: ${levelName} Level ${gameState.weaponLevel}!`, 2000);

            triggerScreenFlash(255, 215, 0, 0.6, 400);
            break;
        case 'boost':
            activateBoost();
            showNotification('Speed Boost Activated!', 2000);
            break;
        case 'shield':
            gameState.invulnerable = true;
            gameState.invulnerableTime = gameSettings.invulnerableDuration;
            showNotification('Shield Activated!', 2000);

            addShieldEffect();
            break;
    }

    if (sounds.powerUp) sounds.powerUp();

}

function addShieldEffect() {

    if (shieldEffect) {
        scene.remove(shieldEffect);
    }

    const shieldGeometry = new THREE.SphereGeometry(3.0, 32, 32);
    const shieldMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.4,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        wireframe: false
    });

    shieldEffect = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldEffect.position.copy(player.position);

    shieldEffect.userData.radius = 3.0;
    shieldEffect.userData.baseOpacity = 0.4;
    shieldEffect.userData.baseEmissiveIntensity = 0.5;

    scene.add(shieldEffect);

}

function removeShieldEffect() {
    if (shieldEffect) {
        scene.remove(shieldEffect);

        if (shieldEffect.geometry) {
            shieldEffect.geometry.dispose();
        }
        if (shieldEffect.material) {
            shieldEffect.material.dispose();
        }
        shieldEffect = null;
    }
}

function shieldHitEffect(hitPosition) {

    if (shieldEffect && shieldEffect.material) {

        shieldEffect.material.opacity = 0.8;
        shieldEffect.material.emissiveIntensity = 1.5;

        setTimeout(() => {
            if (shieldEffect && shieldEffect.material) {
                shieldEffect.material.opacity = shieldEffect.userData.baseOpacity;
                shieldEffect.material.emissiveIntensity = shieldEffect.userData.baseEmissiveIntensity;
            }
        }, 100);
    }

    createExplosion(hitPosition, 0.5);

    if (sounds.hit) sounds.hit();
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

    bullets.forEach((bullet, index) => {

        let hitEnemy = false;
        let hitEnemyIndex = -1;

        enemies.forEach((enemy, enemyIndex) => {

            const enemySize = enemy.userData.type === 'boss' ? 5.0 :
                             enemy.userData.type === 'heavy' ? 3.5 :
                             enemy.userData.type === 'fast' ? 1.5 : 2.0;
            const collisionDistance = enemySize + 1.0;

            if (bullet.position.distanceTo(enemy.position) < collisionDistance) {
                hitEnemy = true;
                hitEnemyIndex = enemyIndex;
            }
        });

        if (!hitEnemy) {
            bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed));
        } else {

            const enemy = enemies[hitEnemyIndex];

            const damage = bullet.userData.damage || 1;
            enemy.userData.health -= damage;

            if (enemy.userData.health <= 0) {

                createExplosion(enemy.position, 1.5);
                scene.remove(enemy);
                enemies.splice(hitEnemyIndex, 1);

                gameState.enemiesDestroyed++;
                gameState.shotsHit++;

                const currentTime = Date.now();
                if (currentTime - gameState.lastHitTime <= gameState.comboTime) {
                    gameState.comboMultiplier = Math.min(gameState.comboMultiplier + 0.5, 5.0);
                } else {
                    gameState.comboMultiplier = 1.0;
                }
                gameState.lastHitTime = currentTime;

                const scores = { basic: 10, fast: 15, heavy: 25, boss: 100 };
                const baseScore = (scores[enemy.userData.type] || 10) * damage;
                const comboScore = Math.floor(baseScore * gameState.comboMultiplier);
                gameState.score += comboScore;

                if (gameState.score > gameState.level * 500) {
                    gameState.level++;
                }
            }

            if (bullet.userData.trail) {
                scene.remove(bullet.userData.trail);
                if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
                if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
            }
            scene.remove(bullet);
            bullets.splice(index, 1);
        }

        if (bullet.userData.trail) {
            bullet.userData.trail.position.copy(bullet.position);
            bullet.userData.trail.lookAt(bullet.position.clone().add(bullet.userData.direction));
        }

        if (bullet.position.distanceTo(player.position) > 60) {

            if (bullet.userData.trail) {
                scene.remove(bullet.userData.trail);
                if (bullet.userData.trail.geometry) bullet.userData.trail.geometry.dispose();
                if (bullet.userData.trail.material) bullet.userData.trail.material.dispose();
            }
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];

        if (gameState.invulnerable && shieldEffect) {
            const shieldRadius = shieldEffect.userData.radius;
            const distanceToPlayer = bullet.position.distanceTo(player.position);

            if (distanceToPlayer < shieldRadius) {

                shieldHitEffect(bullet.position.clone());
                scene.remove(bullet);
                enemyBullets.splice(i, 1);
                continue;
            }
        }

        const playerSize = 1.5;
        const bulletSize = 0.5;
        const playerCollisionDistance = playerSize + bulletSize;

        if (bullet.position.distanceTo(player.position) < playerCollisionDistance && !gameState.invulnerable) {

            scene.remove(bullet);
            enemyBullets.splice(i, 1);
            takeDamage(5);
            continue;
        }

        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed));

        if (bullet.position.distanceTo(player.position) > 60) {
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
        }
    }
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

        if (particle.userData.life <= 0 || particle.userData.maxAge <= 0) {
            scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
            particles.splice(index, 1);
        } else {

            particle.userData.maxAge -= 16;
        }
    });

    if (player && player.userData.exhaust) {
        const exhaust = player.userData.exhaust;
        const positions = exhaust.geometry.attributes.position.array;
        const velocities = exhaust.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

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

    const comboElement = document.getElementById('combo');
    if (comboElement) {
        comboElement.textContent = `Combo: ${gameState.comboMultiplier.toFixed(1)}x`;

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

    document.getElementById('health').textContent = `Health: ${gameState.health}`;
    const healthFill = document.getElementById('healthFill');
    if (healthFill) {
        const healthPercent = (gameState.health / gameState.maxHealth) * 100;
        healthFill.style.width = `${healthPercent}%`;
    }

    const levelFill = document.getElementById('levelFill');
    if (levelFill) {
        const levelProgress = (gameState.score % 500) / 500 * 100;
        levelFill.style.width = `${levelProgress}%`;
    }

    const weaponLevel = gameState.weaponLevel || 1;
    const levelNames = ['Basic', 'Enhanced', 'Advanced', 'Laser', 'Plasma', 'Energy'];
    const levelName = levelNames[weaponLevel - 1] || 'Unknown';
    document.getElementById('weaponLevel').textContent = `Weapon: ${levelName} Lv.${weaponLevel}`;
}

function gameOver() {
    gameState.gameOver = true;

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('enemiesDestroyed').textContent = gameState.enemiesDestroyed;

    const accuracy = gameState.shotsFired > 0 ? (gameState.shotsHit / gameState.shotsFired * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';

    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    gameTimers.forEach(timer => clearTimeout(timer));
    gameTimers = [];

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
        scatterMode: false,
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

    enemies.forEach(enemy => {
        scene.remove(enemy);

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

    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];

    if (shieldEffect) {
        scene.remove(shieldEffect);
        if (shieldEffect.geometry) shieldEffect.geometry.dispose();
        if (shieldEffect.material) shieldEffect.material.dispose();
        shieldEffect = null;
    }

    player.position.set(0, 0, 0);

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

    document.getElementById('gameOver').style.display = 'none';

    updateUI();

    gameLoop();
}

function gameLoop() {
    try {

        if (!gameState.gameOver && !gameState.paused) {

            updatePlayer();
            updateEnemies();
            updatePowerUps();
            updateBullets();
            updateParticles();
            updateCombo();
            updateUI();
            updateMinimap();
            updateCamera();
            updateEngineTrail();
            updateLowHealthFlash();

            scene.children.forEach(child => {
                if (child.userData && child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                }
            });
        }

        if (cameraMode === 'free') {
            controls.update();
        }

        renderer.render(scene, camera);

        animationId = requestAnimationFrame(gameLoop);

    } catch (error) {

        console.error('Game loop error:', error);

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

window.restartGame = restartGame;

window.testRestart = function() {
    alert('Restart button is working!');
};

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

function changeMap(mapType) {
    if (!mapConfigs[mapType]) return;

    gameState.currentMap = mapType;

    document.getElementById('currentMap').textContent = `Map: ${mapConfigs[mapType].name}`;

    document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-map="${mapType}"]`).classList.add('active');

    scene.background = new THREE.Color(mapConfigs[mapType].background.color);

    updateStarField(mapConfigs[mapType]);

    updateLighting(mapConfigs[mapType]);

    enemies.forEach(enemy => scene.remove(enemy));
    enemies.length = 0;

    showNotification(`Map changed to ${mapConfigs[mapType].name}!`);
}

function updateStarField(config) {

    const existingStars = scene.children.filter(child => child.userData.isStarField);
    existingStars.forEach(star => scene.remove(star));

    createEnhancedStarField(config.starField.count, config.starField.color);
}

function updateLighting(config) {

    const ambientLight = scene.children.find(child => child.type === 'AmbientLight');
    if (ambientLight) {
        ambientLight.color.setHex(config.ambientLight);
    }
}

function createEnhancedStarField(count = 1000, starColor = 0xffffff) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        positions[i3] = (Math.random() - 0.5) * 200;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
        positions[i3 + 2] = (Math.random() - 0.5) * 200;

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

function cleanupGame() {

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    gameTimers.forEach(timer => clearTimeout(timer));
    gameTimers = [];

    eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    eventListeners = [];

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

    if (renderer) {
        renderer.dispose();
    }

    if (controls) {
        controls.dispose();
    }

    musicOscillators.forEach(oscillator => {
        try {
            if (oscillator.state !== 'closed') {
                oscillator.stop();
                oscillator.disconnect();
            }
        } catch (e) {

            console.log('Oscillator cleanup warning:', e.message);
        }
    });
    musicOscillators = [];

    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
}

function debugCollisionAreas() {
    enemies.forEach((enemy, index) => {
        const enemySize = enemy.userData.type === 'boss' ? 5.0 :
                         enemy.userData.type === 'heavy' ? 3.5 :
                         enemy.userData.type === 'fast' ? 1.5 : 2.0;
        const collisionDistance = enemySize + 1.0;

        console.log(`Enemy ${index} (${enemy.userData.type}): Size=${enemySize}, Collision=${collisionDistance}`);

        const sphereGeometry = new THREE.SphereGeometry(collisionDistance, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const collisionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        collisionSphere.position.copy(enemy.position);
        scene.add(collisionSphere);

        setTimeout(() => {
            scene.remove(collisionSphere);
            sphereGeometry.dispose();
            sphereMaterial.dispose();
        }, 3000);
    });
}

function initRedFlash() {
    redFlashElement = document.getElementById('redFlash');
    if (!redFlashElement) {
        console.warn('Red flash element not found');
    }
}

function updateLowHealthFlash() {
    if (!redFlashElement) return;

    const healthPercentage = gameState.health / gameState.maxHealth;
    const lowHealthThreshold = 0.1;

    if (healthPercentage <= lowHealthThreshold && !lowHealthFlashActive) {

        lowHealthFlashActive = true;
        lowHealthFlashInterval = setInterval(() => {
            const currentHealthPercentage = gameState.health / gameState.maxHealth;

            if (currentHealthPercentage > lowHealthThreshold || gameState.gameOver) {
                clearInterval(lowHealthFlashInterval);
                lowHealthFlashActive = false;
                redFlashElement.style.backgroundColor = 'rgba(255, 0, 0, 0)';
                return;
            }

            const pulseIntensity = 0.15 + 0.25 * Math.sin(Date.now() * 0.008);
            redFlashElement.style.backgroundColor = `rgba(255, 0, 0, ${pulseIntensity})`;
        }, 50);
    }
}

function triggerScreenFlash(r, g, b, intensity = 0.5, duration = 300) {
    if (!redFlashElement) return;

    redFlashElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${intensity})`;

    setTimeout(() => {
        if (redFlashElement) {
            redFlashElement.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        }
    }, duration);
}
