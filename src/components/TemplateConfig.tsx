import React from 'react';
import { Template } from '../types/template';
import { debug } from '../utils';
import { LanguageManager } from '../managers/language-manager';
import { 
    LanguageChangeEventArts, 
    TemplateSaveEventArts, 
    TemplateRequestEditEventArts,
    TemplateChangeEventArts, 
    TemplateEditedEventArts,
    TemplateViewClosedEventArts
} from '../types/event-args';
import { EventManager } from '../managers/event-manager';

interface TemplateConfigProps {
    onTemplateSave?: (template: Template) => void;
    isNewTemplate?: boolean;
    onClearForm?: () => void;
    currentTemplate?: Template;
    editedTemplate?: Template | null;
}

interface TemplateConfigState {
    name: string;
    tlX: string;
    tlY: string;
    pxX: string;
    pxY: string;
    imageDataUrl: string;
    language: string;
    exampleNumbers: string;
}

/**
 * Class component for template configuration form
 * Handles template creation, editing, and loading from hash
 */
export class TemplateConfig extends React.Component<TemplateConfigProps, TemplateConfigState> {
    private hashChangeHandler: (() => void) | null = null;

    /**
     * Creates a new TemplateConfig instance
     * @param props Component properties
     */
    constructor(props: TemplateConfigProps) {
        super(props);
        debug('[TemplateConfig.constructor] Creating TemplateConfig instance');
        
        this.state = {
            name: '',
            tlX: '',
            tlY: '',
            pxX: '',
            pxY: '',
            imageDataUrl: '',
            language: LanguageManager.getCurrentLanguage(),
            exampleNumbers: Array.from({ length: 4 }, () => Math.floor(Math.random() * 1000)).join(' ')
        };
    }

    /**
     * Clears the form fields
     */
    private clearForm(): void {
        debug('[TemplateConfig.clearForm] Clearing form fields');
        this.setState({
            name: '',
            tlX: '',
            tlY: '',
            pxX: '',
            pxY: '',
            imageDataUrl: ''
        });
    }

    /**
     * Handles language change events from EventManager
     * Updates the component state with the new language
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[TemplateConfig.handleLanguageChangeEvent] Language changed, updating state');
        this.setState({ language: args.targetLanguage });
    }

    /**
     * Loads template data from URL hash
     */
    private loadFromHash(): void {
        if (window.location.hash) {
            try {
                const hash = window.location.hash.substring(1);
                debug(`[TemplateConfig.loadFromHash] Loading template from hash: ${hash.substring(0, 20)}...`);
                const template = Template.deserialize(hash);
                this.setState({
                    name: template.name,
                    tlX: template.tlX.toString(),
                    tlY: template.tlY.toString(),
                    pxX: template.pxX.toString(),
                    pxY: template.pxY.toString(),
                    imageDataUrl: template.imageDataUrl
                });
            } catch (error) {
                debug('[TemplateConfig.loadFromHash] Error loading template from hash:', error);
            }
        }
    }

    /**
     * Handles paste events to parse coordinate data
     * @param e Clipboard event
     */
    private handlePaste(e: React.ClipboardEvent): void {
        const pastedText = e.clipboardData.getData('text');
        debug(`[TemplateConfig.handlePaste] Pasted text: ${pastedText}`);
        const numbers = pastedText.split(/[\s,.;\-–—]+/).filter(num => num.trim() !== '');
        
        if (numbers.length === 4) {
            const validNumbers = numbers.map(num => {
                const parsed = parseInt(num);
                return isNaN(parsed) ? null : parsed;
            });
            
            if (validNumbers.every(num => num !== null)) {
                debug(`[TemplateConfig.handlePaste] Parsed coordinates: ${validNumbers.join(', ')}`);
                e.preventDefault();
                this.setState({
                    tlX: validNumbers[0]!.toString(),
                    tlY: validNumbers[1]!.toString(),
                    pxX: validNumbers[2]!.toString(),
                    pxY: validNumbers[3]!.toString()
                });
            } else {
                debug('[TemplateConfig.handlePaste] Invalid numbers in pasted text');
            }
        } else {
            debug(`[TemplateConfig.handlePaste] Expected 4 numbers, got ${numbers.length}`);
        }
    }

