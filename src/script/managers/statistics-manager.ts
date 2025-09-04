// Создай больше `debug`-сообщений. Добавь префиксом в квадратных скобках класс и метод, в котором выводит сообщение. AI!

import { WplaceColorDefinition, WplacePalette } from '../wplace';
import { debug } from '../../utils';

/**
 * Represents a statistics row for a specific color in the template
 * Tracks the number of pixels that should be this color vs how many are correctly placed
 */
export class StatisticsRow {
    /** The color definition from the Wplace palette, or null for special cases */
    public color: WplaceColorDefinition | null;

    /** Total number of pixels in the template that should be this color */
    public total: number = 0;

    /** Number of pixels that are correctly placed with this color */
    public completed: number = 0;

    /**
     * Gets the completion percentage for this color (0 to 1)
     * @returns The ratio of completed pixels to total pixels, or 1 if total is 0
     */
    public get percentage(): number {
        return (this.total > 0) ? this.completed / this.total : 1;
    }

    /**
     * Gets the number of remaining pixels to be placed for this color
     * @returns The difference between total and completed pixels
     */
    public get remain(): number {
        return this.total - this.completed;
    }

    /**
     * Creates a new StatisticsRow for a specific color
     * @param color The color definition from Wplace palette
     */
    constructor(color: WplaceColorDefinition | null) {
        this.color = color;
    }
};

/**
 * Manages the calculation and tracking of statistics for template completion
 * Compares the template image with the actual canvas to determine progress
 */
export class StatisticsManager {
    /** The template image to compare against */
    private templateImage: HTMLImageElement;
    /** Canvas containing the actual pixel data from the current state */
    private actualCanvas: HTMLCanvasElement;
    /** Array of statistics rows for each color */
    private statistics: StatisticsRow[] = [];

