# WebGPU Fluid Simulation

> **English** | **[日本語](docs/js/README.md)**

A real-time SPH (Smoothed Particle Hydrodynamics) fluid simulation using WebGPU and WGSL (WebGPU Shading Language).

## 🚀 Live Demo & Video

<div align="center">

### [🌊 **Try Live Demo**](https://sph-wgsl.vercel.app/) | [📺 **Watch Video**](https://youtu.be/hxalb1aCo4g)

[![Interactive Demo](https://img.shields.io/badge/🌊_Live_Demo-Interactive-4285f4?style=for-the-badge&logo=webcomponents&logoColor=white)](https://sph-wgsl.vercel.app/)
[![YouTube Demo](https://img.shields.io/badge/📺_YouTube-Watch_Demo-red?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/hxalb1aCo4g)

[![Demo Preview](https://img.youtube.com/vi/hxalb1aCo4g/maxresdefault.jpg)](https://youtu.be/hxalb1aCo4g)

_Click the image above to watch the full demonstration_

</div>

## Features

- **WebGPU**: High-performance parallel computing using the latest graphics API
- **SPH Method**: Particle-based fluid simulation technique
- **Real-time**: Interactive 3D fluid simulation
- **WGSL**: Compute shader implementation using WebGPU's dedicated shader language

## Simulation Components

### Physics Calculations

- **Density Calculation**: Density computation based on neighboring particles
- **Pressure Calculation**: Pressure derivation using equation of state
- **Pressure Force**: Inter-particle interactions due to pressure gradients
- **Viscosity Force**: Fluid viscosity effects
- **Gravity**: Gravitational acceleration
- **Integration**: Numerical integration of equations of motion

### Optimization Techniques

- **Spatial Hash Grid**: Efficient neighbor search algorithm
- **Particle Reordering**: Memory access optimization
- **Ping-Pong Buffers**: Efficient data updates on GPU

## Tech Stack

- **WebGPU**: Graphics and compute API
- **WGSL**: Shader language
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **lil-gui**: Real-time parameter adjustment UI

## Setup

### Requirements

- Node.js 16+
- WebGPU-compatible browser (Chrome 113+, Edge 113+, etc.)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── compute/sph/          # SPH computation logic
│   ├── Density.ts        # Density calculation
│   ├── Pressure.ts       # Pressure calculation
│   ├── PressureForce.ts  # Pressure gradient force
│   ├── Viscosity.ts      # Viscosity force
│   ├── Gravity.ts        # Gravity
│   ├── Integrate.ts      # Equation of motion integration
│   └── SphSimulator.ts   # Main simulator
├── core/                 # Core systems
│   ├── Device.ts         # WebGPU device management
│   ├── Renderer.ts       # Rendering engine
│   └── OrbitCamera.ts    # Camera controls
├── gfx/                  # Graphics
│   ├── Particles.ts      # Particle rendering
│   └── WireBox.ts        # Boundary box display
├── shaders/              # WGSL shaders
│   ├── density.wgsl      # Density calculation shader
│   ├── pressure.wgsl     # Pressure calculation shader
│   └── ...               # Other compute shaders
└── utils/                # Utilities
    ├── FluidGui.ts       # Parameter UI
    └── TimeStep.ts       # Time management
```

## Usage

1. Open the application in a browser
2. Adjust parameters using the GUI panel in the top-right corner:
   - Particle count
   - Fluid density
   - Viscosity coefficient
   - Pressure coefficient
   - Boundary size
3. Observe the real-time fluid simulation

## Performance

- **Particle Count**: Supports up to 10,000 particles
- **Frame Rate**: 60fps (environment dependent)
- **Parallel Processing**: Large-scale parallel computation on GPU

## License

This project is released under the MIT License.

---

**Note**: This application uses WebGPU and requires a compatible browser to run.
