import { LanguageManager } from './language-manager';
import { WplacePalette } from './wplace';

export class StatisticsManager {
    static updateStatistics(canvas?: HTMLCanvasElement, occupiedTiles?: any[], templateImage?: HTMLImageElement): void {
        const tableBody = document.querySelector('#stats-table tbody');
        const lastUpdatedElement = document.getElementById('last-updated');
        
        // Update last updated time in header
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }
        
        // Log occupied tiles to console
        if (occupiedTiles && occupiedTiles.length > 0) {
            console.log('Occupied tiles:', occupiedTiles.map(tile => `${tile.x}/${tile.y}`).join(', '));
        }
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            // Add color statistics if canvas and template image are provided
            if (canvas && templateImage) {
                this.addPixelMatchStatistics(tableBody, canvas, templateImage);
                // Set up sorting after adding the data
                this.setupSorting();
            } else if (canvas) {
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
        });
        
        // Set sort indicator on current header
        currentHeader.setAttribute('data-sort', sortDirection);
        
        // Sort rows using data-sort-value attributes
        rows.sort((a, b) => {
            const aValue = parseFloat(a.cells[columnIndex].getAttribute('data-sort-value') || '0');
            const bValue = parseFloat(b.cells[columnIndex].getAttribute('data-sort-value') || '0');
            
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
        
        // Re-add rows in sorted order
        rows.forEach(row => tbody.appendChild(row));
    }

    private static addPixelMatchStatistics(tableBody: Element, actualCanvas: HTMLCanvasElement, templateImage: HTMLImageElement): void {
        // Create a temporary canvas to draw the template image
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = templateImage.width;
        templateCanvas.height = templateImage.height;
        const templateCtx = templateCanvas.getContext('2d');
        if (!templateCtx) return;
        
        // Draw the template image
        templateCtx.drawImage(templateImage, 0, 0);
        
        const actualCtx = actualCanvas.getContext('2d');
        if (!actualCtx) return;
        
        try {
            // Get image data from both canvases
            const templateImageData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            const actualImageData = actualCtx.getImageData(0, 0, actualCanvas.width, actualCanvas.height);
            
            const templateData = templateImageData.data;
            const actualData = actualImageData.data;
            
            // Count matching pixels by color
            const matchCounts = new Map<number, number>();
            
            for (let i = 0; i < templateData.length; i += 4) {
                const templateR = templateData[i];
                const templateG = templateData[i + 1];
                const templateB = templateData[i + 2];
                const templateA = templateData[i + 3];
                
                const actualR = actualData[i];
                const actualG = actualData[i + 1];
                const actualB = actualData[i + 2];
                const actualA = actualData[i + 3];
                
                // Skip transparent pixels in template
                if (templateA === 0) continue;
                
                // Check if pixels match
                if (templateR === actualR && templateG === actualG && templateB === actualB && templateA === actualA) {
                    // Find the closest color in the Wplace palette
                    const colorId = this.findClosestColorId(templateR, templateG, templateB);
                    matchCounts.set(colorId, (matchCounts.get(colorId) || 0) + 1);
                }
            }

            let totalMatches = 0;
            
            // Add total matches row
            WplacePalette.forEach(color => {
                if (color.id !== 0) { // Skip transparent
                    const count = matchCounts.get(color.id) || 0;
                    totalMatches += count;
                }
            });
            
            if (totalMatches > 0) {
                const totalRow = document.createElement('tr');
                totalRow.style.fontWeight = 'bold';
                totalRow.innerHTML = `
                    <td data-sort-value="-1">${LanguageManager.getText('total')} Matches</td>
                    <td data-sort-value="${totalMatches}">${totalMatches.toLocaleString()}</td>
                `;
                tableBody.appendChild(totalRow);
                
                // Add total template pixels for reference
                const templatePixelsRow = document.createElement('tr');
                templatePixelsRow.innerHTML = `
                    <td>Template Pixels</td>
                    <td>${(templateData.length / 4).toLocaleString()}</td>
                `;
                tableBody.appendChild(templatePixelsRow);
                
                // Add separator
                const separatorRow = document.createElement('tr');
                separatorRow.innerHTML = `
                    <td colspan="2"><hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;"></td>
                `;
                tableBody.appendChild(separatorRow);
            }
            
            // Add match statistics to the table
            WplacePalette.forEach(color => {
                if (color.id !== 0) { // Skip transparent
                    const count = matchCounts.get(color.id) || 0;
                    if (count > 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td data-sort-value="${color.id}">
                                <span style="display: inline-block; width: 12px; height: 12px; 
                                             background-color: rgb(${color.rgb.join(',')}); 
                                             margin-right: 5px; border: 1px solid #ccc;"></span>
                                ${color.id}. ${color.premium ? '★ ' : ''}${color.name} Matches
                            </td>
                            <td data-sort-value="${count}">${count.toLocaleString()}</td>
                        `;
                        tableBody.appendChild(row);
                    }
                }
            });
            
            // Set initial sort indicator on value column (descending)
            const valueHeader = document.querySelector('#stats-table thead th:nth-child(2)');
            if (valueHeader) {
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
                    <td data-sort-value="-1">${LanguageManager.getText('total')}</td>
                    <td data-sort-value="${totalPixels}">${totalPixels.toLocaleString()}</td>
                `;
                tableBody.appendChild(totalRow);
            }
            
            // Add color statistics to the table
            WplacePalette.forEach(color => {
                if (color.id !== 0) { // Skip transparent
                    const count = colorCounts.get(color.id) || 0;
                    if (count > 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td data-sort-value="${color.id}">
                                <span style="display: inline-block; width: 12px; height: 12px; 
                                             background-color: rgb(${color.rgb.join(',')}); 
                                             margin-right: 5px; border: 1px solid #ccc;"></span>
                                ${color.id}. ${color.premium ? '★ ' : ''}${color.name}
                            </td>
                            <td data-sort-value="${count}">${count.toLocaleString()}</td>
                        `;
                        tableBody.appendChild(row);
                    }
                }
            });
            
            // Set initial sort indicator on value column (descending)
            const valueHeader = document.querySelector('#stats-table thead th:nth-child(2)');
            if (valueHeader) {
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
