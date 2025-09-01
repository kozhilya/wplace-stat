import React from 'react';

export const TemplateConfig: React.FC = () => {
    return (
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
    );
};
