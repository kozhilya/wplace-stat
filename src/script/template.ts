import { debug } from './utils';

export interface TileInfo {
    x: number;
    y: number;
}

export class Template {
    name: string;
    tlX: number;
    tlY: number;
    pxX: number;
    pxY: number;
    imageDataUrl: string;

    tiles: TileInfo[] = [];
    imageWidth: number = -1;
    imageHeight: number = -1;
    templateImage: HTMLImageElement | null = null;
    wplaceImage: HTMLImageElement | null = null;

    constructor(name: string, tlX: number, tlY: number, pxX: number, pxY: number, imageDataUrl: string) {
        this.tlX = tlX;
        this.tlY = tlY;
        this.pxX = pxX;
        this.pxY = pxY;
        this.imageDataUrl = imageDataUrl;
        this.name = name;
    }

    // Load the template image using ImageLoaderManager
    async loadTemplateImage(): Promise<void> {
        const { ImageLoaderManager } = await import('./managers/image-loader-manager');
        await ImageLoaderManager.loadTemplateImage(this);
    }

    // Load the Wplace image from the server using ImageLoaderManager
    async loadWplaceImage(): Promise<void> {
        const { ImageLoaderManager } = await import('./managers/image-loader-manager');
        await ImageLoaderManager.loadWplaceImage(this);
    }

    // Serialize to base64
    serialize(): string {
        const data = {
            name: this.name,
            tlX: this.tlX,
            tlY: this.tlY,
            pxX: this.pxX,
            pxY: this.pxY,
            imageDataUrl: this.imageDataUrl
        };
        const jsonString = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    // Deserialize from base64
    static deserialize(base64String: string): Template {
        const jsonString = decodeURIComponent(escape(atob(base64String)));
        const data = JSON.parse(jsonString);
        return new Template(
            data.name,
            data.tlX,
            data.tlY,
            data.pxX,
            data.pxY,
            data.imageDataUrl
        );
    }
}

export class TemplateCollection {
    templates: Template[] = [];

    constructor() {
        this.loadFromLocalStorage();
    }

    addTemplate(template: Template): void {
        this.templates.push(template);
        this.saveToLocalStorage();
    }

    removeTemplate(index: number): void {
        this.templates.splice(index, 1);
        this.saveToLocalStorage();
    }

    getTemplates(): Template[] {
        return [...this.templates];
    }

    private saveToLocalStorage(): void {
        localStorage.setItem('templateCollection', JSON.stringify(this.templates));
    }

    private loadFromLocalStorage(): void {
        const stored = localStorage.getItem('templateCollection');
        if (stored) {
            try {
                const templatesData = JSON.parse(stored);
                this.templates = templatesData.map((data: any) => 
                    new Template(
                        data.name,
                        data.tlX,
                        data.tlY,
                        data.pxX,
                        data.pxY,
                        data.imageDataUrl
                    )
                );
            } catch (error) {
                debug('Error loading templates from localStorage:', error);
                this.templates = [];
            }
        }
    }
}
