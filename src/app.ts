import './styles/main.scss';
import { CanvasManager } from './script/managers/canvas-manager';
import { StatisticsManager } from './script/managers/statistics-manager';
import { LanguageManager } from './script/managers/language-manager';

class App {
    private canvasManager: CanvasManager | null = null;
    private statisticsManager: StatisticsManager | null = null;

    constructor() {
        LanguageManager.initialize();
        // Find the canvas element
        const canvas = document.getElementById('template-canvas') as HTMLCanvasElement;
        if (canvas) {
            this.canvasManager = new CanvasManager(canvas);
        } else {
            console.error('Canvas element not found');
        }
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        // Statistics will be updated when images are loaded
        // const hasTemplate = this.loadFromHash();
        
        // Hide form if template was loaded from hash
        // if (hasTemplate) {
        //     this.hideTemplateForm();
        // }
    }

    private setupEventListeners(): void {
        const templateForm = document.getElementById('template-form') as HTMLFormElement;
        templateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // this.handleTemplateSubmit();
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
        const templateForm = document.getElementById('template-form') as HTMLElement | null;
        const editTemplateBtn = document.getElementById('edit-template-btn') as HTMLElement | null;
        const templateConfigHeader = document.querySelector('.stats-panel h2[data-i18n="templateConfiguration"]') as HTMLElement | null;
        if (templateForm && editTemplateBtn && templateConfigHeader) {
            templateForm.style.display = 'none';
            templateConfigHeader.style.display = 'none';
            editTemplateBtn.style.display = 'block';
        }
    }

    private showTemplateForm(): void {
        const templateForm = document.getElementById('template-form') as HTMLElement | null;
        const editTemplateBtn = document.getElementById('edit-template-btn') as HTMLElement | null;
        const templateConfigHeader = document.querySelector('.stats-panel h2[data-i18n="templateConfiguration"]') as HTMLElement | null;
        if (templateForm && editTemplateBtn && templateConfigHeader) {
            templateForm.style.display = 'block';
            templateConfigHeader.style.display = 'block';
            editTemplateBtn.style.display = 'none';
        }
    }

    // private async handleTemplateSubmit(): Promise<void> {
    //     const templateData = TemplateManager.getFormData();
        
    //     // Validate the image URL
    //     if (templateData.imageDataUrl) {
    //         TemplateManager.saveTemplateToHash(templateData);
            
    //         // Draw the image
    //         const img = new Image();
    //         // Handle CORS if the image is from another domain
    //         img.crossOrigin = 'Anonymous';
    //         img.onload = async () => {
    //             const templateCanvas = document.getElementById('template-canvas') as HTMLCanvasElement;
    //             const ctx = templateCanvas.getContext('2d');
    //             if (!ctx) return;
                
    //             // Set canvas size to match image dimensions
    //             templateCanvas.width = img.width;
    //             templateCanvas.height = img.height;
                
    //             // Clear canvas
    //             ctx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
                
    //             // Draw the template image at (0,0) without scaling
    //             ctx.drawImage(img, 0, 0);
                
    //             // Calculate occupied tiles
    //             const templateData = TemplateManager.getFormData();
    //             const occupiedTiles = TemplateManager.calculateOccupiedTiles(templateData, img.width, img.height);
    //             console.log('Occupied tiles:', occupiedTiles);
                
    //             // Load and display actual canvas
    //             try {
    //                 const actualCanvas = await TemplateManager.loadActualCanvas(templateData, img.width, img.height);
    //                 // Draw the actual canvas at (0,0) without scaling
    //                 ctx.drawImage(actualCanvas, 0, 0);
                    
    //                 // Update statistics
    //                 this.statisticsManager = new StatisticsManager(img, actualCanvas);
    //                 TableManager.updateTable(this.statisticsManager.getStatistics());
    //             } catch (error) {
    //                 console.error('Failed to load actual canvas:', error);
    //             }
                
    //             // Hide the form after successful submission
    //             this.hideTemplateForm();
    //         };
    //         img.onerror = () => {
    //             console.error('Error loading image from URL');
    //             alert('Could not load image from the provided URL. Please check the URL and try again.');
    //         };
    //         img.src = templateData.imageDataUrl;
    //     } else {
    //         alert('Please provide a valid image URL');
    //     }
    // }

    // private loadFromHash(): boolean {
    //     const templateData = TemplateManager.loadTemplateFromHash();
    //     if (templateData) {
    //         TemplateManager.fillFormFromTemplateData(templateData);
            
    //         // Draw the image
    //         const img = new Image();
    //         // Handle CORS if the image is from another domain
    //         img.crossOrigin = 'Anonymous';
    //         img.onload = async () => {
    //             const templateCanvas = document.getElementById('template-canvas') as HTMLCanvasElement;
    //             const ctx = templateCanvas.getContext('2d');
    //             if (!ctx) return;
                
    //             // Set canvas size to match image dimensions
    //             templateCanvas.width = img.width;
    //             templateCanvas.height = img.height;
                
    //             // Clear canvas
    //             ctx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
                
    //             // Draw the template image at (0,0) without scaling
    //             ctx.drawImage(img, 0, 0);
                
    //             // Calculate occupied tiles
    //             const templateData = TemplateManager.getFormData();
    //             const occupiedTiles = TemplateManager.calculateOccupiedTiles(templateData, img.width, img.height);
    //             console.log('Occupied tiles:', occupiedTiles);
                
    //             // Load and display actual canvas
    //             try {
    //                 const actualCanvas = await TemplateManager.loadActualCanvas(templateData, img.width, img.height);
    //                 // Draw the actual canvas at (0,0) without scaling
    //                 ctx.drawImage(actualCanvas, 0, 0);
                    
    //                 // Update statistics
    //                 this.statisticsManager = new StatisticsManager(img, actualCanvas);
    //                 TableManager.updateTable(this.statisticsManager.getStatistics());
    //             } catch (error) {
    //                 console.error('Failed to load actual canvas:', error);
    //             }
    //         };
    //         img.onerror = () => {
    //             console.error('Error loading image from URL in hash');
    //         };
    //         img.src = templateData.imageDataUrl;
    //         return true;
    //     }
    //     return false;
    // }
}

new App();
