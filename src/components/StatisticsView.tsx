import React from 'react';
import { LanguageManager } from '../managers/language-manager';
import { StatisticsRow } from '../managers/statistics-manager';
import { debug } from '../utils';

interface StatisticsViewProps {
    statistics?: StatisticsRow[];
    onRowClick?: (colorId: number | null) => void;
    selectedColorId?: number | null;
}

interface StatisticsViewState {
    sortColumn: number;
    sortDirection: 'asc' | 'desc';
    lastUpdated: Date;
    hideCompleted: boolean;
    language: string;
}

/**
 * Class component for displaying statistics in a sortable table
 * Handles sorting, filtering, and interaction with statistics data
 */
export class StatisticsView extends React.Component<StatisticsViewProps, StatisticsViewState> {
    /**
     * Creates a new StatisticsView instance
     * @param props Component properties
     */
    constructor(props: StatisticsViewProps) {
        super(props);
        debug('[StatisticsView.constructor] Creating StatisticsView instance');
        
        this.state = {
            sortColumn: 1, // Default to Total column (index 1)
            sortDirection: 'desc', // Default to descending
            lastUpdated: new Date(),
            hideCompleted: false,
            language: LanguageManager.getCurrentLanguage()
        };
    }

    /**
     * Handles language change events from EventManager
     * Updates the component state with the new language
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[StatisticsView.handleLanguageChangeEvent] Language changed, updating state');
        this.setState({ language: args.targetLanguage });
    }

    /**
     * Handles header click events for sorting columns
     * @param columnIndex The index of the column to sort by
     */
    private handleHeaderClick(columnIndex: number): void {
        debug(`[StatisticsView.handleHeaderClick] Header clicked for column index: ${columnIndex}`);
        if (this.state.sortColumn === columnIndex) {
            // Toggle direction if clicking the same column
            const newDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
            debug(`[StatisticsView.handleHeaderClick] Toggling sort direction to: ${newDirection}`);
            this.setState({ sortDirection: newDirection });
        } else {
            // Set new column and default to descending
            debug(`[StatisticsView.handleHeaderClick] Setting sort column to: ${columnIndex} with direction: desc`);
            this.setState({ 
                sortColumn: columnIndex,
                sortDirection: 'desc'
            });
        }
    }

    /**
     * Handles hide completed button click
     * Toggles the hide completed filter
     */
    private handleHideCompletedToggle(): void {
        debug(`[StatisticsView.handleHideCompletedToggle] Toggling hide completed from ${this.state.hideCompleted} to ${!this.state.hideCompleted}`);
        this.setState(prevState => ({ 
            hideCompleted: !prevState.hideCompleted 
        }));
    }

    /**
     * Handles row click events
     * Notifies parent component about the selected color
     * @param colorId The ID of the color that was clicked, or null for total row
     */
    private handleRowClick(colorId: number | null): void {
        debug(`[StatisticsView.handleRowClick] Row clicked for color ID: ${colorId}`);
        if (this.props.onRowClick) {
            this.props.onRowClick(colorId);
        }
    }

    /**
     * Generates sort indicator icon for a column
     * @param columnIndex The index of the column
     * @returns JSX element representing the sort indicator
     */
    private getSortIndicator(columnIndex: number): React.ReactNode {
        if (this.state.sortColumn !== columnIndex) {
            return (
                <span className="sort-indicator" style={{ opacity: 0.3 }}>
                    <i className="fas fa-sort"></i>
                </span>
            );
        }
        return (
            <span className="sort-indicator">
                {this.state.sortDirection === 'asc' ? 
                    <i className="fas fa-sort-up"></i> : 
                    <i className="fas fa-sort-down"></i>
                }
            </span>
        );
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up language change listener
     */
    componentDidMount(): void {
        debug('[StatisticsView.componentDidMount] Component mounted');
        
        // Subscribe to language change events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up language change listener
     */
    componentWillUnmount(): void {
        debug('[StatisticsView.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from language change events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called when props update
     * @param prevProps Previous component properties
     */
    componentDidUpdate(prevProps: StatisticsViewProps): void {
        debug('[StatisticsView.componentDidUpdate] Component updated');
        
        if (this.props.statistics !== prevProps.statistics) {
            debug(`[StatisticsView.componentDidUpdate] Statistics changed, updating last updated time`);
            this.setState({ lastUpdated: new Date() });
        }
        
        if (this.props.selectedColorId !== prevProps.selectedColorId) {
            debug(`[StatisticsView.componentDidUpdate] Selected color ID changed: ${prevProps.selectedColorId} -> ${this.props.selectedColorId}`);
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[StatisticsView.render] Rendering component');
        const { statistics = [], selectedColorId } = this.props;
        const { sortColumn, sortDirection, hideCompleted } = this.state;

        // Calculate totals
        const totalTotal = statistics.reduce((sum, row) => sum + row.total, 0);
        const totalCompleted = statistics.reduce((sum, row) => sum + row.completed, 0);
        const totalPercentage = totalTotal > 0 ? (totalCompleted / totalTotal) * 100 : 0;
        const totalRemain = totalTotal - totalCompleted;

        // Filter statistics based on hideCompleted setting
        const filteredStatistics = hideCompleted 
            ? statistics.filter(row => row.remain > 0)
            : statistics;

        // Sort statistics
        const sortedStatistics = [...filteredStatistics].sort((a, b) => {
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

        return (
            <div className="statistics">
                <div className="statistics-header">
                    <h2>{LanguageManager.getText('statistics')}</h2>
                    <button 
                        className={`hide-completed-button ${hideCompleted ? 'active' : ''}`}
                        onClick={this.handleHideCompletedToggle.bind(this)}
                        title={LanguageManager.getText('hideCompleted')}
                    >
                        <i className="fas fa-eye-slash"></i>
                    </button>
                </div>
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
                                            onClick={() => this.handleHeaderClick(index)}
                                            className={index > 0 ? 'number-column' : ''}
                                            data-sort={sortAttr || undefined}
                                        >
                                            <span className="text" data-i18n={text}>
                                                {LanguageManager.getText(text as any)}
                                            </span>
                                            {this.getSortIndicator(index)}
                                        </th>
                                    );
                                })}
                                <th className="scroll-fix"></th>
                            </tr>
                            {/* Total row in thead to avoid indentation */}
                            {totalTotal > 0 && (
                                <tr className="statistics-total-row" onClick={() => this.handleRowClick(null)}>
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
                                        onClick={() => this.handleRowClick(row.color?.id ?? null)}
                                        className={row.color?.id === selectedColorId ? 'selected-row' : ''}
                                    >
                                        <td>
                                            <span 
                                                className="color-swatch"
                                                style={{
                                                    backgroundColor: (row.color?.color.toString() ?? '#000000'),
                                                    '--color-rgb': (row.color?.color.toString() ?? '#000000')
                                                } as React.CSSProperties}
                                            />
                                            <span className="color-name">
                                                {row.color?.id}. {row.color?.premium ? <i className="fas fa-star" style={{fontSize: '0.8em', marginRight: '2px'}}></i> : ''} {row.color?.name}
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
    }
}
