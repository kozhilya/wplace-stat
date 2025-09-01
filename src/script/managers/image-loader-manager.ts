import { Template } from '../template';
import { WplaceTileWidth } from '../wplace';

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
        
        // Create a canvas to composite the actual image
        const canvas = document.createElement('canvas');
        canvas.width = template.imageWidth!;
        canvas.height = template.imageHeight!;
        const ctx = canvas.getContext('2d')!;
        
        // Calculate tile coordinates
        const startX = template.tlX;
        const startY = template.tlY;
        const endX = template.pxX;
        const endY = template.pxY;
        
        // Load and draw each tile
        const tilePromises = [];
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                tilePromises.push(this.loadAndDrawTile(ctx, x, y, template));
            }
        }
        
        await Promise.all(tilePromises);
        template.actualCanvas = canvas;
    }

    private static async loadAndDrawTile(
        ctx: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        template: Template
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                // Calculate position to draw the tile
                const drawX = (x - template.tlX) * WplaceTileWidth;
                const drawY = (y - template.tlY) * WplaceTileWidth;
                ctx.drawImage(img, drawX, drawY);
                resolve();
            };
            img.onerror = reject;
            
            // Construct the tile URL
            const timestamp = Date.now();
            img.src = `https://wplace.io/tiles/${x}/${y}?t=${timestamp}`;
        });
    }
}
