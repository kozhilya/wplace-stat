import './styles/main.scss';
import { TemplateManager } from './template-manager';
import { CanvasManager } from './canvas-manager';
import { StatisticsManager } from './statistics-manager';
import { LanguageManager } from './language-manager';
import { TemplateData } from './types';

class App {
    private canvasManager: CanvasManager;

    constructor() {
        LanguageManager.initialize();
        this.canvasManager = new CanvasManager('template-canvas');
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        StatisticsManager.updateStatistics();
        this.loadFromHash();
    }

    private setupEventListeners(): void {
        const templateForm = document.getElementById('template-form') as HTMLFormElement;
        templateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleTemplateSubmit();
        });
    }

    private async handleTemplateSubmit(): Promise<void> {
        const templateData = TemplateManager.getFormData();
        
        // Validate the image URL
        if (templateData.imageDataUrl) {
            TemplateManager.saveTemplateToHash(templateData);
            
            // Draw the image
            const img = new Image();
            // Handle CORS if the image is from another domain
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                this.canvasManager.drawImage(img);
                StatisticsManager.updateStatistics();
            };
            img.onerror = () => {
                console.error('Error loading image from URL');
                alert('Could not load image from the provided URL. Please check the URL and try again.');
            };
            img.src = templateData.imageDataUrl;
        } else {
            alert('Please provide a valid image URL');
        }
    }

    private loadFromHash(): void {
        const templateData = TemplateManager.loadTemplateFromHash();
        if (templateData) {
            TemplateManager.fillFormFromTemplateData(templateData);
            
            // Draw the image
            const img = new Image();
            img.onload = () => {
                this.canvasManager.drawImage(img);
                StatisticsManager.updateStatistics();
            };
            img.src = templateData.imageDataUrl;
        }
    }
}

new App();
