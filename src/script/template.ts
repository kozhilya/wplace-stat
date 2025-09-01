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

    constructor(name: string, tlX: number, tlY: number, pxX: number, pxY: number, imageDataUrl: string) {
        this.tlX = tlX;
        this.tlY = tlY;
        this.pxX = pxX;
        this.pxY = pxY;
        this.imageDataUrl = imageDataUrl;
        this.name = name;
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


}
