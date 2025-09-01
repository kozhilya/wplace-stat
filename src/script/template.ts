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
    actualCanvas: HTMLCanvasElement | null = null;

    constructor(name: string, tlX: number, tlY: number, pxX: number, pxY: number, imageDataUrl: string) {
        this.tlX = tlX;
        this.tlY = tlY;
        this.pxX = pxX;
        this.pxY = pxY;
        this.imageDataUrl = imageDataUrl;
        this.name = name;
    }

    // Load the template image
    async loadTemplateImage(): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                this.templateImage = img;
                this.imageWidth = img.width;
                this.imageHeight = img.height;
                resolve();
            };
            img.onerror = reject;
            img.src = this.imageDataUrl;
        });
    }

    // Load the actual canvas from the server
    async loadActualCanvas(): Promise<void> {
        if (!this.templateImage) {
            await this.loadTemplateImage();
        }
                
        // Create template data object matching the expected interface
        const templateData = {
            tlX: this.tlX,
            tlY: this.tlY,
            pxX: this.pxX,
            pxY: this.pxY,
            imageDataUrl: this.imageDataUrl
        };
        
        // Load the actual canvas using TemplateManager
        // this.actualCanvas = await TemplateManager.loadActualCanvas(
        //     templateData, 
        //     this.imageWidth, 
        //     this.imageHeight
        // );
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
                console.error('Error loading templates from localStorage:', error);
                this.templates = [];
            }
        }
    }
}
