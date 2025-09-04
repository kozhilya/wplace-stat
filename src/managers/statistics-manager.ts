import { WplaceColorDefinition, WplacePalette } from '../settings';
import { debug } from '../utils';
import { Color } from "../color";

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
        const result = (this.total > 0) ? this.completed / this.total : 1;
        return result;
    }

    /**
     * Gets the number of remaining pixels to be placed for this color
     * @returns The difference between total and completed pixels
     */
    public get remain(): number {
        const result = this.total - this.completed;
        return result;
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

    private wplaceImage: HTMLImageElement;

    /** Array of statistics rows for each color */
    private statistics: StatisticsRow[] = [];

    /**
     * Creates a new StatisticsManager instance
     * @param templateImage The template image to use for comparison
     * @param wplaceImage The actual canvas/image showing current progress
     */
    constructor(templateImage: HTMLImageElement, wplaceImage: HTMLImageElement) {
        debug('[StatisticsManager.constructor] Initializing StatisticsManager');

        if ((templateImage.width !== wplaceImage.width) || (templateImage.height !== wplaceImage.height)) {
            throw new Error("Template and Wplace image dimensions mismatch");
        }

        debug(`[StatisticsManager.constructor] Template and Wplace image dimensions: ${templateImage.width}x${templateImage.height}`);

        this.templateImage = templateImage;
        this.wplaceImage = wplaceImage;
        
        this.updateStatistics();
    }

    /**
     * Triggers a recalculation of all statistics
     * Should be called when the actual canvas has been updated
     */
    updateStatistics(): void {
        debug('[StatisticsManager.updateStatistics] Updating statistics');
        debug(`[StatisticsManager.updateStatistics] Template ready: ${this.templateImage.complete ? 'Yes' : 'No'}`);
        debug(`[StatisticsManager.updateStatistics] Actual canvas ready: ${this.wplaceImage.complete ? 'Yes' : 'No'}`);
        this.calculateStatistics();
    }

    setWplaceImage(wplaceImage: HTMLImageElement): void {
        debug('[StatisticsManager.setWplaceImage] Setting new Wplace image');
        this.wplaceImage = wplaceImage;
        this.updateStatistics();
    }

    /**
     * Gets the current statistics data
     * @returns Array of StatisticsRow objects containing progress information for each color
     */
    getStatistics(): StatisticsRow[] {
        debug('[StatisticsManager.getStatistics] Retrieving statistics');
        debug(`[StatisticsManager.getStatistics] Returning ${this.statistics.length} statistics rows`);
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
        debug('[StatisticsManager.calculateStatistics] Reset statistics array');
        
        // Initialize all colors
        WplacePalette.forEach(color => {
            if (color.id !== 0) { // Skip transparent
                this.statistics.push(new StatisticsRow(color));
                debug(`[StatisticsManager.calculateStatistics] Added statistics row for color ID: ${color.id} (${color.name})`);
            }
        });
        debug(`[StatisticsManager.calculateStatistics] Initialized ${this.statistics.length} color statistics`);

        // Create a temporary canvas to draw the template image
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = this.templateImage.width;
        templateCanvas.height = this.templateImage.height;
        const templateCtx = templateCanvas.getContext('2d');
        if (!templateCtx) {
            throw new Error("Can't create context for template canvas");
        }
        templateCtx.drawImage(this.templateImage, 0, 0);
        debug('[StatisticsManager.calculateStatistics] Successfully obtained template canvas context');

        const wplaceCanvas = document.createElement('canvas');
        wplaceCanvas.width = this.templateImage.width;
        wplaceCanvas.height = this.templateImage.height;
        const wplaceCtx = wplaceCanvas.getContext('2d');
        if (!wplaceCtx) {
            throw new Error("Can't create context for template canvas");
        }
        wplaceCtx.drawImage(this.wplaceImage, 0, 0);
        debug('[StatisticsManager.calculateStatistics] Successfully obtained wplace canvas context');

        try {
            debug('[StatisticsManager.calculateStatistics] Retrieving image data');
            const templateImageData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            const wplaceImageData = wplaceCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            
            debug('[StatisticsManager.calculateStatistics] Processing image data');
            const templateData = templateImageData.data;
            const wplaceData = wplaceImageData.data;

            debug(`[StatisticsManager.calculateStatistics] Total pixels to process: ${templateData.length / 4}`);

            // Process each pixel
            let processedPixels = 0;
            let transparentPixels = 0;
            let matchedPixels = 0;
            
            for (let i = 0; i < templateData.length; i += 4) {
                const templateColor = Color.fromImageData(templateData, i);

                // Skip transparent pixels in template
                if (templateColor.a === 0) {
                    transparentPixels++;
                    continue;
                }

                // Find the closest color in the Wplace palette for the template pixel
                const templateColorId = this.findColorId(templateColor);

                // Update total count
                const templateRow = this.statistics.find(row => row.color?.id === templateColorId);
                if (templateRow) {
                    templateRow.total++;
                }

                // Check if pixels match
                const wplaceColor = Color.fromImageData(wplaceData, i);
                
                if (templateColor.compareTo(wplaceColor)) {
                    // Update completed count
                    if (templateRow) {
                        templateRow.completed++;
                        matchedPixels++;
                    }
                }
                processedPixels++;
                
                // Log progress every 10000 pixels to avoid flooding
                if (processedPixels % 10000 === 0) {
                    debug(`[StatisticsManager.calculateStatistics] Processed ${processedPixels} pixels so far`);
                }
            }
            debug(`[StatisticsManager.calculateStatistics] Total processed pixels: ${processedPixels}`);
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
     * @param color Color to search
     * @returns The ID of the closest matching color in the Wplace palette
     */
    private findColorId(color: Color): number {
        for (const palette of WplacePalette) {
            // Skip transparent
            if (palette.id === 0) continue;

            if (color.compareTo(palette.color)) {
                return palette.id;
            }
        }

        return 0;
    }
}
