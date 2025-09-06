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
- **Auto-update**: Automatic updates of WPlace images at regular intervals
- **Manual Updates**: Click "Last Updated" to trigger immediate updates
- **Ping Animation**: Visual highlighting of remaining pixels
- **Dark/Light Mode**: Toggle between color schemes

## Getting Started

### Prerequisites

- Node.js (v14 or higher) and npm/yarn - для локальной разработки
- ИЛИ Docker и Docker Compose - для запуска через контейнеры

### Installation (локальная разработка)

1. Клонируйте репозиторий:
```bash
git clone https://github.com/kozhilya/wplace-stat.git
cd wplace-stat
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер разработки:
```bash
npm start
```

4. Откройте браузер и перейдите по адресу `http://localhost:3001`

### Запуск через Docker

1. Клонируйте репозиторий:
```bash
git clone https://github.com/kozhilya/wplace-stat.git
cd wplace-stat
```

2. Соберите и запустите контейнер:
```bash
npm run docker:build
npm run docker:up
```

3. Приложение будет доступно по адресу `http://localhost:3001`

### Сборка для продакшена

Для создания production сборки:

```bash
npm run build
```

Собранные файлы будут находиться в директории `dist/`

### Docker команды

- `npm run docker:build` - собрать Docker образ
- `npm run docker:up` - запустить контейнер
- `npm run docker:down` - остановить контейнер

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
- **Reset Zoom**: Click the "Reset" button to reset to default zoom
- **View Modes**: Switch between Template, WPlace, and Difference views
- **Manual Updates**: Click the "Last Updated" button to refresh WPlace data immediately
- **Ping Animation**: Click the bullseye button (or press Space) to highlight remaining pixels when few are left

### Auto-update Features

- WPlace images are automatically updated every minute
- Manual updates can be triggered by clicking the "Last Updated" text
- The refresh icon rotates during updates

### Language Support

Use the language selector in the header to switch between:
- English (EN)
- Russian (RU)
- Spanish (ES)

### Theme Support

Toggle between dark and light modes using the moon/sun button in the header

## Technical Details

### Architecture

The application is built with:
- **React** with TypeScript for the UI components
- **Webpack** for bundling
- **SCSS** for styling
- **Local Storage** for data persistence

### File Structure

```
src/
├── components/      # React components
├── locales/         # Translation files
├── script/          # Core application logic
│   └── managers/    # Manager classes
├── styles/          # SCSS stylesheets
└── utils.ts         # Utility functions
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