    /**
     * Handles template change events
     * @param args Template change event arguments
     */
    private handleTemplateChange(args: TemplateChangeEventArts): void {
        debug('[TemplateConfig.handleTemplateChange] Template changed');
        if (args.template) {
            this.setState({
                name: args.template.name,
                tlX: args.template.tlX.toString(),
                tlY: args.template.tlY.toString(),
                pxX: args.template.pxX.toString(),
                pxY: args.template.pxY.toString(),
                imageDataUrl: args.template.imageDataUrl
            });
        } else {
            // Clear form if template is undefined
            this.clearForm();
        }
    }

    /**
     * Handles template request edit events
     * @param args Template request edit event arguments
     */
    private handleTemplateRequestEdit(args: TemplateRequestEditEventArts): void {
        debug(`[TemplateConfig.handleTemplateRequestEdit] Template edit requested, isNewTemplate: ${args.isNewTemplate}`);
        if (args.isNewTemplate) {
            this.clearForm();
        }
        // If not new template, the form will be populated by template:change events
    }

    /**
     * Handles form submission
     * @param e Form event
     */
    private async handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        debug('[TemplateConfig.handleSubmit] Submitting template form');
        
        const template = new Template(
            this.state.name,
            parseInt(this.state.tlX),
            parseInt(this.state.tlY),
            parseInt(this.state.pxX),
            parseInt(this.state.pxY),
            this.state.imageDataUrl
        );
        
        try {
            await template.loadTemplateImage();
            await template.loadWplaceImage();
            
            // Emit template edited event
            const eventManager = EventManager.getInstance();
            eventManager.emit('template:edited', new TemplateEditedEventArts(template));
            
            // Emit template view closed event to close the edit window
            eventManager.emit('template-view:closed', new TemplateViewClosedEventArts());
            
            const serialized = template.serialize();
            window.location.hash = serialized;
            debug('[TemplateConfig.handleSubmit] Template saved successfully');
        } catch (error) {
            debug('[TemplateConfig.handleSubmit] Error loading images:', error);
            alert('Failed to load images. Please check the image URL and try again.');
        }
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up event listeners and loads initial data
     */
    componentDidMount(): void {
        debug('[TemplateConfig.componentDidMount] Component mounted');
        
        // Subscribe to events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
        eventManager.on('template:change', this.handleTemplateChange.bind(this));
        eventManager.on('template:request-edit', this.handleTemplateRequestEdit.bind(this));
        
        // Load initial data
        this.loadInitialData();
        
        // Set up hash change listener
        this.hashChangeHandler = this.handleHashChange.bind(this);
        window.addEventListener('hashchange', this.hashChangeHandler);
    }

    /**
     * Loads initial template data based on props
     */
    private loadInitialData(): void {
        debug('[TemplateConfig.loadInitialData] Loading initial template data');
        const { isNewTemplate, editedTemplate, currentTemplate } = this.props;
        
        if (isNewTemplate || editedTemplate === null) {
            debug('[TemplateConfig.loadInitialData] Clearing form for new template creation');
            this.clearForm();
            return;
        }

        if (editedTemplate) {
            debug(`[TemplateConfig.loadInitialData] Loading template for editing: ${editedTemplate.name}`);
            this.setState({
                name: editedTemplate.name,
                tlX: editedTemplate.tlX.toString(),
                tlY: editedTemplate.tlY.toString(),
                pxX: editedTemplate.pxX.toString(),
                pxY: editedTemplate.pxY.toString(),
                imageDataUrl: editedTemplate.imageDataUrl
            });
            return;
        }

        if (currentTemplate) {
            debug(`[TemplateConfig.loadInitialData] Loading from current template: ${currentTemplate.name}`);
            this.setState({
                name: currentTemplate.name,
                tlX: currentTemplate.tlX.toString(),
                tlY: currentTemplate.tlY.toString(),
                pxX: currentTemplate.pxX.toString(),
                pxY: currentTemplate.pxY.toString(),
                imageDataUrl: currentTemplate.imageDataUrl
            });
        } else {
            this.loadFromHash();
        }
    }

