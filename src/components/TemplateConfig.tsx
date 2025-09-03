import React, { useState, useEffect } from 'react';
import { Template } from '../script/template';
import { debug } from '../utils';

interface TemplateConfigProps {
    onTemplateSave?: (template: Template) => void;
}

export const TemplateConfig: React.FC<TemplateConfigProps> = ({ onTemplateSave }) => {
    const [name, setName] = useState<string>('');
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
                } catch (error) {
                    debug('Error loading template from hash:', error);
                }
            }
        };

        loadFromHash();

        // Listen for hash changes
        const handleHashChange = () => {
            loadFromHash();
        };

        window.addEventListener('hashchange', handleHashChange);
        
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []); // Empty dependency array - only run on mount

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData('text');
        // Try to parse 4 numbers separated by various delimiters
        const numbers = pastedText.split(/[\s,.;\-–—]+/).filter(num => num.trim() !== '');
        
        if (numbers.length === 4) {
            // Check if all parts are valid numbers
            const validNumbers = numbers.map(num => {
                const parsed = parseInt(num);
                return isNaN(parsed) ? null : parsed;
            });
            
            if (validNumbers.every(num => num !== null)) {
                e.preventDefault();
                setTlX(validNumbers[0]!.toString());
                setTlY(validNumbers[1]!.toString());
                setPxX(validNumbers[2]!.toString());
                setPxY(validNumbers[3]!.toString());
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const template = new Template(
            name,
            parseInt(tlX),
            parseInt(tlY),
            parseInt(pxX),
            parseInt(pxY),
            imageDataUrl
        );
        
        try {
            // Load the template image
            await template.loadTemplateImage();
            
            // Load the Wplace image
            await template.loadWplaceImage();
            
            if (onTemplateSave) {
                onTemplateSave(template);
            }
            
            // Serialize and add to hash
            const serialized = template.serialize();
            window.location.hash = serialized;
        } catch (error) {
            debug('Error loading images:', error);
            alert('Failed to load images. Please check the image URL and try again.');
        }
    };

    return (
        <div className="template-configuration">
            <form id="template-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="template-name" data-i18n="templateName">Template Name:</label>
                    <input 
                        type="text" 
                        id="template-name" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Untitled Template"
                    />
                </div>
                <div className="number-inputs-row" onPaste={handlePaste}>
                    <div className="form-group">
                        <label htmlFor="tl-x" data-i18n="tlX">Tl X:</label>
                        <input 
                            type="text" 
                            id="tl-x" 
                            required 
                            value={tlX}
                            onChange={(e) => setTlX(e.target.value.replace(/[^0-9\-]/g, ''))}
                            inputMode="numeric"
                            pattern="[0-9\-]*"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tl-y" data-i18n="tlY">Tl Y:</label>
                        <input 
                            type="text" 
                            id="tl-y" 
                            required 
                            value={tlY}
                            onChange={(e) => setTlY(e.target.value.replace(/[^0-9\-]/g, ''))}
                            inputMode="numeric"
                            pattern="[0-9\-]*"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="px-x" data-i18n="pxX">Px X:</label>
                        <input 
                            type="text" 
                            id="px-x" 
                            required 
                            value={pxX}
                            onChange={(e) => setPxX(e.target.value.replace(/[^0-9\-]/g, ''))}
                            inputMode="numeric"
                            pattern="[0-9\-]*"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="px-y" data-i18n="pxY">Px Y:</label>
                        <input 
                            type="text" 
                            id="px-y" 
                            required 
                            value={pxY}
                            onChange={(e) => setPxY(e.target.value.replace(/[^0-9\-]/g, ''))}
                            inputMode="numeric"
                            pattern="[0-9\-]*"
                        />
                    </div>
                </div>
                <div className="paste-note">
                    <small>Tip: You can paste 4 numbers (like "1294 653 830 495") to fill all coordinate fields at once</small>
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                    <label htmlFor="image-url" data-i18n="imageUrl">Image URL:</label>
                    <input 
                        type="url" 
                        id="image-url" 
                        required 
                        value={imageDataUrl}
                        onChange={(e) => setImageDataUrl(e.target.value)}
                    />
                </div>
                <button type="submit" data-i18n="saveTemplate">
                    Save Template
                </button>
            </form>
        </div>
    );
};
