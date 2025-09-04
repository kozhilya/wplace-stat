import { Template } from '../template';
import { WplaceTileWidth, WplacePalette } from '../wplace';
import { debug } from '../../utils';

/**
 * Manages loading and processing of template and wplace images
 * Handles CORS issues, tile stitching, and difference calculations
 */
export class ImageLoaderManager {
    /**
     * Loads the template image from its data URL and sets dimensions on the template object
     * @param template The template object to load the image for
     * @returns Promise that resolves when the image is loaded
     */
    static async loadTemplateImage(template: Template): Promise<void> {
        debug('[ImageLoaderManager.loadTemplateImage] Loading template image');
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                debug(`[ImageLoaderManager.loadTemplateImage] Template image loaded: ${img.width}x${img.height}`);
                template.templateImage = img;
                template.imageWidth = img.width;
                template.imageHeight = img.height;
                resolve();
            };
            img.onerror = (error) => {
                debug('[ImageLoaderManager.loadTemplateImage] Failed to load template image:', error);
                reject(error);
            };
            img.src = template.imageDataUrl;
        });
    }

    /**
     * Loads and stitches together wplace tiles to create a complete wplace image matching the template
     * @param template The template object to load wplace image for
     * @returns Promise that resolves when the wplace image is loaded and processed
     * @throws Error if template dimensions are not loaded
     */
    static async loadWplaceImage(template: Template): Promise<void> {
        debug('[ImageLoaderManager.loadWplaceImage] Loading wplace image');
        if (!template.templateImage) {
            debug('[ImageLoaderManager.loadWplaceImage] Template image not loaded, loading it first');
            await this.loadTemplateImage(template);
        }
        
        // Ensure template image dimensions are loaded
        if (template.imageWidth === -1 || template.imageHeight === -1) {
            debug('[ImageLoaderManager.loadWplaceImage] Template image dimensions are not loaded');
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
        
        debug(`[ImageLoaderManager.loadWplaceImage] Need ${tileCountX}x${tileCountY} tiles from (${startTileX},${startTileY}) to (${endTileX},${endTileY})`);
        
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
        debug(`[ImageLoaderManager.loadWplaceImage] Canvas dimensions before cropping: ${canvas.width}x${canvas.height}`);
        
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
        
        debug(`[ImageLoaderManager.loadWplaceImage] Cropping from (${sourceX},${sourceY}) to size ${template.imageWidth}x${template.imageHeight}`);
        
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
        debug(`[ImageLoaderManager.loadWplaceImage] Wplace image set: ${template.wplaceImage ? 'Yes' : 'No'}`);
        if (template.wplaceImage) {
            debug(`[ImageLoaderManager.loadWplaceImage] Wplace image dimensions: ${template.wplaceImage.width}x${template.wplaceImage.height}`);
        }
    }

    /**
     * Converts a canvas element to an HTMLImageElement
     * @param canvas The canvas to convert
     * @returns Promise that resolves with the image element
     */
    private static async canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
        debug('[ImageLoaderManager.canvasToImage] Converting canvas to image');
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                debug('[ImageLoaderManager.canvasToImage] Canvas converted to image successfully');
                resolve(img);
            };
            img.onerror = (error) => {
                debug('[ImageLoaderManager.canvasToImage] Failed to convert canvas to image:', error);
                reject(error);
            };
            img.src = canvas.toDataURL('image/png');
        });
    }

    /**
     * Sets whether to use CORS proxy directly for tile loading
     * @param useProxy True to use CORS proxy directly, false to try direct requests first
     */
    static setUseCorsProxyDirectly(useProxy: boolean): void {
        ImageLoaderManager.useCorsProxyDirectly = useProxy;
        debug(`[ImageLoaderManager.setUseCorsProxyDirectly] CORS proxy usage set to: ${useProxy}`);
    }

    // Global flag to control whether to use CORS proxy directly
    // Set to true by default to always use CORS proxies due to CORS restrictions
    private static useCorsProxyDirectly: boolean = false;

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
                debug(`Loading tile from: ${url}`);
                
                img.onload = () => {
                    // Calculate position to draw the tile
                    const drawX = offsetX * WplaceTileWidth;
                    const drawY = offsetY * WplaceTileWidth;
                    ctx.drawImage(img, drawX, drawY, WplaceTileWidth, WplaceTileWidth);
                    debug(`Loaded tile at (${tileX}, ${tileY})`);
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
                        ImageLoaderManager.useCorsProxyDirectly = url !== originalUrl;
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

    // Helper function to check if two colors match exactly
    static colorsMatchExactly(
        r1: number, g1: number, b1: number, a1: number,
        r2: number, g2: number, b2: number, a2: number
    ): boolean {
        return r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;
    }

    // Helper function to check if template pixel matches selected color
    static isTemplatePixelSelectedColor(
        templateR: number, templateG: number, templateB: number,
        selectedColorId: number
    ): boolean {
        const selectedColor = WplacePalette.find(color => color.id === selectedColorId);
        if (!selectedColor) return false;
        
        // Exact match with the selected color from the palette
        return templateR === selectedColor.rgb[0] &&
               templateG === selectedColor.rgb[1] &&
               templateB === selectedColor.rgb[2];
    }

    // Function to get CSS variable value
    static getCssVariable(name: string): string {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    // Function to parse RGB/RGBA from CSS variable
    static parseRgbFromCssVariable(cssValue: string): number[] {
        // Handle rgb() and rgba() formats
        const rgbMatch = cssValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            return [r, g, b, Math.round(a * 255)];
        }
        
        // Handle hex format
        const hexMatch = cssValue.match(/^#([0-9A-Fa-f]{3,8})$/);
        if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3 || hex.length === 4) {
                hex = hex.split('').map(c => c + c).join('');
            }
            
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return [r, g, b, 255];
            } else if (hex.length === 8) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const a = parseInt(hex.substring(6, 8), 16);
                return [r, g, b, a];
            }
        }
        
        // Default to black if parsing fails
        return [0, 0, 0, 255];
    }

    // Get difference colors from CSS variables
    static getDifferenceColors() {
        // These are example CSS variable names - you may need to adjust them
        return {
            transparent: [0, 0, 0, 0],          // Always fully transparent
            unselected: ImageLoaderManager.parseRgbFromCssVariable(ImageLoaderManager.getCssVariable('--color-difference-unselected') || '#ffffff'),
            match: ImageLoaderManager.parseRgbFromCssVariable(ImageLoaderManager.getCssVariable('--color-difference-match') || '#4CAF50'),
            missing: ImageLoaderManager.parseRgbFromCssVariable(ImageLoaderManager.getCssVariable('--color-difference-missing') || '#ff0000')
        };
    }

    // Handle difference mode drawing with color filtering
    static drawDifference(
        ctx: CanvasRenderingContext2D,
        templateImage: HTMLImageElement,
        wplaceImage: HTMLImageElement,
        x: number,
        y: number,
        selectedColorId?: number | null
    ) {
        const differenceColors = ImageLoaderManager.getDifferenceColors();
        // Track missing pixel coordinates
        const missingPixels: { x: number; y: number }[] = [];
        // Create temporary canvases to get image data
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = templateImage.width;
        templateCanvas.height = templateImage.height;
        const templateCtx = templateCanvas.getContext('2d')!;
        templateCtx.drawImage(templateImage, 0, 0);

        const wplaceCanvas = document.createElement('canvas');
        wplaceCanvas.width = wplaceImage.width;
        wplaceCanvas.height = wplaceImage.height;
        const wplaceCtx = wplaceCanvas.getContext('2d')!;
        wplaceCtx.drawImage(wplaceImage, 0, 0);

        // Get image data
        const templateData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
        const wplaceData = wplaceCtx.getImageData(0, 0, wplaceCanvas.width, wplaceCanvas.height);

        // Create result image data
        const resultData = new ImageData(templateCanvas.width, templateCanvas.height);

        // Compare pixels
        for (let i = 0; i < templateData.data.length; i += 4) {
            const templateR = templateData.data[i];
            const templateG = templateData.data[i + 1];
            const templateB = templateData.data[i + 2];
            const templateA = templateData.data[i + 3];

            const wplaceR = wplaceData.data[i];
            const wplaceG = wplaceData.data[i + 1];
            const wplaceB = wplaceData.data[i + 2];
            const wplaceA = wplaceData.data[i + 3];

            // 1) If template pixel is transparent - use black
            if (templateA === 0) {
                resultData.data[i] = differenceColors.transparent[0];
                resultData.data[i + 1] = differenceColors.transparent[1];
                resultData.data[i + 2] = differenceColors.transparent[2];
                resultData.data[i + 3] = differenceColors.transparent[3];
            }
            // 2) If a specific color is selected and this pixel doesn't match, treat as unselected
            else if (selectedColorId !== null && selectedColorId !== undefined) {
                // Check if this pixel matches the selected color in the template
                const isSelectedColor = ImageLoaderManager.isTemplatePixelSelectedColor(
                    templateR, templateG, templateB, selectedColorId
                );
                
                if (!isSelectedColor) {
                    // Treat as unselected - use white
                    resultData.data[i] = differenceColors.unselected[0];
                    resultData.data[i + 1] = differenceColors.unselected[1];
                    resultData.data[i + 2] = differenceColors.unselected[2];
                    resultData.data[i + 3] = differenceColors.unselected[3];
                } else {
                    // Check if colors match between template and actual
                    if (ImageLoaderManager.colorsMatchExactly(
                        templateR, templateG, templateB, templateA,
                        wplaceR, wplaceG, wplaceB, wplaceA
                    )) {
                        // 3) Colors match - use green
                        resultData.data[i] = differenceColors.match[0];
                        resultData.data[i + 1] = differenceColors.match[1];
                        resultData.data[i + 2] = differenceColors.match[2];
                        resultData.data[i + 3] = differenceColors.match[3];
                    } else {
                        // 4) Colors don't match - use red
                        resultData.data[i] = differenceColors.missing[0];
                        resultData.data[i + 1] = differenceColors.missing[1];
                        resultData.data[i + 2] = differenceColors.missing[2];
                        resultData.data[i + 3] = differenceColors.missing[3];
                        
                        // Track missing pixel coordinates
                        const pixelIndex = i / 4;
                        const pixelX = (pixelIndex % templateCanvas.width);
                        const pixelY = Math.floor(pixelIndex / templateCanvas.width);
                        missingPixels.push({ x: pixelX, y: pixelY });
                    }
                }
            } else {
                // No color selected - show all
                // Check if colors match
                if (ImageLoaderManager.colorsMatchExactly(
                    templateR, templateG, templateB, templateA,
                    wplaceR, wplaceG, wplaceB, wplaceA
                )) {
                    // 3) Colors match - use green
                    resultData.data[i] = differenceColors.match[0];
                    resultData.data[i + 1] = differenceColors.match[1];
                    resultData.data[i + 2] = differenceColors.match[2];
                    resultData.data[i + 3] = differenceColors.match[3];
                } else {
                    // 4) Colors don't match - use red
                    resultData.data[i] = differenceColors.missing[0];
                    resultData.data[i + 1] = differenceColors.missing[1];
                    resultData.data[i + 2] = differenceColors.missing[2];
                    resultData.data[i + 3] = differenceColors.missing[3];
                    
                    // Track missing pixel coordinates
                    const pixelIndex = i / 4;
                    const pixelX = (pixelIndex % templateCanvas.width);
                    const pixelY = Math.floor(pixelIndex / templateCanvas.width);
                    missingPixels.push({ x: pixelX, y: pixelY });
                }
            }
        }

        // Put the result data onto the canvas
        ctx.putImageData(resultData, x, y);
        
        // Store missing pixels for ping animation
        // We'll use a global storage or pass them back somehow
        // For now, we'll store them in a global variable
        (window as any).missingPixels = missingPixels;
    }
}
