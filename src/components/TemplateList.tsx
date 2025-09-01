import React from 'react';
import { Template } from '../script/template';
import { TemplateCollection } from '../script/template';

interface TemplateListProps {
    onTemplateSelect: (template: Template) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({ onTemplateSelect }) => {
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const collection = React.useRef(new TemplateCollection());

    React.useEffect(() => {
        setTemplates(collection.current.getTemplates());
    }, []);

    const handleDelete = (index: number, templateName: string) => {
        if (window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
            collection.current.removeTemplate(index);
            setTemplates(collection.current.getTemplates());
        }
    };

    const handleLoad = async (template: Template) => {
        try {
            // Load the template image
            await template.loadTemplateImage();
            
            // Load the actual canvas
            await template.loadActualCanvas();
            
            onTemplateSelect(template);
        } catch (error) {
            console.error('Error loading template images:', error);
            alert('Failed to load template images. Please try again.');
        }
    };

    return (
        <div className="template-list">
            <h3 data-i18n="savedTemplates">Saved Templates</h3>
            {templates.length === 0 ? (
                <p data-i18n="noSavedTemplates">No saved templates</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {templates.map((template, index) => (
                        <li key={index} style={{ 
                            marginBottom: '10px', 
                            padding: '10px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong>{template.name}</strong>
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    TL: ({template.tlX}, {template.tlY}) | PX: ({template.pxX}, {template.pxY})
                                </div>
                            </div>
                            <div>
                                <button 
                                    onClick={() => handleLoad(template)}
                                    style={{ marginRight: '5px' }}
                                    data-i18n="load"
                                >
                                    Load
                                </button>
                                <button 
                                    onClick={() => handleDelete(index, template.name)}
                                    style={{ backgroundColor: '#ff4444', color: 'white' }}
                                    data-i18n="delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
