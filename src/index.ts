import './styles/main.scss';

interface TemplateData {
    tlX: number;
    tlY: number;
    pxX: number;
    pxY: number;
    imageDataUrl: string;
}

class App {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.initializeCanvas();
        this.updateStatistics();
        this.loadFromHash();
    }

    private setupEventListeners(): void {
        const templateForm = document.getElementById('template-form') as HTMLFormElement;
        templateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleTemplateSubmit(event);
        });
    }

    private handleTemplateSubmit(event: Event): void {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const tlX = parseInt((document.getElementById('tl-x') as HTMLInputElement).value);
        const tlY = parseInt((document.getElementById('tl-y') as HTMLInputElement).value);
        const pxX = parseInt((document.getElementById('px-x') as HTMLInputElement).value);
        const pxY = parseInt((document.getElementById('px-y') as HTMLInputElement).value);
        
        const imageInput = document.getElementById('template-image') as HTMLInputElement;
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const templateData: TemplateData = {
                    tlX,
                    tlY,
                    pxX,
                    pxY,
                    imageDataUrl: e.target?.result as string
                };
                
                // Convert to base64 string for the URL hash
                const jsonData = JSON.stringify(templateData);
                const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
                window.location.hash = base64Data;
                
                // Draw the image
                const img = new Image();
                img.onload = () => {
                    this.drawImageOnCanvas(img);
                    this.updateStatistics();
                };
                img.src = templateData.imageDataUrl;
            };
            reader.readAsDataURL(imageInput.files[0]);
        }
    }

    private loadFromHash(): void {
        if (window.location.hash) {
            const base64Data = window.location.hash.substring(1);
            try {
                const jsonData = decodeURIComponent(escape(atob(base64Data)));
                const templateData: TemplateData = JSON.parse(jsonData);
                
                // Fill the form
                (document.getElementById('tl-x') as HTMLInputElement).value = templateData.tlX.toString();
                (document.getElementById('tl-y') as HTMLInputElement).value = templateData.tlY.toString();
                (document.getElementById('px-x') as HTMLInputElement).value = templateData.pxX.toString();
                (document.getElementById('px-y') as HTMLInputElement).value = templateData.pxY.toString();
                
                // Draw the image
                const img = new Image();
                img.onload = () => {
                    this.drawImageOnCanvas(img);
                    this.updateStatistics();
                };
                img.src = templateData.imageDataUrl;
            } catch (error) {
                console.error('Error loading data from hash:', error);
            }
        }
    }

    private initializeCanvas(): void {
        this.canvas = document.getElementById('template-canvas') as HTMLCanvasElement;
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            // Set initial canvas size
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
    }

    private drawImageOnCanvas(img: HTMLImageElement): void {
        if (!this.canvas || !this.ctx) return;
        
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
        
        // Here you can add additional drawing operations for transformations
        // For example, drawing a grid, highlighting areas, etc.
    }

    private updateStatistics(): void {
        const tableBody = document.querySelector('#stats-table tbody');
        if (tableBody) {
            // Sample statistics - replace with actual data from your tracking
            const stats = [
                { metric: 'Pixels Drawn', value: '1,234/10,000' },
                { metric: 'Completion', value: '12.34%' },
                { metric: 'Last Updated', value: new Date().toLocaleTimeString() },
                // Add more statistics here
            ];
            
            tableBody.innerHTML = '';
            stats.forEach(stat => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stat.metric}</td>
                    <td>${stat.value}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

new App();
