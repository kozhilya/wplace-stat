import React, { useState } from 'react';

interface LeftPanelProps {
    width: number;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ width }) => {
    const [activeView, setActiveView] = useState<'template' | 'statistics'>('template');

    return (
        <div 
            className="left-panel" 
            style={{ 
                width: `${width}px`, 
                height: '100%', 
                borderRight: '1px solid #ddd',
                overflow: 'auto',
                padding: '10px'
            }}
        >
            <div className="view-selector" style={{ marginBottom: '10px' }}>
                <button 
                    onClick={() => setActiveView('template')}
                    style={{ fontWeight: activeView === 'template' ? 'bold' : 'normal' }}
                >
                    Template
                </button>
                <button 
                    onClick={() => setActiveView('statistics')}
                    style={{ fontWeight: activeView === 'statistics' ? 'bold' : 'normal', marginLeft: '5px' }}
                >
                    Statistics
                </button>
            </div>
            
            {activeView === 'template' && (
                <div className="template-configuration">
                    <h2 data-i18n="templateConfiguration">Template Configuration</h2>
                    <form id="template-form">
                        <div className="number-inputs-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <div className="form-group">
                                <label htmlFor="tl-x" data-i18n="tlX">Tl X:</label>
                                <input type="number" id="tl-x" required style={{ width: '60px' }} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="tl-y" data-i18n="tlY">Tl Y:</label>
                                <input type="number" id="tl-y" required style={{ width: '60px' }} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="px-x" data-i18n="pxX">Px X:</label>
                                <input type="number" id="px-x" required style={{ width: '60px' }} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="px-y" data-i18n="pxY">Px Y:</label>
                                <input type="number" id="px-y" required style={{ width: '60px' }} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label htmlFor="image-url" data-i18n="imageUrl">Image URL:</label>
                            <input type="url" id="image-url" required style={{ width: '100%' }} />
                        </div>
                        <button type="submit" data-i18n="saveTemplate" style={{ marginTop: '10px' }}>
                            Save Template
                        </button>
                    </form>
                </div>
            )}
            
            {activeView === 'statistics' && (
                <div className="statistics">
                    <h2 data-i18n="statistics">Statistics</h2>
                    <div className="table-container">
                        <table id="stats-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th><span className="text" data-i18n="color">Color</span><span className="sort-indicator"></span></th>
                                    <th><span className="text" data-i18n="total">Total</span><span className="sort-indicator"></span></th>
                                    <th><span className="text" data-i18n="completed">Completed</span><span className="sort-indicator"></span></th>
                                    <th><span className="text" data-i18n="percentage">Percentage</span><span className="sort-indicator"></span></th>
                                    <th><span className="text" data-i18n="remaining">Remaining</span><span className="sort-indicator"></span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Statistics will be populated here */}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
