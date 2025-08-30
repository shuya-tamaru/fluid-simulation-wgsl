# WGSL Template

A minimal WebGPU + TypeScript + Vite template with OrbitCamera controls and proper setup.

**Features:**

- Vite + TypeScript
- WebGPU initialization (`adapter`/`device`/`context`)
- OrbitCamera with mouse & wheel controls (orbit, pan, zoom)
- Resize handling with `devicePixelRatio` support
- Performance monitoring with Stats.js
- Clean folder structure and coding conventions

---

## 1) Project Structure

```
wgsl-template/
├─ docs/
├─ public/
├─ src/
│  ├─ main.ts                 # Entry point (imports bootstrap)
│  ├─ style.css               # Global styles
│  ├─ vite-env.d.ts           # Vite types + WGSL module declaration
│  ├─ app/
│  │  ├─ bootstrap.ts         # Initialization logic
│  │  └─ resize.ts            # Resize handling
│  ├─ core/
│  │  ├─ Device.ts            # WebGPU device/context setup
│  │  ├─ Renderer.ts          # Main rendering orchestration
│  │  └─ OrbitCamera.ts       # Mouse/wheel camera controls
│  ├─ gfx/
│  │  └─ createCubeGeometry.ts # Cube vertex/index buffer creation
│  ├─ shaders/
│  │  └─ cube.wgsl            # Vertex/fragment shader
│  ├─ utils/
│  │  └─ TransformSystem.ts   # Matrix uniform management
│  └─ types/
│     └─ wgsl.d.ts            # WGSL file type declarations
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts             # rollup-plugin-string for .wgsl files
└─ README.md
```

**Key Principles:**

- **Separation of concerns**: Each directory has a specific purpose
- **Minimal main.ts**: Only imports and calls bootstrap
- **Clean initialization**: Device setup → Renderer → Loop
- **Type safety**: Full TypeScript support including WGSL imports

---

## 2) Dependencies

```json
{
  "devDependencies": {
    "@types/stats.js": "^0.17.4",
    "@webgpu/types": "^0.1.64",
    "typescript": "~5.8.3",
    "vite": "^7.1.2"
  },
  "dependencies": {
    "gl-matrix": "^3.4.4",
    "rollup-plugin-string": "^3.0.0",
    "stats.js": "^0.17.0"
  }
}
```

**Key dependencies:**

- `@webgpu/types`: WebGPU type definitions
- `gl-matrix`: Matrix math utilities
- `rollup-plugin-string`: Import .wgsl files as strings
- `stats.js`: FPS/performance monitoring

---

## 3) Initialization Flow

1. `main.ts` → calls `bootstrap()`
2. `bootstrap()` → `Device.init()` → creates `Renderer`
3. `Renderer.init()` sets up:
   - `OrbitCamera` with canvas event handling
   - Cube geometry/pipeline/bind groups
   - Depth texture
4. `requestAnimationFrame(loop)` starts
5. `resize.ts` handles canvas/depth texture recreation

---

## 4) Core Classes

### Device.ts

- WebGPU adapter/device initialization
- Canvas context configuration
- Error handling for unsupported browsers

### Renderer.ts

- **Responsibilities:**
  - Resource initialization (buffers, pipelines, textures)
  - Frame updates (camera, transforms)
  - Command encoding and submission
  - Resize handling
- **Key methods:**
  - `init()`: One-time setup
  - `update(dt)`: Per-frame logic
  - `render()`: Command encoding
  - `onResize(w, h)`: Handle size changes

### OrbitCamera.ts

- **Controls:**
  - Left drag: Orbit around target
  - Right drag (or Shift+left): Pan
  - Wheel: Zoom in/out
- **Features:**
  - Configurable sensitivity and limits
  - Smooth phi clamping to avoid gimbal lock
  - Returns view matrix for rendering

### TransformSystem.ts

- Manages model/view/projection matrices
- Handles uniform buffer creation and updates
- Provides convenient matrix setters

---

## 5) WGSL Shader Structure

**Current binding layout:**

```wgsl
struct Matrices {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  proj: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> matrices: Matrices;

struct VSIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
}
```

**Vertex Layout:**

- `@location(0)`: position (vec3<f32>)
- `@location(1)`: normal (vec3<f32>)

---

## 6) Resize Strategy

- `canvas.width = clientWidth * devicePixelRatio`
- `canvas.height = clientHeight * devicePixelRatio`
- `context.configure({ device, format, alphaMode: 'opaque' })` on resize
- Depth texture recreation with new dimensions
- Projection matrix update for new aspect ratio
- OrbitCamera FOV sync for proper pan scaling

---

## 7) File Import Configuration

**vite.config.ts:**

```ts
import { string } from "rollup-plugin-string";

export default defineConfig({
  plugins: [
    string({
      include: "**/*.wgsl",
    }),
  ],
});
```

**vite-env.d.ts:**

```ts
declare module "*.wgsl" {
  const content: string;
  export default content;
}
```

This allows importing WGSL files directly:

```ts
import cubeShader from "../shaders/cube.wgsl";
```

---

## 8) Coding Conventions

**File naming:**

- `PascalCase.ts`: Classes (`Renderer.ts`, `Device.ts`)
- `camelCase.ts`: Utilities (`bootstrap.ts`, `resize.ts`)
- `snake_case.wgsl`: Shaders

**Function naming:**

- Start with verbs: `createCubeGeometry`, `attachResize`
- Descriptive: `sizeCanvas`, `bootstrap`

**Organization:**

- Keep `main.ts` minimal (< 10 lines)
- Single responsibility per file
- Group related functionality in directories

---

## 9) Common Pitfalls

- **Missing `getPreferredCanvasFormat()`** → Format mismatch
- **No DPR handling** → Blurry on high-DPI displays
- **Forgetting depth texture resize** → Z-fighting after resize
- **Matrix alignment issues** → Use `std140` layout in WGSL
- **Missing `@webgpu/types`** → TypeScript errors

---

## 10) Getting Started

```bash
git clone <this-template> my-webgpu-project
cd my-webgpu-project
npm install
npm run dev
```

**To extend:**

1. Add new geometry in `src/gfx/`
2. Create new shaders in `src/shaders/`
3. Extend `Renderer` with new pipelines
4. Add new uniform data to `TransformSystem`

---

## 11) Example: Adding New Geometry

1. **Create geometry function** in `src/gfx/createTriangleGeometry.ts`:

```ts
export function createTriangleGeometry(device: GPUDevice) {
  // vertex data, buffer creation, layout
  return { vertexBuffer, indexBuffer, indexCount, layout };
}
```

2. **Create shader** in `src/shaders/triangle.wgsl`:

```wgsl
// vertex and fragment shaders
```

3. **Extend Renderer** to include new pipeline and draw calls

---

This template provides a solid foundation for WebGPU projects with proper TypeScript integration, modern tooling, and clean architecture.
