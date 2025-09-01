import './styles/main.scss';
import { TemplateManager } from './template-manager';
import { CanvasManager } from './canvas-manager';
import { StatisticsManager } from './statistics-manager';
import { TemplateData } from './types';

class App {
    private canvasManager: CanvasManager;

    constructor() {
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
        const formData = TemplateManager.getFormData();
        
        if (formData.imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const templateData: TemplateData = {
                    tlX: formData.tlX,
                    tlY: formData.tlY,
                    pxX: formData.pxX,
                    pxY: formData.pxY,
                    imageDataUrl: e.target?.result as string
                };
                
                TemplateManager.saveTemplateToHash(templateData);
                
                // Draw the image
                const img = new Image();
                img.onload = () => {
                    this.canvasManager.drawImage(img);
                    StatisticsManager.updateStatistics();
                };
                img.src = templateData.imageDataUrl;
            };
            reader.readAsDataURL(formData.imageFile);
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
