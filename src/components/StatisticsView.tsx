import React from 'react';

export const StatisticsView: React.FC = () => {
    return (
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
    );
};
