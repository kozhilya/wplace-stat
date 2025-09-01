import { TemplateData, TileInfo } from '../../types';
import { LanguageManager } from './language-manager';
import { WplaceTileWidth, WplaceTileHeight } from '../wplace';

export class TemplateManager {
    static saveTemplateToHash(templateData: TemplateData): void {
        const jsonData = JSON.stringify(templateData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
        window.location.hash = base64Data;
    }

    static loadTemplateFromHash(): TemplateData | null {
        if (window.location.hash) {
            const base64Data = window.location.hash.substring(1);
            try {
                const jsonData = decodeURIComponent(escape(atob(base64Data)));
                return JSON.parse(jsonData) as TemplateData;
            } catch (error) {
                console.error(LanguageManager.getText('errorLoadingHash'), error);
                return null;
            }
        }
        return null;
    }

    static fillFormFromTemplateData(templateData: TemplateData): void {
        (document.getElementById('tl-x') as HTMLInputElement).value = templateData.tlX.toString();
        (document.getElementById('tl-y') as HTMLInputElement).value = templateData.tlY.toString();
        (document.getElementById('px-x') as HTMLInputElement).value = templateData.pxX.toString();
        (document.getElementById('px-y') as HTMLInputElement).value = templateData.pxY.toString();
        (document.getElementById('image-url') as HTMLInputElement).value = templateData.imageDataUrl;
    }

    static getFormData(): TemplateData {
        const tlX = parseInt((document.getElementById('tl-x') as HTMLInputElement).value);
        const tlY = parseInt((document.getElementById('tl-y') as HTMLInputElement).value);
        const pxX = parseInt((document.getElementById('px-x') as HTMLInputElement).value);
        const pxY = parseInt((document.getElementById('px-y') as HTMLInputElement).value);
        
        const imageUrl = (document.getElementById('image-url') as HTMLInputElement).value;
        
        return { tlX, tlY, pxX, pxY, imageDataUrl: imageUrl };
    }

    static calculateOccupiedTiles(templateData: TemplateData, imageWidth: number, imageHeight: number): TileInfo[] {
        const tiles: TileInfo[] = [];
        
        // Starting tile coordinates
        const startTileX = templateData.tlX;
        const startTileY = templateData.tlY;
        
        // Starting pixel coordinates within the starting tile
        const startPixelX = templateData.pxX;
        const startPixelY = templateData.pxY;
        
        // Calculate how many tiles are needed in x and y directions
        const remainingWidth = imageWidth - (WplaceTileWidth - startPixelX);
        const remainingHeight = imageHeight - (WplaceTileHeight - startPixelY);
        
        const tilesX = 1 + Math.max(0, Math.ceil(remainingWidth / WplaceTileWidth));
        const tilesY = 1 + Math.max(0, Math.ceil(remainingHeight / WplaceTileHeight));
        
        // Generate all occupied tiles
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                tiles.push({
                    x: startTileX + x,
                    y: startTileY + y
                });
            }
        }
        
        return tiles;
    }

    static async loadTile(tileX: number, tileY: number): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            // Use a CORS proxy to bypass CORS restrictions
            img.src = `https://corsproxy.io/?${encodeURIComponent(`https://backend.wplace.live/files/s0/tiles/${tileX}/${tileY}.png`)}`;
        });
    }

    static async loadActualCanvas(templateData: TemplateData, imageWidth: number, imageHeight: number): Promise<HTMLCanvasElement> {
        const occupiedTiles = this.calculateOccupiedTiles(templateData, imageWidth, imageHeight);
        
        // Create a canvas to composite the actual canvas parts
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Load and draw each tile
        const tilePromises = occupiedTiles.map(async (tile) => {
            try {
                const tileImage = await this.loadTile(tile.x, tile.y);
                
                // Calculate the source and destination coordinates
                const isFirstTileX = tile.x === templateData.tlX;
                const isFirstTileY = tile.y === templateData.tlY;
                
                const srcX = isFirstTileX ? templateData.pxX : 0;
                const srcY = isFirstTileY ? templateData.pxY : 0;
                
                const destX = isFirstTileX ? 0 : (tile.x - templateData.tlX) * WplaceTileWidth - templateData.pxX;
                const destY = isFirstTileY ? 0 : (tile.y - templateData.tlY) * WplaceTileHeight - templateData.pxY;
                
                // Calculate the width and height to draw
                const width = Math.min(WplaceTileWidth - srcX, imageWidth - destX);
                const height = Math.min(WplaceTileHeight - srcY, imageHeight - destY);
                
                ctx.drawImage(
                    tileImage,
                    srcX, srcY, width, height,
                    destX, destY, width, height
                );
            } catch (error) {
                console.error(`Failed to load tile ${tile.x}/${tile.y}:`, error);
                // Draw a placeholder for failed tiles
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(
                    (tile.x - templateData.tlX) * WplaceTileWidth - templateData.pxX,
                    (tile.y - templateData.tlY) * WplaceTileHeight - templateData.pxY,
                    WplaceTileWidth,
                    WplaceTileHeight
                );
            }
        });
        
        // Wait for all tiles to load (or fail)
        await Promise.allSettled(tilePromises);
        
        return canvas;
    }
}
