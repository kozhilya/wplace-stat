

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

    // Добавь методы по сериализации и десериализации шаблона в формате base64. Нужно сериализовывать только методы, указанные в конструкторе. AI!
}

export class TemplateCollection {
    templates: Template[] = [];


}