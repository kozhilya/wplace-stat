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
            collection.current.removeTemplate(index);
            setTemplates(collection.current.getTemplates());
        }
    };

    const handleLoad = async (template: Template) => {
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

    return (
        <div className="template-list">
            <div className="create-template-button-container">
                <button 
                    className="create-template-button"
                    onClick={props.onCreateTemplate}
                    data-i18n="newTemplate"
                >
                    {LanguageManager.getText('newTemplate')}
                </button>
            </div>
            {templates.length === 0 ? (
                <p data-i18n="noSavedTemplates">{LanguageManager.getText('noSavedTemplates')}</p>
            ) : (
                <ul>
                    {templates.map((template, index) => (
                        <li key={index}>
                            <div>
                                <strong>{template.name}</strong>
                                <div>
                                    TL: ({template.tlX}, {template.tlY}) | PX: ({template.pxX}, {template.pxY})
                                </div>
                            </div>
                            <div>
                                <button 
                                    onClick={() => handleLoad(template)}
                                    data-i18n="load"
                                >
                                    {LanguageManager.getText('load')}
                                </button>
                                <button 
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
