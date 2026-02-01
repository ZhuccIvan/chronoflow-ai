# ChronoFlow AI

<div align="center">
  <h3>A web application that generates stunning dynamic sequence diagrams</h3>
  <p>Generate cool tech-style dynamic sequence diagrams with AI support</p>

  <a href="https://zcc123.com/chronoflow-ai/" target="_blank">
    <img src="https://img.shields.io/badge/🌐-Online%20Demo-blue?style=for-the-badge" alt="Online Demo">
  </a>
  <a href="https://zcc123.com/chronoflow-ai/" target="_blank">
    <strong>Try it online →</strong>
  </a>

  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a>
</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Target Users](#target-users)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ChronoFlow AI is an innovative web application designed for product managers and short video creators. It allows users to generate stunning, dynamic sequence diagrams with just a few clicks.

**Core Value:** Simply upload a sequence diagram image or describe it in natural language, and AI will automatically generate a cool tech-style dynamic sequence diagram. The diagram supports step-by-step interactive display with arrow animations, flowing light points, and particle effects.

**Chinese Version:** [中文文档](./README_ZH.md)

---

## Target Users

### Product Managers
- **Pain Point:** Traditional sequence diagram tools (ProcessOn, Draw.io) are cumbersome to use, and the resulting diagrams lack visual impact for presentations.
- **Solution:** Quickly generate visually appealing dynamic diagrams that capture attention during requirement reviews.

### Short Video Creators
- **Pain Point:** Lack professional animation skills but want to showcase dynamic process steps.
- **Solution:** Generate animated sequence diagrams that can be screen-recorded directly into video materials.

---

## Features

### Core Features

- **🔑 API Key Configuration** - Enter your Gemini API key in the top bar, saved to local storage for AI features
- **📤 Image Upload & Recognition** - Upload sequence diagram images (PNG/JPG), AI recognizes nodes, connections, and text automatically
- **💬 Natural Language Input** - Describe your process in natural language (e.g., "User login, system verifies password, returns token"), AI generates the diagram
- **🎨 Dynamic Sequence Diagram Generation** - Three.js renders nodes and connections with cool tech-style effects (gradients, glow, sci-fi fonts)
-   - Supports up to 20 nodes
-   - Supports branch logic (if-else)
-   - Supports loop logic (loops)
- **✏️ Manual Editing** - Add/delete/modify nodes and connections, set branches and loops
- **▶️ Dynamic Display Mode** - Click nodes to reveal step-by-step with stunning animations:
  - Arrow drawing animation
  - Flowing light points along connections
  - Particle effects on target nodes

### Auxiliary Features

- **🔄 Reset** - Reset diagram to initial state
- **⏭️ Jump** - Jump to any step via timeline
- **📷 Export Static Image** - Export as PNG/SVG for documentation
- **🎬 Export Animation Sequence** - Export all keyframes as a ZIP file

---

## Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/chronoflow-ai.git
cd chronoflow-ai

# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## Usage

### Workflow 1: Upload Image to Generate

1. Open the application and enter your Gemini API key in the top bar, click "Save"
2. Select the "Upload Image" tab on the left
3. Click the upload area or drag and drop a sequence diagram image
4. After upload, a thumbnail preview appears
5. Click "Recognize & Generate" button
6. System uses Gemini to recognize the image and generate diagram data
7. The cool tech-style sequence diagram renders in the center canvas
8. If recognition is inaccurate, switch to "Manual Edit" tab to adjust

### Workflow 2: Natural Language to Generate

1. Open the application and enter your Gemini API key, click "Save"
2. Select "Natural Language" tab on the left
3. Enter your process description in the text box, e.g., "User login, system verifies password, if correct returns token and redirects to home, otherwise shows error"
4. Click "Generate Sequence Diagram" button
5. System uses AI to parse the description and generate diagram data
6. The cool tech-style sequence diagram renders in the center canvas
7. If not satisfied, switch to "Manual Edit" tab to adjust

### Workflow 3: Dynamic Display & Screen Recording

1. After generating the diagram, click "Dynamic Mode" toggle on the right
2. Diagram enters dynamic display state, all nodes and connections become unrevealed
3. Open screen recording software (OBS, QuickTime) and start recording
4. Click the first node, watch arrow animation, flowing light points, and particle effects
5. Continue clicking the next node to display the entire process step by step
6. If needed, click "Reset" button to return to initial state
7. Stop recording to get your dynamic sequence diagram video

### Workflow 4: Export Images

1. After generating the diagram, click "Export Static Image" button on the right
2. Select PNG or SVG format in the popup
3. System renders current canvas state as an image and downloads it
4. Or click "Export Animation Sequence" button
5. After selecting format, system automatically plays complete animation
6. Each keyframe is saved as an image
7. All images are packaged into a ZIP file for download

---

## Configuration

### API Key Setup

1. Enter your Gemini API key in the top input field
2. Click the "Save" button
3. The key is saved to browser LocalStorage
4. The key will be used for all AI features

**Note:** Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Language Switch

- Click the language toggle in the top right corner
- Switch between English / Chinese
- Selection is saved to browser LocalStorage
- Default language: English

---

## Tech Stack

- **Framework:** React 19 (Vite + TypeScript)
- **3D Rendering:** Three.js + React Three Fiber
- **AI Model:** Google Gemini 3 Pro Image Preview
- **State Management:** React Hooks + Context API
- **Internationalization:** i18next
- **Icons:** Lucide React
- **Export:** html-to-image, JSZip
- **Deployment:** Static site (Vercel, Netlify, etc.)

### Animation Implementation

- **Arrow Animation:** Three.js Line + TubeGeometry with shaders for stroke animation
- **Flowing Light Points:** Particle system (Points) moving along paths
- **Particle Effects:** Three.js ParticleSystem for light convergence/diffusion

---

## Project Structure

```
chronoflow-ai/
├── public/
├── src/
│   ├── components/         # React components
│   │   ├── APISetting.tsx
│   │   ├── Canvas.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── InputPanel.tsx
│   │   └── Timeline.tsx
│   ├── services/           # API services
│   ├── locales/            # i18n translation files
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── ...
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Screenshots

> Add screenshots of your application here

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

