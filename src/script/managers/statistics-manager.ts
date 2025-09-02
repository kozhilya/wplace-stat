import { LanguageManager } from './language-manager';
import { WplaceColorDefinition, WplacePalette } from '../wplace';
import { debug } from '../../utils';

export class StatisticsRow {
    public color: WplaceColorDefinition | null;

    public total: number = 0;

    public completed: number = 0;

    public get percentage(): number {
        return (this.total > 0) ? this.completed / this.total : 1;
    }

    public get remain(): number {
        return this.total - this.completed;
    }

    constructor(color: WplaceColorDefinition | null) {
        this.color = color;
    }
};

export class StatisticsManager {
    private templateImage: HTMLImageElement;
    private actualCanvas: HTMLCanvasElement;
    private statistics: StatisticsRow[] = [];

    constructor(templateImage: HTMLImageElement, actualCanvas: HTMLImageElement) {
        this.templateImage = templateImage;
        // Convert the image to a canvas for pixel analysis
        const canvas = document.createElement('canvas');
        canvas.width = actualCanvas.width;
        canvas.height = actualCanvas.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(actualCanvas, 0, 0);
        this.actualCanvas = canvas;
        this.updateStatistics();
    }

    updateStatistics(): void {
        this.calculateStatistics();
    }

    setActualCanvas(actualCanvas: HTMLImageElement): void {
        // Convert the image to a canvas for pixel analysis
        const canvas = document.createElement('canvas');
        canvas.width = actualCanvas.width;
        canvas.height = actualCanvas.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(actualCanvas, 0, 0);
        this.actualCanvas = canvas;
        this.updateStatistics();
    }

    getStatistics(): StatisticsRow[] {
        return this.statistics;
    }

    private calculateStatistics(): void {
        // Reset statistics
        this.statistics = [];
        
        // Initialize all colors
        WplacePalette.forEach(color => {
            if (color.id !== 0) { // Skip transparent
                this.statistics.push(new StatisticsRow(color));
            }
        });

        // Ensure both images are loaded and have valid dimensions
        if (this.templateImage.width === 0 || this.templateImage.height === 0 ||
            this.actualCanvas.width === 0 || this.actualCanvas.height === 0) {
            return;
        }

        // Create a temporary canvas to draw the template image
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = this.templateImage.width;
        templateCanvas.height = this.templateImage.height;
        const templateCtx = templateCanvas.getContext('2d');
        if (!templateCtx) return;

        // Draw the template image
        templateCtx.drawImage(this.templateImage, 0, 0);

        const actualCtx = this.actualCanvas.getContext('2d');
        if (!actualCtx) return;

        try {
            // Get image data from both canvases
            // We need to ensure they're the same size, so we'll use the template dimensions
            const templateImageData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            
            // Scale actual canvas to match template dimensions if necessary
            // Create a temporary canvas to scale the actual image to match template dimensions
            const scaledActualCanvas = document.createElement('canvas');
            scaledActualCanvas.width = templateCanvas.width;
            scaledActualCanvas.height = templateCanvas.height;
            const scaledActualCtx = scaledActualCanvas.getContext('2d');
            if (!scaledActualCtx) return;
            
            // Draw the actual canvas scaled to match template dimensions
            scaledActualCtx.drawImage(this.actualCanvas, 0, 0, templateCanvas.width, templateCanvas.height);
            const actualImageData = scaledActualCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);

            const templateData = templateImageData.data;
            const actualData = actualImageData.data;

            // Process each pixel
            for (let i = 0; i < templateData.length; i += 4) {
                const templateR = templateData[i];
                const templateG = templateData[i + 1];
                const templateB = templateData[i + 2];
                const templateA = templateData[i + 3];

                // Skip transparent pixels in template
                if (templateA === 0) continue;

                // Find the closest color in the Wplace palette for the template pixel
                const templateColorId = this.findClosestColorId(templateR, templateG, templateB);
                
                // Update total count
                const templateRow = this.statistics.find(row => row.color?.id === templateColorId);
                if (templateRow) {
                    templateRow.total++;
                }

                // Check if pixels match
                const actualR = actualData[i];
                const actualG = actualData[i + 1];
                const actualB = actualData[i + 2];
                const actualA = actualData[i + 3];
                
                if (templateR === actualR && templateG === actualG && templateB === actualB && templateA === actualA) {
                    // Update completed count
                    if (templateRow) {
                        templateRow.completed++;
                    }
                }
            }
        } catch (error) {
            debug('Could not analyze image:', error);
        }
    }

    private findClosestColorId(r: number, g: number, b: number): number {
        let minDistance = Infinity;
        let closestColorId = 1; // Default to Black

        for (const color of WplacePalette) {
            // Skip transparent
            if (color.id === 0) continue;

            const distance = this.colorDistance(r, g, b, color.rgb[0], color.rgb[1], color.rgb[2]);
            if (distance < minDistance) {
                minDistance = distance;
                closestColorId = color.id;
            }
        }

        return closestColorId;
    }

    private colorDistance(r1: number, g1: number, b1: number,
        r2: number, g2: number, b2: number): number {
        return Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );
    }
}
