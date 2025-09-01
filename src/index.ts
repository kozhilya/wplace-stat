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
        const hasTemplate = this.loadFromHash();
        
        // Hide form if template was loaded from hash
        if (hasTemplate) {
            this.hideTemplateForm();
        }
    }

    private setupEventListeners(): void {
        const templateForm = document.getElementById('template-form') as HTMLFormElement;
        templateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleTemplateSubmit();
        });

        // Add event listener for edit template button
        const editTemplateBtn = document.getElementById('edit-template-btn');
        if (editTemplateBtn) {
            editTemplateBtn.addEventListener('click', () => {
                this.showTemplateForm();
            });
        }
    }

    private hideTemplateForm(): void {
        const templateForm = document.getElementById('template-form');
        const editTemplateBtn = document.getElementById('edit-template-btn');
        if (templateForm && editTemplateBtn) {
            templateForm.style.display = 'none';
            editTemplateBtn.style.display = 'block';
        }
    }

    private showTemplateForm(): void {
        const templateForm = document.getElementById('template-form');
        const editTemplateBtn = document.getElementById('edit-template-btn');
        if (templateForm && editTemplateBtn) {
            templateForm.style.display = 'block';
            editTemplateBtn.style.display = 'none';
        }
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
                // Hide the form after successful submission
                this.hideTemplateForm();
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

    private loadFromHash(): boolean {
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
            return true;
        }
        return false;
    }
}

new App();
