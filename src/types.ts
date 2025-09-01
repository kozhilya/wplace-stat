export interface TemplateData {
    tlX: number;
    tlY: number;
    pxX: number;
    pxY: number;
    imageDataUrl: string;
}

export interface TileInfo {
    x: number;
    y: number;
}

export interface TemplateAnalysis {
    tiles: TileInfo[];
    imageWidth?: number;
    imageHeight?: number;
}
