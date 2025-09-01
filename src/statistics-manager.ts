import { LanguageManager } from './language-manager';
import { WplacePalette } from './wplace';

export class StatisticsManager {
    static updateStatistics(canvas?: HTMLCanvasElement): void {
        const tableBody = document.querySelector('#stats-table tbody');
        const lastUpdatedElement = document.getElementById('last-updated');
        
        // Update last updated time in header
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            // Add color statistics if canvas is provided
            if (canvas) {
                this.addColorStatistics(tableBody, canvas);
                // Set up sorting after adding the data
                this.setupSorting();
            }
        }
    }

    private static setupSorting(): void {
        const headers = document.querySelectorAll('#stats-table thead th');
        headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                this.sortTable(index);
            });
        });
    }

    private static sortTable(columnIndex: number): void {
        const table = document.getElementById('stats-table');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const headers = table.querySelectorAll('thead th');
        
        // Determine sort direction
        let sortDirection = 'desc';
        const currentHeader = headers[columnIndex];
        if (currentHeader.getAttribute('data-sort') === 'desc') {
            sortDirection = 'asc';
        }
        
        // Update sort indicators on all headers
        headers.forEach(header => {
            header.removeAttribute('data-sort');
            header.textContent = header.textContent?.replace(' ▲', '').replace(' ▼', '') || '';
        });
        
        // Set sort indicator on current header
        const sortIndicator = sortDirection === 'asc' ? ' ▲' : ' ▼';
        currentHeader.textContent = (currentHeader.textContent?.replace(' ▲', '').replace(' ▼', '') || '') + sortIndicator;
        currentHeader.setAttribute('data-sort', sortDirection);
        
        // Sort rows
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent || '';
            const bValue = b.cells[columnIndex].textContent || '';
            
            // For the value column, parse numbers
            if (columnIndex === 1) {
                const aNum = parseInt(aValue.replace(/,/g, '')) || 0;
                const bNum = parseInt(bValue.replace(/,/g, '')) || 0;
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            } else {
                // For the metric column, sort alphabetically
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue) 
                    : bValue.localeCompare(aValue);
            }
        });
        
        // Re-add rows in sorted order
        rows.forEach(row => tbody.appendChild(row));
    }

    private static addColorStatistics(tableBody: Element, canvas: HTMLCanvasElement): void {
        // Get image data from canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Count pixels by color
            const colorCounts = new Map<number, number>();
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                // Skip transparent pixels
                if (a === 0) continue;
                
                // Find the closest color in the Wplace palette
                const colorId = this.findClosestColorId(r, g, b);
                colorCounts.set(colorId, (colorCounts.get(colorId) || 0) + 1);
            }

            let totalPixels = 0;
            
            // Add total row first
            // First pass to calculate total
            WplacePalette.forEach(color => {
                if (color.id !== 0) { // Skip transparent
                    const count = colorCounts.get(color.id) || 0;
                    totalPixels += count;
                }
            });
            
            if (totalPixels > 0) {
                const totalRow = document.createElement('tr');
                totalRow.style.fontWeight = 'bold';
                totalRow.innerHTML = `
                    <td>${LanguageManager.getText('total')}</td>
                    <td>${totalPixels.toLocaleString()}</td>
                `;
                tableBody.appendChild(totalRow);
            }
            
            // Collect all color rows to sort them by count in descending order
            const colorRows: { count: number; html: string }[] = [];
            WplacePalette.forEach(color => {
                if (color.id !== 0) { // Skip transparent
                    const count = colorCounts.get(color.id) || 0;
                    if (count > 0) {
                        colorRows.push({
                            count,
                            html: `
                                <td>
                                    <span style="display: inline-block; width: 12px; height: 12px; 
                                                 background-color: rgb(${color.rgb.join(',')}); 
                                                 margin-right: 5px; border: 1px solid #ccc;"></span>
                                    ${color.id}. ${color.premium ? '★ ' : ''}${color.name}
                                </td>
                                <td>${count.toLocaleString()}</td>
                            `
                        });
                    }
                }
            });
            
            // Sort by count in descending order
            colorRows.sort((a, b) => b.count - a.count);
            
            // Add sorted rows to the table
            colorRows.forEach(colorRow => {
                const row = document.createElement('tr');
                row.innerHTML = colorRow.html;
                tableBody.appendChild(row);
            });
            
            // Set initial sort indicator on value column (descending)
            const valueHeader = document.querySelector('#stats-table thead th:nth-child(2)');
            if (valueHeader) {
                valueHeader.textContent = (valueHeader.textContent || '') + ' ▼';
                valueHeader.setAttribute('data-sort', 'desc');
            }
        } catch (error) {
            console.error('Could not analyze image due to CORS restrictions:', error);
            // Add a message to the statistics table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="2" style="color: #999; font-style: italic;">
                    ${LanguageManager.getText('corsRestrictionMessage')}
                </td>
            `;
            tableBody.appendChild(row);
        }
    }

    private static findClosestColorId(r: number, g: number, b: number): number {
        let minDistance = Infinity;
        let closestColorId = 1; // Default to Black
        
        for (const color of WplacePalette) {
            // Skip transparent
            if (color.id === 0) continue;
            
            const distance = this.colorDistance(r, g, b, color.rgb[0], color.rgb[1], color.rgb[2]);
            if (distance < minDistance) {
                minDistance = distance;
                closestColorId = color.id;
            }
        }
        
        return closestColorId;
    }

    private static colorDistance(r1: number, g1: number, b1: number, 
                                r2: number, g2: number, b2: number): number {
        return Math.sqrt(
            Math.pow(r2 - r1, 2) + 
            Math.pow(g2 - g1, 2) + 
            Math.pow(b2 - b1, 2)
        );
    }
}