    /**
     * Creates a new StatisticsManager instance
     * @param templateImage The template image to use for comparison
     * @param actualCanvas The actual canvas/image showing current progress
     */
    constructor(templateImage: HTMLImageElement, actualCanvas: HTMLImageElement) {
        debug('[StatisticsManager.constructor] Initializing StatisticsManager');
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

    /**
     * Triggers a recalculation of all statistics
     * Should be called when the actual canvas has been updated
     */
    updateStatistics(): void {
        debug('[StatisticsManager.updateStatistics] Updating statistics');
        this.calculateStatistics();
    }

    /**
     * Updates the actual canvas used for comparison and recalculates statistics
     * @param actualCanvas The new actual canvas/image to use for comparison
     */
    setActualCanvas(actualCanvas: HTMLImageElement): void {
        debug('[StatisticsManager.setActualCanvas] Setting new actual canvas');
        // Convert the image to a canvas for pixel analysis
        const canvas = document.createElement('canvas');
        canvas.width = actualCanvas.width;
        canvas.height = actualCanvas.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(actualCanvas, 0, 0);
        this.actualCanvas = canvas;
        this.updateStatistics();
    }

    /**
     * Gets the current statistics data
     * @returns Array of StatisticsRow objects containing progress information for each color
     */
    getStatistics(): StatisticsRow[] {
        debug('[StatisticsManager.getStatistics] Retrieving statistics');
        return this.statistics;
    }

    /**
     * Calculates statistics by comparing the template image with the actual canvas
     * Counts total and completed pixels for each color in the Wplace palette
     * Resets and repopulates the statistics array
     */
    private calculateStatistics(): void {
        debug('[StatisticsManager.calculateStatistics] Starting statistics calculation');
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
            debug('[StatisticsManager.calculateStatistics] Images not ready for analysis - skipping');
            debug(`[StatisticsManager.calculateStatistics] Template dimensions: ${this.templateImage.width}x${this.templateImage.height}`);
            debug(`[StatisticsManager.calculateStatistics] Actual canvas dimensions: ${this.actualCanvas.width}x${this.actualCanvas.height}`);
            return;
        }

        // Create a temporary canvas to draw the template image
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = this.templateImage.width;
        templateCanvas.height = this.templateImage.height;
        const templateCtx = templateCanvas.getContext('2d');
        if (!templateCtx) {
            debug('[StatisticsManager.calculateStatistics] Could not get template canvas context');
            return;
        }

        // Draw the template image
        templateCtx.drawImage(this.templateImage, 0, 0);

        const actualCtx = this.actualCanvas.getContext('2d');
        if (!actualCtx) {
            debug('[StatisticsManager.calculateStatistics] Could not get actual canvas context');
            return;
        }

        try {
            // Get image data from both canvases
            // We need to ensure they're the same size, so we'll use the template dimensions
            const templateImageData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            debug(`[StatisticsManager.calculateStatistics] Template image data size: ${templateImageData.data.length} bytes`);

            // Scale actual canvas to match template dimensions if necessary
            // Create a temporary canvas to scale the actual image to match template dimensions
            const scaledActualCanvas = document.createElement('canvas');
            scaledActualCanvas.width = templateCanvas.width;
            scaledActualCanvas.height = templateCanvas.height;
            const scaledActualCtx = scaledActualCanvas.getContext('2d');
            if (!scaledActualCtx) {
                debug('[StatisticsManager.calculateStatistics] Could not get scaled actual canvas context');
                return;
            }
            
            // Draw the actual canvas scaled to match template dimensions
            scaledActualCtx.drawImage(this.actualCanvas, 0, 0, templateCanvas.width, templateCanvas.height);
            const actualImageData = scaledActualCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            debug(`[StatisticsManager.calculateStatistics] Actual image data size: ${actualImageData.data.length} bytes`);
            debug('[StatisticsManager.calculateStatistics] Processing image data');

            const templateData = templateImageData.data;
            const actualData = actualImageData.data;

            // Process each pixel
            let processedPixels = 0;
            let transparentPixels = 0;
            let matchedPixels = 0;
            for (let i = 0; i < templateData.length; i += 4) {
                const templateR = templateData[i];
                const templateG = templateData[i + 1];
                const templateB = templateData[i + 2];
                const templateA = templateData[i + 3];

                // Skip transparent pixels in template
                if (templateA === 0) {
                    transparentPixels++;
                    continue;
                }

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
                        matchedPixels++;
                    }
                }
                processedPixels++;
            }
            debug(`[StatisticsManager.calculateStatistics] Processed ${processedPixels} pixels`);
            debug(`[StatisticsManager.calculateStatistics] Transparent pixels: ${transparentPixels}`);
            debug(`[StatisticsManager.calculateStatistics] Matched pixels: ${matchedPixels}`);
            
            // Log statistics summary
            this.statistics.forEach(row => {
                if (row.total > 0) {
                    debug(`[StatisticsManager.calculateStatistics] Color ${row.color?.id}: ${row.completed}/${row.total} (${(row.percentage * 100).toFixed(2)}%)`);
                }
            });
        } catch (error) {
            debug('[StatisticsManager.calculateStatistics] Could not analyze image:', error);
        }
        debug('[StatisticsManager.calculateStatistics] Statistics calculation completed');
    }

    /**
     * Finds the closest matching color ID from the Wplace palette for a given RGB value
     * @param r Red component (0-255)
     * @param g Green component (0-255)
     * @param b Blue component (0-255)
     * @returns The ID of the closest matching color in the Wplace palette
     */
    private findClosestColorId(r: number, g: number, b: number): number {
        debug(`[StatisticsManager.findClosestColorId] Finding closest color for RGB(${r}, ${g}, ${b})`);
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
        debug(`[StatisticsManager.findClosestColorId] Closest color ID: ${closestColorId}, distance: ${minDistance}`);

        return closestColorId;
    }

    /**
     * Calculates the Euclidean distance between two RGB colors
     * @param r1 Red component of first color (0-255)
     * @param g1 Green component of first color (0-255)
     * @param b1 Blue component of first color (0-255)
     * @param r2 Red component of second color (0-255)
     * @param g2 Green component of second color (0-255)
     * @param b2 Blue component of second color (0-255)
     * @returns The Euclidean distance between the two colors
     */
    private colorDistance(r1: number, g1: number, b1: number,
        r2: number, g2: number, b2: number): number {
        return Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );
    }
}
