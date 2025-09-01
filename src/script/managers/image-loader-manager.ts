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
        
        // Calculate the number of tiles in width and height
        const tileCountX = template.pxX - template.tlX + 1;
        const tileCountY = template.pxY - template.tlY + 1;
        
        // Create a canvas with the correct dimensions
        const canvas = document.createElement('canvas');
        canvas.width = tileCountX * WplaceTileWidth;
        canvas.height = tileCountY * WplaceTileWidth;
        const ctx = canvas.getContext('2d')!;
        
        // Load and draw each tile
        const tilePromises = [];
        
        for (let y = 0; y < tileCountY; y++) {
            for (let x = 0; x < tileCountX; x++) {
                const tileX = template.tlX + x;
                const tileY = template.tlY + y;
                tilePromises.push(this.loadAndDrawTile(ctx, tileX, tileY, x, y));
            }
        }
        
        await Promise.all(tilePromises);
        template.actualCanvas = canvas;
    }

    private static async loadAndDrawTile(
        ctx: CanvasRenderingContext2D, 
        tileX: number, 
        tileY: number, 
        offsetX: number, 
        offsetY: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                // Calculate position to draw the tile
                const drawX = offsetX * WplaceTileWidth;
                const drawY = offsetY * WplaceTileWidth;
                ctx.drawImage(img, drawX, drawY, WplaceTileWidth, WplaceTileWidth);
                resolve();
            };
            img.onerror = () => {
                // If tile fails to load, draw a blank space and resolve
                // This prevents the entire composition from failing due to missing tiles
                console.warn(`Failed to load tile at (${tileX}, ${tileY})`);
                resolve();
            };
            
            // Construct the tile URL with timestamp to avoid caching issues
            const timestamp = Date.now();
            img.src = `https://backend.wplace.live/files/s0/tiles/${tileX}/${tileY}.png?t=${timestamp}`;
        });
    }
}
