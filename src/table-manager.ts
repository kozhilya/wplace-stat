import { LanguageManager } from './language-manager';
import { WplacePalette } from './wplace';
import { StatisticsRow } from './statistics-manager';

export class TableManager {
    static updateTable(statistics: StatisticsRow[]): void {
        const tableBody = document.querySelector('#stats-table tbody');
        const lastUpdatedElement = document.getElementById('last-updated');

        // Update last updated time in header
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }

        if (tableBody) {
            tableBody.innerHTML = '';

            // Calculate totals
            let totalTotal = 0;
            let totalCompleted = 0;
            
            statistics.forEach(row => {
                totalTotal += row.total;
                totalCompleted += row.completed;
            });

            // Add total row
            if (totalTotal > 0) {
                const totalRow = document.createElement('tr');
                totalRow.style.fontWeight = 'bold';
                totalRow.innerHTML = `
                    <td data-sort-value="-1">${LanguageManager.getText('total')}</td>
                    <td data-sort-value="${totalTotal}">${totalTotal.toLocaleString()}</td>
                    <td data-sort-value="${totalCompleted}">${totalCompleted.toLocaleString()}</td>
                    <td data-sort-value="${totalCompleted / totalTotal}">${((totalCompleted / totalTotal) * 100).toFixed(2)}%</td>
                    <td data-sort-value="${totalTotal - totalCompleted}">${(totalTotal - totalCompleted).toLocaleString()}</td>
                `;
                tableBody.appendChild(totalRow);

                // Add separator
                const separatorRow = document.createElement('tr');
                separatorRow.innerHTML = `
                    <td colspan="5"><hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;"></td>
                `;
                tableBody.appendChild(separatorRow);
            }

            // Add statistics rows
            statistics.forEach(row => {
                if (row.total > 0) {
                    const tableRow = document.createElement('tr');
                    tableRow.innerHTML = `
                        <td data-sort-value="${row.color?.id || 0}">
                            <span style="display: inline-block; width: 12px; height: 12px; 
                                         background-color: rgb(${row.color?.rgb.join(',') || '0,0,0'}); 
                                         margin-right: 5px; border: 1px solid #ccc;"></span>
                            ${row.color?.id}. ${row.color?.premium ? '★ ' : ''}${row.color?.name}
                        </td>
                        <td data-sort-value="${row.total}">${row.total.toLocaleString()}</td>
                        <td data-sort-value="${row.completed}">${row.completed.toLocaleString()}</td>
                        <td data-sort-value="${row.percentage}">${(row.percentage * 100).toFixed(2)}%</td>
                        <td data-sort-value="${row.remain}">${row.remain.toLocaleString()}</td>
                    `;
                    tableBody.appendChild(tableRow);
                }
            });

            // Set up sorting
            this.setupSorting();
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
}
