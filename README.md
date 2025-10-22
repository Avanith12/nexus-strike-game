# NEXUS STRIKE - Advanced 3D Space Shooter

<div align="center">
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</div>

A professional-grade 3D space shooter game built with Three.js, featuring advanced graphics, dynamic gameplay, and multiple environments. This project demonstrates proficiency in WebGL programming, 3D mathematics, and modern web development techniques.

## 🎮 Play the Game

**[PLAY NEXUS STRIKE NOW](https://avanith12.github.io/nexus-strike-game/)**

### Device Compatibility
-  **Desktop/Laptop** - Fully optimized and tested
-  **Mobile/Tablet** - Currently in development (touch controls coming soon)

*The game is currently optimized for desktop and laptop computers with keyboard and mouse controls. Mobile support with touch controls is planned for future updates.*

## Features

### Core Gameplay
- **Multi-environment gameplay** with 4 unique maps (Space Station, Asteroid Field, Nebula, 3D Geometric)
- **Dynamic enemy AI** with different behavior patterns and boss battles
- **Power-up system** with weapon upgrades, shields, and health boosts
- **Progressive difficulty** scaling with combo multipliers
- **Real-time statistics** tracking (accuracy, enemies destroyed, score)

### Technical Features
- **Advanced particle systems** for explosions, engine exhaust, and environmental effects
- **Dynamic lighting** with real-time shadows and multiple light sources
- **Procedural starfield** generation with map-specific styling
- **Memory management** with proper Three.js object disposal
- **Error handling** with graceful recovery mechanisms
- **Performance optimization** with efficient rendering techniques

### Controls
- **WASD** - Ship movement (including vertical movement)
- **SPACE** - Shoot
- **SHIFT** - Boost
- **MOUSE** - Camera control (free mode)
- **C** - Toggle camera mode (follow/free)
- **P** - Pause game
- **M** - Toggle sound
- **R** - Reload weapon

## Game Assets

### 3D Ship Models
- **Modern Player Ship** - Sleek futuristic fighter with:
  - Detailed fuselage with cockpit dome
  - Swept-back wings with navigation lights
  - Visible missile launchers
  - Multiple engine exhaust ports
  - Professional materials with emissive properties

- **Enemy Ship Variants**:
  - **Fighter** - Aggressive angular design with weapon pods
  - **Interceptor** - Sleek fast design with swept wings
  - **Bomber** - Heavy intimidating design with multiple engines
  - **Destroyer** - Massive boss ship with command bridge

### Visual Effects
- **Particle Systems** - Engine exhaust, explosions, and environmental effects
- **Dynamic Lighting** - Real-time shadows and multiple light sources
- **Shield Effects** - Cyan wireframe sphere around player
- **Boost Effects** - Green emissive glow during speed boost
- **Power-up Visuals** - Distinctive shapes and colors for each type

### Audio Assets
- **Procedural Music** - Real-time generated background music
- **Cinematic Story Music** - Atmospheric intro soundtrack
- **Sound Effects** - Shooting, explosions, power-ups (all procedurally generated)
- **Dynamic Audio** - Music tempo and scale changes based on level

## Game Features

### Story & Immersion
- **Cinematic Introduction** - Engaging story sequence before gameplay
- **Professional UI** - Clean, modern interface with gaming fonts
- **Map Selection** - Toggle between 4 unique environments
- **Real-time Minimap** - Top-down view of battlefield

### Power-up System
- **Health Pack** - Restores player health
- **Weapon Upgrade** - Enhances bullet damage and appearance
- **Speed Boost** - Temporary speed increase with visual effects
- **Shield** - Invulnerability with protective sphere effect

### Advanced Gameplay
- **Combo System** - Multiplier bonuses for consecutive hits
- **Leaderboard** - Persistent high score tracking
- **Statistics Tracking** - Accuracy, enemies destroyed, level progression
- **Pause/Resume** - Smooth game state management

## Development Status

🚧 **This project is actively under development!** 

I'm continuously working on adding new features, improving gameplay, and enhancing the overall experience. Some upcoming features I'm planning include:

- **New enemy types** with unique behaviors and designs
- **Additional power-ups** and weapon systems
- **More environments** and map variations
- **Enhanced visual effects** and particle systems
- **Improved audio** with more dynamic music variations
- **Performance optimizations** for better gameplay
- **Mobile support** for touch controls

**Stay tuned for updates!** ⭐

## Quick Start

### Development Server

**Option 1: VS Code Live Server (Recommended)**
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The game will open in your browser automatically

**Option 2: Command Line**
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000/index.html` in your browser.

## Technologies Used

### Core Technologies
- **Three.js** - 3D graphics library and WebGL abstraction
- **WebGL** - Hardware-accelerated 3D rendering
- **JavaScript ES6+** - Modern JavaScript features
- **HTML5 Canvas** - Rendering surface
- **CSS3** - Styling, animations, and responsive design

### Advanced Features
- **OrbitControls** - Camera manipulation
- **Web Audio API** - Procedural sound synthesis and dynamic music
- **Procedural Audio System** - Real-time generated soundtracks and effects
- **Dynamic Music** - Level-based tempo and scale changes
- **localStorage** - Leaderboard persistence
- **RequestAnimationFrame** - Smooth game loop
- **BufferGeometry** - Efficient particle rendering

## Performance Optimizations

- **Frustum culling** for optimal rendering
- **Object pooling** for bullets and particles
- **Memory management** with proper cleanup
- **Efficient collision detection** algorithms
- **Optimized CSS** with reduced backdrop filters
- **Error recovery** mechanisms for stability

## Browser Compatibility

| Browser | WebGL Support | Performance |
|---------|---------------|-------------|
| Chrome  | Full          | Excellent   |
| Firefox | Full          | Excellent   |
| Safari  | Full          | Good        |
| Edge    | Full          | Excellent   |

## Project Structure

```
Graphics/
├── index.html              # Main application entry point
├── space-shooter.js        # Core game logic and Three.js implementation
├── favicon.png             # Custom favicon
├── package.json            # Project dependencies and scripts
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

## Audio System

### Procedural Sound Generation
This game features a **completely original audio system** built from scratch using the **Web Audio API**:

- **No external audio files** - All sounds are generated procedurally
- **Real-time synthesis** - Sawtooth wave oscillators create retro sci-fi sounds
- **Dynamic music** - Tempo and musical scales change based on game level
- **Multi-layered composition** - Bass, melody, and harmony generated algorithmically

### Music System Features
- **6 Musical Scales** - Each level has its own key signature and mood
- **Dynamic Tempo** - BPM increases from 120 to 220 as you level up
- **Procedural Generation** - Music composed in real-time using mathematical algorithms
- **Volume Control** - Background music at optimal volume levels
- **Mute Toggle** - Press "M" to toggle all audio

### Sound Effects
- **Shooting sounds** - Generated sawtooth waves with envelope shaping
- **Explosion effects** - Noise synthesis with frequency sweeps
- **Power-up sounds** - Ascending frequency patterns
- **All procedural** - No pre-recorded audio files required

## Key Learning Outcomes

This project demonstrates expertise in:

1. **3D Mathematics**
   - Vector operations and transformations
   - Matrix calculations and quaternions
   - Collision detection algorithms
   - Camera controls and projections

2. **WebGL Programming**
   - Three.js scene management
   - Material and lighting systems
   - Particle system implementation
   - Performance optimization techniques

3. **Audio Programming**
   - Web Audio API implementation
   - Procedural sound synthesis
   - Musical theory application
   - Real-time audio generation

4. **Game Development**
   - Game loop architecture
   - State management
   - User input handling
   - Memory management

5. **Web Development**
   - Modern JavaScript (ES6+)
   - CSS3 animations and transitions
   - Responsive design principles
   - Cross-browser compatibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) - Amazing 3D library
- [WebGL](https://www.khronos.org/webgl/) - Web graphics standard
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Browser audio synthesis
- [MDN Web Docs](https://developer.mozilla.org/) - Excellent documentation
- [Google Fonts](https://fonts.google.com/) - Orbitron and Rajdhani fonts for gaming aesthetics
- [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) - Development server extension
- [GitHub](https://github.com/) - Version control and project hosting
- [MIT License](https://opensource.org/licenses/MIT) - Open source licensing

## Contact

**Avanith Kanamarlapudi** - [GitHub](https://github.com/Avanith12)

---

<div align="center">
  <p>Star this repository if you found it helpful!</p>
  <p>Made with Three.js and modern web technologies</p>
</div>