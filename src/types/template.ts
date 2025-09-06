/**
 * Represents a template for wplace image processing
 * Contains information about the template's position, dimensions, and images
 */
import { ImageLoaderManager } from '../managers/image-loader-manager.js';
import { debug } from '../utils.js';

/**
 * Information about a single tile in the wplace grid
 */
export interface TileInfo {
    x: number;
    y: number;
}

/**
 * Represents a template configuration for processing wplace images
 * Manages template metadata, images, and serialization/deserialization
 */
export class Template {
    /** The name of the template */
    name: string;
    /** Top-left tile X coordinate */
    tlX: number;
    /** Top-left tile Y coordinate */
    tlY: number;
    /** Pixel X offset within the starting tile */
    pxX: number;
    /** Pixel Y offset within the starting tile */
    pxY: number;
    /** Data URL of the template image */
    imageDataUrl: string;

    /** Array of tile information */
    tiles: TileInfo[] = [];
    /** Width of the template image in pixels */
    imageWidth: number = -1;
    /** Height of the template image in pixels */
    imageHeight: number = -1;
    /** Loaded template image element */
    templateImage: HTMLImageElement | null = null;
    /** Loaded wplace image element */
    wplaceImage: HTMLImageElement | null = null;

    /**
     * Creates a new Template instance
     * @param name The name of the template
     * @param tlX Top-left tile X coordinate
     * @param tlY Top-left tile Y coordinate
     * @param pxX Pixel X offset within the starting tile
     * @param pxY Pixel Y offset within the starting tile
     * @param imageDataUrl Data URL of the template image
     */
    constructor(name: string, tlX: number, tlY: number, pxX: number, pxY: number, imageDataUrl: string) {
        debug('[Template.constructor] Creating new template');
        this.tlX = tlX;
        this.tlY = tlY;
        this.pxX = pxX;
        this.pxY = pxY;
        this.imageDataUrl = imageDataUrl;
        this.name = name;
        debug(`[Template.constructor] Template "${name}" created with coordinates (${tlX},${tlY}) and offset (${pxX},${pxY})`);
    }

    /**
     * Loads the template image using ImageLoaderManager
     * @returns Promise that resolves when the template image is loaded
     */
    async loadTemplateImage(): Promise<void> {
        debug(`[Template.loadTemplateImage] Loading template image for "${this.name}"`);
        await ImageLoaderManager.loadTemplateImage(this);
        debug(`[Template.loadTemplateImage] Template image loaded for "${this.name}": ${this.imageWidth}x${this.imageHeight}`);
    }

    /**
     * Loads the Wplace image from the server using ImageLoaderManager
     * @returns Promise that resolves when the wplace image is loaded
     */
    async loadWplaceImage(): Promise<void> {
        debug(`[Template.loadWplaceImage] Loading wplace image for template "${this.name}"`);
        await ImageLoaderManager.loadWplaceImage(this);
        if (this.wplaceImage) {
            debug(`[Template.loadWplaceImage] Wplace image loaded for template "${this.name}": ${this.wplaceImage.width}x${this.wplaceImage.height}`);
        } else {
            debug(`[Template.loadWplaceImage] Failed to load wplace image for template "${this.name}"`);
        }
    }

    /**
     * Serializes the template to a base64 string
     * @returns Base64-encoded string representation of the template
     */
    serialize(): string {
        debug(`[Template.serialize] Serializing template "${this.name}"`);
        const data = {
            name: this.name,
            tlX: this.tlX,
            tlY: this.tlY,
            pxX: this.pxX,
            pxY: this.pxY,
            imageDataUrl: this.imageDataUrl
        };
        const jsonString = JSON.stringify(data);
        const result = btoa(unescape(encodeURIComponent(jsonString)));
        debug(`[Template.serialize] Template "${this.name}" serialized to ${result.length} characters`);
        return result;
    }

    /**
     * Deserializes a template from a base64 string
     * @param base64String Base64-encoded string representation of the template
     * @returns New Template instance
     */
    static deserialize(base64String: string): Template {
        debug('[Template.deserialize] Deserializing template from base64 string');
        const jsonString = decodeURIComponent(escape(atob(base64String)));
        const data = JSON.parse(jsonString);
        const template = new Template(
            data.name,
            data.tlX,
            data.tlY,
            data.pxX,
            data.pxY,
            data.imageDataUrl
        );
        debug(`[Template.deserialize] Template "${data.name}" deserialized successfully`);
        return template;
    }
}


