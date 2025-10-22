# NEXUS STRIKE - Advanced 3D Space Shooter

<div align="center">
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</div>

A professional-grade 3D space shooter game built with Three.js, featuring advanced graphics, dynamic gameplay, and multiple environments. This project demonstrates proficiency in WebGL programming, 3D mathematics, and modern web development techniques.

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

## Deployment

### GitHub Pages (Recommended)
1. Push your code to a GitHub repository
2. Go to repository **Settings** → **Pages**
3. Select **Deploy from a branch** → **main** → **/ (root)**
4. Your game will be live at `https://yourusername.github.io/repository-name/`

### Other Hosting Options
- **Netlify** - Drag & drop deployment
- **Vercel** - Automatic deployments from GitHub
- **Surge.sh** - Simple command-line deployment

## Technologies Used

### Core Technologies
- **Three.js** - 3D graphics library and WebGL abstraction
- **WebGL** - Hardware-accelerated 3D rendering
- **JavaScript ES6+** - Modern JavaScript features
- **HTML5 Canvas** - Rendering surface
- **CSS3** - Styling, animations, and responsive design

### Advanced Features
- **OrbitControls** - Camera manipulation
- **Web Audio API** - Sound effects and audio management
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

3. **Game Development**
   - Game loop architecture
   - State management
   - User input handling
   - Memory management

4. **Web Development**
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
- [MDN Web Docs](https://developer.mozilla.org/) - Excellent documentation

## Contact

**Avanith Kanamarlapudi** - [GitHub](https://github.com/avanithkanamarlapudi)

---

<div align="center">
  <p>Star this repository if you found it helpful!</p>
  <p>Made with Three.js and modern web technologies</p>
</div>