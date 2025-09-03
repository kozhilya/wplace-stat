import React from 'react';
import { Template } from '../script/template';
import { TemplateCollection } from '../script/template';
import { debug } from '../utils';
import { LanguageManager } from '../script/managers/language-manager';

interface TemplateListProps {
    onTemplateSelect: (template: Template) => void;
    onCreateTemplate: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = (props) => {
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const collection = React.useRef(new TemplateCollection());

    React.useEffect(() => {
        setTemplates(collection.current.getTemplates());
    }, []);

    const handleDelete = (index: number, templateName: string) => {
        if (window.confirm(LanguageManager.getText('confirmDelete').replace('{templateName}', templateName))) {
            debug(`TemplateList.handleDelete: Deleting template: ${templateName}`);
            collection.current.removeTemplate(index);
            setTemplates(collection.current.getTemplates());
        }
    };

    const handleLoad = async (template: Template) => {
        debug(`TemplateList.handleLoad: Loading template: ${template.name}`);
        try {
            // Load the template image
            await template.loadTemplateImage();
            
            // Load the Wplace image
            await template.loadWplaceImage();
            
            props.onTemplateSelect(template);
        } catch (error) {
            debug('Error loading template images:', error);
            alert('Failed to load template images. Please try again.');
        }
    };

    // Function to get the template image as a data URL
    const getTemplateImageUrl = (template: Template): string => {
        // For simplicity, we'll use the imageDataUrl directly
        // In a real implementation, you might want to create a thumbnail
        return template.imageDataUrl;
    };

    return (
        <div className="template-list">
            <div className="create-template-button-container">
                <button 
                    className="create-template-button"
                    onClick={() => {
                        debug('TemplateList.onCreateTemplate: Create new template button clicked');
                        // Ensure the onCreateTemplate callback is called
                        props.onCreateTemplate();
                    }}
                    data-i18n="newTemplate"
                >
                    {LanguageManager.getText('newTemplate')}
                </button>
            </div>
            {templates.length === 0 ? (
                <p data-i18n="noSavedTemplates">{LanguageManager.getText('noSavedTemplates')}</p>
            ) : (
                <ul className="template-list-items">
                    {templates.map((template, index) => (
                        <li key={index} className="template-list-item">
                            <div className="template-image-container">
                                <img 
                                    src={getTemplateImageUrl(template)} 
                                    alt={template.name}
                                    className="template-thumbnail"
                                />
                            </div>
                            <div className="template-details">
                                <strong className="template-name">{template.name}</strong>
                                <div className="template-coordinates">
                                    TL: ({template.tlX}, {template.tlY}) | PX: ({template.pxX}, {template.pxY})
                                </div>
                            </div>
                            <div className="template-actions">
                                <button 
                                    className="template-button load-button"
                                    onClick={() => handleLoad(template)}
                                    data-i18n="load"
                                >
                                    {LanguageManager.getText('load')}
                                </button>
                                <button 
                                    className="template-button delete-button"
                                    onClick={() => handleDelete(index, template.name)}
                                    data-i18n="delete"
                                >
                                    {LanguageManager.getText('delete')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
