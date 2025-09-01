import React, { useState, useEffect } from 'react';
import { Template } from '../script/template';

interface TemplateConfigProps {
    onTemplateSave?: (template: Template) => void;
}

export const TemplateConfig: React.FC<TemplateConfigProps> = ({ onTemplateSave }) => {
    const [name, setName] = useState<string>('Untitled Template');
    const [tlX, setTlX] = useState<string>('0');
    const [tlY, setTlY] = useState<string>('0');
    const [pxX, setPxX] = useState<string>('0');
    const [pxY, setPxY] = useState<string>('0');
    const [imageDataUrl, setImageDataUrl] = useState<string>('');

    // Load template from hash on component mount
    useEffect(() => {
        const loadFromHash = () => {
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1); // Remove the '#' character
                    const template = Template.deserialize(hash);
                    setName(template.name);
                    setTlX(template.tlX.toString());
                    setTlY(template.tlY.toString());
                    setPxX(template.pxX.toString());
                    setPxY(template.pxY.toString());
                    setImageDataUrl(template.imageDataUrl);
                    
                    if (onTemplateSave) {
                        onTemplateSave(template);
                    }
                } catch (error) {
                    console.error('Error loading template from hash:', error);
                }
            }
        };

        loadFromHash();
    }, [onTemplateSave]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const template = new Template(
            name,
            parseInt(tlX),
            parseInt(tlY),
            parseInt(pxX),
            parseInt(pxY),
            imageDataUrl
        );
        
        if (onTemplateSave) {
            onTemplateSave(template);
        }
        
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
    };

    return (
        <div className="template-configuration">
            <h2 data-i18n="templateConfiguration">Template Configuration</h2>
            <form id="template-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="template-name" data-i18n="templateName">Template Name:</label>
                    <input 
                        type="text" 
                        id="template-name" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%' }} 
                    />
                </div>
                <div className="number-inputs-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <div className="form-group">
                        <label htmlFor="tl-x" data-i18n="tlX">Tl X:</label>
                        <input 
                            type="number" 
                            id="tl-x" 
                            required 
                            value={tlX}
                            onChange={(e) => setTlX(e.target.value)}
                            style={{ width: '60px' }} 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tl-y" data-i18n="tlY">Tl Y:</label>
                        <input 
                            type="number" 
                            id="tl-y" 
                            required 
                            value={tlY}
                            onChange={(e) => setTlY(e.target.value)}
                            style={{ width: '60px' }} 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="px-x" data-i18n="pxX">Px X:</label>
                        <input 
                            type="number" 
                            id="px-x" 
                            required 
                            value={pxX}
                            onChange={(e) => setPxX(e.target.value)}
                            style={{ width: '60px' }} 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="px-y" data-i18n="pxY">Px Y:</label>
                        <input 
                            type="number" 
                            id="px-y" 
                            required 
                            value={pxY}
                            onChange={(e) => setPxY(e.target.value)}
                            style={{ width: '60px' }} 
                        />
                    </div>
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                    <label htmlFor="image-url" data-i18n="imageUrl">Image URL:</label>
                    <input 
                        type="url" 
                        id="image-url" 
                        required 
                        value={imageDataUrl}
                        onChange={(e) => setImageDataUrl(e.target.value)}
                        style={{ width: '100%' }} 
                    />
                </div>
                <button type="submit" data-i18n="saveTemplate" style={{ marginTop: '10px' }}>
                    Save Template
                </button>
            </form>
        </div>
    );
};
