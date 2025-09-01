export class CanvasManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    drawImage(img: HTMLImageElement): void {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the image, scaling it to fit the canvas if necessary
        const scale = Math.min(
            this.canvas.width / img.width,
            this.canvas.height / img.height
        );
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (this.canvas.width - width) / 2;
        const y = (this.canvas.height - height) / 2;
        
        this.ctx.drawImage(img, x, y, width, height);
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}
