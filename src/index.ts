import './styles/main.scss';

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
    }

    private setupEventListeners(): void {
        const imageUpload = document.getElementById('image-upload') as HTMLInputElement;
        imageUpload.addEventListener('change', (event) => {
            this.handleImageUpload(event);
        });
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

    private handleImageUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.drawImageOnCanvas(img);
                    this.updateStatistics();
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
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
