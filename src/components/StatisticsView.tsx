import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../script/managers/language-manager';
import { WplacePalette } from '../script/wplace';
import { StatisticsRow } from '../script/managers/statistics-manager';

interface StatisticsViewProps {
    statistics?: StatisticsRow[];
    onRowClick?: (colorId: number | null) => void;
    selectedColorId?: number | null;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics = [], onRowClick, selectedColorId }) => {
    const [sortColumn, setSortColumn] = useState<number>(1); // Default to Total column (index 1)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default to descending
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Update last updated time when statistics change
    useEffect(() => {
        setLastUpdated(new Date());
    }, [statistics]);

    // Calculate totals
    const totalTotal = statistics.reduce((sum, row) => sum + row.total, 0);
    const totalCompleted = statistics.reduce((sum, row) => sum + row.completed, 0);
    const totalPercentage = totalTotal > 0 ? (totalCompleted / totalTotal) * 100 : 0;
    const totalRemain = totalTotal - totalCompleted;

    // Sort statistics
    const sortedStatistics = [...statistics].sort((a, b) => {
        if (sortColumn === -1) return 0;
        
        let aValue: number;
        let bValue: number;
        
        switch (sortColumn) {
            case 0: // Color
                aValue = a.color?.id || 0;
                bValue = b.color?.id || 0;
                break;
            case 1: // Total
                aValue = a.total;
                bValue = b.total;
                break;
            case 2: // Completed
                aValue = a.completed;
                bValue = b.completed;
                break;
            case 3: // Percentage
                aValue = a.percentage;
                bValue = b.percentage;
                break;
            case 4: // Remaining
                aValue = a.remain;
                bValue = b.remain;
                break;
            default:
                return 0;
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const handleHeaderClick = (columnIndex: number) => {
        if (sortColumn === columnIndex) {
            // Toggle direction if clicking the same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to descending
            setSortColumn(columnIndex);
            setSortDirection('desc');
        }
    };

    const getSortIndicator = (columnIndex: number) => {
        if (sortColumn !== columnIndex) {
            return <span className="sort-indicator" style={{ opacity: 0.3 }}>
                <i className="fas fa-sort"></i>
            </span>;
        }
        return (
            <span className="sort-indicator">
                {sortDirection === 'asc' ? 
                    <i className="fas fa-sort-up"></i> : 
                    <i className="fas fa-sort-down"></i>
                }
            </span>
        );
    };

    return (
        <div className="statistics">
            <h2 data-i18n="statistics">Statistics</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {['color', 'total', 'completed', 'percentage', 'remaining'].map((text, index) => {
                                let sortAttr = '';
                                if (sortColumn === index) {
                                    sortAttr = sortDirection === 'asc' ? 'asc' : 'desc';
                                }
                                return (
                                    <th 
                                        key={index}
                                        onClick={() => handleHeaderClick(index)}
                                        className={index > 0 ? 'number-column' : ''}
                                        data-sort={sortAttr || undefined}
                                    >
                                        <span className="text" data-i18n={text}>
                                            {LanguageManager.getText(text as any)}
                                        </span>
                                        {getSortIndicator(index)}
                                    </th>
                                );
                            })}
                            <th className="scroll-fix"></th>
                        </tr>
                        {/* Total row in thead to avoid indentation */}
                        {totalTotal > 0 && (
                            <tr className="statistics-total-row" onClick={() => onRowClick?.(null)}>
                                <td>{LanguageManager.getText('total')}</td>
                                <td className="number-column">{totalTotal.toLocaleString()}</td>
                                <td className="number-column">{totalCompleted.toLocaleString()}</td>
                                <td className="number-column">{totalPercentage.toFixed(2)}%</td>
                                <td className="number-column">{totalRemain.toLocaleString()}</td>
                                <td className="scroll-fix"></td>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {/* Statistics rows */}
                        {sortedStatistics
                            .filter(row => row.total > 0)
                            .map((row, index) => (
                                <tr 
                                    key={index} 
                                    onClick={() => onRowClick?.(row.color?.id ?? null)}
                                    className={row.color?.id === selectedColorId ? 'selected-row' : ''}
                                >
                                    <td>
                                        <span 
                                            className="color-swatch"
                                            style={{
                                                backgroundColor: `rgb(${row.color?.rgb.join(',') || '0,0,0'})`,
                                                '--color-rgb': row.color?.rgb.join(',') || '0,0,0'
                                            } as React.CSSProperties}
                                        />
                                        <span className="color-name">
                                            {row.color?.id}. {row.color?.premium ? '★ ' : ''}{row.color?.name}
                                        </span>
                                    </td>
                                    <td className="number-column">{row.total.toLocaleString()}</td>
                                    <td className="number-column">{row.completed.toLocaleString()}</td>
                                    <td className="number-column">{(row.percentage * 100).toFixed(2)}%</td>
                                    <td className="number-column">{row.remain.toLocaleString()}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};
