import { Template } from '../template';

export class ImageLoaderManager {
    static async loadTemplateImage(template: Template): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                template.templateImage = img;
                template.imageWidth = img.width;
                template.imageHeight = img.height;
                resolve();
            };
            img.onerror = reject;
            img.src = template.imageDataUrl;
        });
    }

    static async loadActualCanvas(template: Template): Promise<void> {
        if (!template.templateImage) {
            await this.loadTemplateImage(template);
        }
        
        // Import TemplateManager to use its functionality
        const { TemplateManager } = await import('./template-manager');
        
        // Create template data object matching the expected interface
        const templateData = {
            tlX: template.tlX,
            tlY: template.tlY,
            pxX: template.pxX,
            pxY: template.pxY,
            imageDataUrl: template.imageDataUrl
        };
        
        // Load the actual canvas using TemplateManager
        template.actualCanvas = await TemplateManager.loadActualCanvas(
            templateData, 
            template.imageWidth, 
            template.imageHeight
        );
    }
}
