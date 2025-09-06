import React from 'react';
import { Template } from '../types/template';
import { TemplateCollection } from '../types/template-collection';
import { debug } from '../utils';
import { LanguageManager } from '../managers/language-manager';
import { LanguageChangeEventArts, TemplateChangeEventArts, TemplateLoadEventArts } from '../types/event-args';
import { EventManager } from '../managers/event-manager';

interface TemplateListProps {
    onTemplateSelect: (template: Template) => void;
    onCreateTemplate: () => void;
}

interface TemplateListState {
    templates: Template[];
    language: string;
}

/**
 * Class component for displaying and managing a list of saved templates
 * Handles template loading, deletion, and creation
 */
export class TemplateList extends React.Component<TemplateListProps, TemplateListState> {
    private collection: TemplateCollection;

    /**
     * Creates a new TemplateList instance
     * @param props Component properties
     */
    constructor(props: TemplateListProps) {
        super(props);
        debug('[TemplateList.constructor] Creating TemplateList instance');
        
        this.collection = new TemplateCollection();
        
        this.state = {
            templates: [],
            language: LanguageManager.getCurrentLanguage()
        };
    }

    /**
     * Handles language change events from EventManager
     * Updates the component state with the new language
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[TemplateList.handleLanguageChangeEvent] Language changed, updating state');
        this.setState({ language: args.targetLanguage });
    }

    /**
     * Reloads templates from the collection
     */
    private reloadTemplates(): void {
        debug('[TemplateList.reloadTemplates] Reloading templates');
        const loadedTemplates = this.collection.getTemplates();
        debug(`[TemplateList.reloadTemplates] Loaded ${loadedTemplates.length} templates`);
        this.setState({ templates: loadedTemplates });
    }

    /**
     * Handles template deletion with confirmation
     * @param index Index of the template to delete
     * @param templateName Name of the template to delete
     */
    private handleDelete(index: number, templateName: string): void {
        debug(`[TemplateList.handleDelete] Attempting to delete template at index ${index}: ${templateName}`);
        if (window.confirm(LanguageManager.getText('confirmDelete').replace('{templateName}', templateName))) {
            debug(`[TemplateList.handleDelete] Confirmed deletion of template: ${templateName}`);
            this.collection.removeTemplate(index);
            // Save to localStorage immediately after deletion
            (this.collection as any).saveToLocalStorage();
            debug(`[TemplateList.handleDelete] Template deleted from localStorage: ${templateName}`);
            this.reloadTemplates();
        } else {
            debug(`[TemplateList.handleDelete] Deletion cancelled for template: ${templateName}`);
        }
    }

    /**
     * Handles template loading operations
     * Loads template and Wplace images before notifying parent component
     * @param template The template to load
     */
    private async handleLoad(template: Template): Promise<void> {
        debug(`[TemplateList.handleLoad] Starting to load template: ${template.name}`);
        try {
            debug(`[TemplateList.handleLoad] Loading template image for: ${template.name}`);
            await template.loadTemplateImage();
            
            debug(`[TemplateList.handleLoad] Loading Wplace image for: ${template.name}`);
            await template.loadWplaceImage();
            
            debug(`[TemplateList.handleLoad] Emitting template:load event for: ${template.name}`);
            // Emit template load event
            const eventManager = EventManager.getInstance();
            eventManager.emit('template:load', new TemplateLoadEventArts(template));
            debug(`[TemplateList.handleLoad] Successfully loaded template: ${template.name}`);
        } catch (error) {
            debug('[TemplateList.handleLoad] Error loading template images:', error);
            alert('Failed to load template images. Please try again.');
        }
    }

    /**
     * Gets the template image URL for display
     * @param template The template to get the image URL for
     * @returns The image data URL
     */
    private getTemplateImageUrl(template: Template): string {
        debug(`[TemplateList.getTemplateImageUrl] Getting image URL for template: ${template.name}`);
        return template.imageDataUrl;
    }

    /**
     * Handles new template creation button click
     * Notifies parent component to create a new template
     */
    private handleCreateTemplate(): void {
        debug('[TemplateList.handleCreateTemplate] Create new template button clicked');
        // Emit template change event with undefined to clear current template
        const eventManager = EventManager.getInstance();
        eventManager.emit('template:change', new TemplateChangeEventArts(undefined));
        // Notify parent to create new template
        this.props.onCreateTemplate();
    }

    /**
     * React lifecycle method called after component mounts
     * Loads templates and sets up language change listener
     */
    componentDidMount(): void {
        debug('[TemplateList.componentDidMount] Component mounted');
        this.reloadTemplates();
        
        // Subscribe to language change events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up language change listener
     */
    componentWillUnmount(): void {
        debug('[TemplateList.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from language change events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called when props or state update
     * @param prevProps Previous component properties
     * @param prevState Previous state
     */
    componentDidUpdate(prevProps: TemplateListProps, prevState: TemplateListState): void {
        debug('[TemplateList.componentDidUpdate] Component updated');
        
        if (this.state.templates !== prevState.templates) {
            debug(`[TemplateList.componentDidUpdate] Templates changed: ${prevState.templates.length} -> ${this.state.templates.length}`);
        }
        
        if (this.props.onTemplateSelect !== prevProps.onTemplateSelect) {
            debug('[TemplateList.componentDidUpdate] onTemplateSelect callback changed');
        }
        
        if (this.props.onCreateTemplate !== prevProps.onCreateTemplate) {
            debug('[TemplateList.componentDidUpdate] onCreateTemplate callback changed');
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[TemplateList.render] Rendering component');
        const { templates } = this.state;

        return (
            <div className="template-list">
                <div className="create-template-button-container">
                    <button 
                        className="create-template-button"
                        onClick={this.handleCreateTemplate.bind(this)}
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
                                        src={this.getTemplateImageUrl(template)} 
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
                                        onClick={() => this.handleLoad(template)}
                                        data-i18n="load"
                                    >
                                        {LanguageManager.getText('load')}
                                    </button>
                                    <button 
                                        className="template-button delete-button"
                                        onClick={() => this.handleDelete(index, template.name)}
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
    }
}
