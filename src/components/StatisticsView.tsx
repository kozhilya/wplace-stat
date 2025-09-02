import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../script/managers/language-manager';
import { WplacePalette } from '../script/wplace';
import { StatisticsRow } from '../script/managers/statistics-manager';

interface StatisticsViewProps {
    statistics?: StatisticsRow[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics = [] }) => {
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
            return <span className="sort-indicator" style={{ opacity: 0.3 }}></span>;
        }
        return (
            <span className="sort-indicator">
                {sortDirection === 'asc' ? '↑' : '↓'}
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
                            {['color', 'total', 'completed', 'percentage', 'remaining'].map((text, index) => (
                                <th 
                                    key={index}
                                    onClick={() => handleHeaderClick(index)}
                                >
                                    <span className="text" data-i18n={text}>
                                        {LanguageManager.getText(text as any)}
                                    </span>
                                    {getSortIndicator(index)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Total row */}
                        {totalTotal > 0 && (
                            <>
                                <tr style={{ fontWeight: 'bold' }}>
                                    <td>{LanguageManager.getText('total')}</td>
                                    <td>{totalTotal.toLocaleString()}</td>
                                    <td>{totalCompleted.toLocaleString()}</td>
                                    <td>{totalPercentage.toFixed(2)}%</td>
                                    <td>{totalRemain.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan={5}>
                                        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ccc' }} />
                                    </td>
                                </tr>
                            </>
                        )}
                        {/* Statistics rows */}
                        {sortedStatistics
                            .filter(row => row.total > 0)
                            .map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <span 
                                            className="color-swatch"
                                            style={{
                                                backgroundColor: `rgb(${row.color?.rgb.join(',') || '0,0,0'})`
                                            }}
                                        />
                                        {row.color?.id}. {row.color?.premium ? '★ ' : ''}{row.color?.name}
                                    </td>
                                    <td>{row.total.toLocaleString()}</td>
                                    <td>{row.completed.toLocaleString()}</td>
                                    <td>{(row.percentage * 100).toFixed(2)}%</td>
                                    <td>{row.remain.toLocaleString()}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};
