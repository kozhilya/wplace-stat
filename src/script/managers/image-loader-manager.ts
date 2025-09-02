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
        console.log(`Canvas dimensions before cropping: ${canvas.width}x${canvas.height}`);
        
        // Crop the canvas to match the template dimensions and position
        // The template starts at (pxX, pxY) within the starting tile
        // We need to extract a region of template.imageWidth x template.imageHeight
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = template.imageWidth;
        croppedCanvas.height = template.imageHeight;
        const croppedCtx = croppedCanvas.getContext('2d')!;
        
        // Calculate the source coordinates in the original canvas
        // The starting tile is at offset (0, 0) in the canvas
        // The template starts at (pxX, pxY) within the starting tile
        const sourceX = template.pxX;
        const sourceY = template.pxY;
        
        // Draw the relevant portion to the cropped canvas
        croppedCtx.drawImage(
            canvas,
            sourceX, sourceY,                   // Source x, y
            template.imageWidth, template.imageHeight, // Source width, height
            0, 0,                               // Destination x, y
            template.imageWidth, template.imageHeight  // Destination width, height
        );
        
        // Convert cropped canvas to image
        template.wplaceImage = await this.canvasToImage(croppedCanvas);
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

    // Method to set whether to use CORS proxy directly
    static setUseCorsProxyDirectly(useProxy: boolean): void {
        ImageLoaderManager.useCorsProxyDirectly = useProxy;
        console.log(`CORS proxy usage set to: ${useProxy}`);
    }

    // Global flag to control whether to use CORS proxy directly
    // Set to true by default to always use CORS proxies due to CORS restrictions
    private static useCorsProxyDirectly: boolean = true;

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
            
            // Track which URLs we've tried
            const triedUrls: string[] = [];
            
            const tryLoadImage = (url: string) => {
                triedUrls.push(url);
                console.log(`Loading tile from: ${url}`);
                
                img.onload = () => {
                    // Calculate position to draw the tile
                    const drawX = offsetX * WplaceTileWidth;
                    const drawY = offsetY * WplaceTileWidth;
                    ctx.drawImage(img, drawX, drawY, WplaceTileWidth, WplaceTileWidth);
                    console.log(`Loaded tile at (${tileX}, ${tileY})`);
                    resolve();
                };
                
                img.onerror = (error) => {
                    // Try next URL in the fallback sequence
                    const nextUrl = getNextUrl(triedUrls, tileX, tileY);
                    if (nextUrl) {
                        console.warn(`Failed to load tile from ${url}, trying next: ${nextUrl}`, error);
                        tryLoadImage(nextUrl);
                    } else {
                        // If all URLs fail, draw a blank space and resolve
                        console.warn(`Failed to load tile at (${tileX}, ${tileY}) from all attempted URLs`, error);
                        resolve();
                    }
                };
                
                img.src = url;
            };
            
            // Get the sequence of URLs to try
            const getNextUrl = (triedUrls: string[], tileX: number, tileY: number): string | null => {
                const timestamp = Date.now();
                const originalUrl = `https://backend.wplace.live/files/s0/tiles/${tileX}/${tileY}.png?t=${timestamp}`;
                
                // Determine URL sequence based on the flag
                let urlSequence: string[];
                if (ImageLoaderManager.useCorsProxyDirectly) {
                    // Skip direct request and use proxies directly
                    urlSequence = [
                        `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
                        `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`
                    ];
                } else {
                    // Try direct request first, then fall back to proxies
                    urlSequence = [
                        originalUrl,
                        `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
                        `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`
                    ];
                }
                
                // Find the next URL that hasn't been tried yet
                for (const url of urlSequence) {
                    if (!triedUrls.includes(url)) {
                        return url;
                    }
                }
                return null;
            };
            
            // Start with the first URL in the sequence
            const firstUrl = getNextUrl(triedUrls, tileX, tileY);
            if (firstUrl) {
                tryLoadImage(firstUrl);
            } else {
                console.warn(`No URLs to try for tile at (${tileX}, ${tileY})`);
                resolve();
            }
        });
    }
}