    /**
     * Handles hash change events
     */
    private handleHashChange(): void {
        if (!this.props.isNewTemplate) {
            debug('[TemplateConfig.handleHashChange] Hash changed, reloading template data');
            this.loadFromHash();
        }
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up event listeners
     */
    componentWillUnmount(): void {
        debug('[TemplateConfig.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
        eventManager.off('template:change', this.handleTemplateChange.bind(this));
        eventManager.off('template:request-edit', this.handleTemplateRequestEdit.bind(this));
        
        if (this.hashChangeHandler) {
            window.removeEventListener('hashchange', this.hashChangeHandler);
        }
    }

    /**
     * React lifecycle method called when props update
     * @param prevProps Previous component properties
     */
    componentDidUpdate(prevProps: TemplateConfigProps): void {
        debug('[TemplateConfig.componentDidUpdate] Component updated');
        
        if (this.props.isNewTemplate !== prevProps.isNewTemplate) {
            debug(`[TemplateConfig.componentDidUpdate] isNewTemplate changed to: ${this.props.isNewTemplate}`);
            if (this.props.isNewTemplate) {
                debug('[TemplateConfig.componentDidUpdate] Clearing form for new template');
                this.clearForm();
                if (this.props.onClearForm) {
                    debug('[TemplateConfig.componentDidUpdate] Calling onClearForm callback');
                    this.props.onClearForm();
                }
            }
        }

        if (this.props.editedTemplate !== prevProps.editedTemplate || 
            this.props.currentTemplate !== prevProps.currentTemplate) {
            debug('[TemplateConfig.componentDidUpdate] Template data changed, reloading');
            this.loadInitialData();
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[TemplateConfig.render] Rendering component');
        return (
            <div className="template-configuration">
                <form id="template-form" onSubmit={this.handleSubmit.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="template-name" data-i18n="templateName">Template Name:</label>
                        <input 
                            type="text" 
                            id="template-name" 
                            required 
                            value={this.state.name}
                            onChange={(e) => this.setState({ name: e.target.value })}
                            placeholder="Untitled Template"
                        />
                    </div>
                    <div className="coordinate-inputs-container" onPaste={this.handlePaste.bind(this)}>
                        <div className="coordinate-inputs-row">
                            <div className="form-group">
                                <label htmlFor="tl-x" data-i18n="tlX">Tl X:</label>
                                <input 
                                    type="text" 
                                    id="tl-x" 
                                    required 
                                    value={this.state.tlX}
                                    onChange={(e) => this.setState({ tlX: e.target.value.replace(/[^0-9\-]/g, '') })}
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
                                    value={this.state.tlY}
                                    onChange={(e) => this.setState({ tlY: e.target.value.replace(/[^0-9\-]/g, '') })}
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
                                    value={this.state.pxX}
                                    onChange={(e) => this.setState({ pxX: e.target.value.replace(/[^0-9\-]/g, '') })}
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
                                    value={this.state.pxY}
                                    onChange={(e) => this.setState({ pxY: e.target.value.replace(/[^0-9\-]/g, '') })}
                                    inputMode="numeric"
                                    pattern="[0-9\-]*"
                                />
                            </div>
                        </div>
                        <div className="paste-note">
                            <small>
                                {LanguageManager.getText('pasteTip').replace('{{example}}', this.state.exampleNumbers)}
                            </small>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                        <label htmlFor="image-url" data-i18n="imageUrl">Image URL:</label>
                        <input 
                            type="url" 
                            id="image-url" 
                            required 
                            value={this.state.imageDataUrl}
                            onChange={(e) => this.setState({ imageDataUrl: e.target.value })}
                        />
                    </div>
                    <button type="submit" data-i18n="saveTemplate">
                        Save Template
                    </button>
                </form>
            </div>
        );
    }
}
