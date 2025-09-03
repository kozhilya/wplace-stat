# WPlace Progress Tracker

A web application for tracking progress on WPlace (a pixel art collaboration platform) templates. This tool helps users monitor their pixel placement progress by comparing their work against template images and providing detailed statistics.

*Note: This project is my playground for testing how well AI code works. My personal opinion: is that it's very not good, but for such a simple SPA it's good enough... I'll probably still have to clean up the mess the AI ​​made in this project, because it clearly did a poor job of structuring the files and methods in it.*

## Features

- **Template Management**: Create, save, and load templates with custom configurations
- **Progress Visualization**: View template, current WPlace state, and difference views
- **Detailed Statistics**: Track pixel completion by color with sorting and filtering
- **Multi-language Support**: English, Russian, and Spanish interfaces
- **Zoom and Pan**: Interactive canvas navigation with zoom controls
- **Color Filtering**: Focus on specific colors in the difference view
- **Local Storage**: Templates are saved locally in your browser
- **URL Sharing**: Templates can be shared via URL hashes

### TODO

This changes are planned and will be implemented soon. Feel free to create and Issue if you feel something might be upgraded in this app that is not listed here.

- Auto-update
- Fix canvas flickering

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wplace-progress-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Creating a Template

1. Click the template button (✏️) in the header or the templates button (☰) to access template management
2. Fill in the template configuration:
   - **Template Name**: A descriptive name for your template
   - **Tl X/Y**: Top-left coordinates of the template area on WPlace
   - **Px X/Y**: Pixel dimensions of the template
   - **Image URL**: URL of the template image
3. Click "Save Template" to load and save the template

### Viewing Statistics

Once a template is loaded, the left panel displays statistics including:
- Total pixels per color
- Completed pixels
- Completion percentage
- Remaining pixels

Click on any statistic row to filter the difference view by that color.

### Canvas Navigation

- **Pan**: Click and drag to move around the canvas
- **Zoom**: Use the mouse wheel or the +/- buttons
- **Reset Zoom**: Click the "1:1" button to reset to default zoom
- **View Modes**: Switch between Template, WPlace, and Difference views

### Language Support

Use the language selector in the header to switch between:
- English (EN)
- Russian (RU)
- Spanish (ES)

## Technical Details

### Architecture

The application is built with:
- **React** with TypeScript for the UI components
- **Webpack** for bundling
- **SCSS** for styling
- **Local Storage** for data persistence

### Key Components

- **CanvasInteractionManager**: Handles zooming and panning interactions
- **ImageLoaderManager**: Loads and processes template and WPlace images
- **StatisticsManager**: Calculates and manages progress statistics
- **LanguageManager**: Handles internationalization

### File Structure

```
src/
├── components/          # React components
├── locales/            # Translation files
├── script/             # Core application logic
│   └── managers/       # Manager classes
├── styles/             # SCSS stylesheets
└── utils.ts           # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

## Acknowledgments

- WPlace community for inspiration
- Contributors and translators