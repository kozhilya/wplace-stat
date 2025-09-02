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

    static async loadWplaceImage(template: Template): Promise<void> {
        if (!template.templateImage) {
            await this.loadTemplateImage(template);
        }
        
        // Ensure template image dimensions are loaded
        if (template.imageWidth === -1 || template.imageHeight === -1) {
            throw new Error('Template image dimensions are not loaded');
        }
        
        // Calculate the number of tiles needed in X and Y directions
        // The template starts at (pxX, pxY) within the starting tile (tlX, tlY)
        // The image spans template.imageWidth x template.imageHeight pixels
        
        // Calculate the end position in pixels within the starting tile coordinate system
        const endPixelX = template.pxX + template.imageWidth;
        const endPixelY = template.pxY + template.imageHeight;
        
        // Determine which tiles are needed
        // The starting tile is always included
        const startTileX = template.tlX;
        const startTileY = template.tlY;
        
        // Calculate the ending tile indices
        // Since pxX and pxY are within the starting tile, we need to see how many additional tiles are needed
        const endTileX = startTileX + Math.floor((endPixelX - 1) / WplaceTileWidth);
        const endTileY = startTileY + Math.floor((endPixelY - 1) / WplaceTileWidth);
        
        // Number of tiles in each direction
        const tileCountX = endTileX - startTileX + 1;
        const tileCountY = endTileY - startTileY + 1;
        
        // Create a canvas with the correct dimensions
        const canvas = document.createElement('canvas');
        canvas.width = tileCountX * WplaceTileWidth;
        canvas.height = tileCountY * WplaceTileWidth;
        const ctx = canvas.getContext('2d')!;
        
        // Load and draw each tile
        const tilePromises = [];
        
        for (let y = 0; y < tileCountY; y++) {
            for (let x = 0; x < tileCountX; x++) {
                const tileX = startTileX + x;
                const tileY = startTileY + y;
                tilePromises.push(this.loadAndDrawTile(ctx, tileX, tileY, x, y));
            }
        }
        
        await Promise.all(tilePromises);
        
        // Log the canvas dimensions
        console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
        
        // Convert canvas to image
        template.wplaceImage = await this.canvasToImage(canvas);
        console.log(`Wplace image set: ${template.wplaceImage ? 'Yes' : 'No'}`);
        if (template.wplaceImage) {
            console.log(`Wplace image dimensions: ${template.wplaceImage.width}x${template.wplaceImage.height}`);
        }
    }

    private static async canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = canvas.toDataURL('image/png');
        });
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
            
            // Track if we've tried the fallback
            let triedFallback = false;
            
            const loadImage = (url: string) => {
                img.onload = () => {
                    // Calculate position to draw the tile
                    const drawX = offsetX * WplaceTileWidth;
                    const drawY = offsetY * WplaceTileWidth;
                    ctx.drawImage(img, drawX, drawY, WplaceTileWidth, WplaceTileWidth);
                    console.log(`Loaded tile at (${tileX}, ${tileY})`);
                    resolve();
                };
                
                img.onerror = (error) => {
                    if (!triedFallback) {
                        // Try fallback proxy
                        triedFallback = true;
                        console.warn(`Failed to load tile using primary proxy, trying fallback: (${tileX}, ${tileY})`, error);
                        
                        const timestamp = Date.now();
                        const originalUrl = `https://backend.wplace.live/files/s0/tiles/${tileX}/${tileY}.png?t=${timestamp}`;
                        const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
                        console.log(`Trying fallback proxy: ${fallbackProxyUrl}`);
                        img.src = fallbackProxyUrl;
                    } else {
                        // If tile fails to load even with fallback, draw a blank space and resolve
                        console.warn(`Failed to load tile at (${tileX}, ${tileY}) even with fallback`, error);
                        resolve();
                    }
                };
                
                console.log(`Loading tile from: ${url}`);
                img.src = url;
            };
            
            // Start with primary proxy
            const timestamp = Date.now();
            const originalUrl = `https://backend.wplace.live/files/s0/tiles/${tileX}/${tileY}.png?t=${timestamp}`;
            const primaryProxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
            loadImage(primaryProxyUrl);
        });
    }
}
