import React from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';
import { TemplateList } from './TemplateList';
import { Template } from '../types/template';
import { StatisticsRow } from '../managers/statistics-manager';
import { TemplateCollection } from '../types/template-collection';
import { LanguageManager } from '../managers/language-manager';
import { debug } from '../utils';
import { EventManager } from '../managers/event-manager';
import { TemplateSaveEventArts, TemplateLoadEventArts, LanguageChangeEventArts, TemplateRequestEditEventArts } from '../types/event-args';

interface LeftPanelProps {
    width: number;
    statistics?: StatisticsRow[];
    currentTemplate?: Template;
    activeView: 'template' | 'templates' | null;
    onCloseView: () => void;
    onStatisticsRowClick?: (colorId: number | null) => void;
    onCreateTemplate: () => void;
    onTemplateButtonClick: () => void;
    selectedColorId?: number | null;
}

interface LeftPanelState {
    templates: Template[];
    language: string;
    isNewTemplate: boolean;
}

/**
 * Class component for the left panel that displays template management and statistics
 * Handles template creation, loading, and statistics display
 */
export class LeftPanel extends React.Component<LeftPanelProps, LeftPanelState> {
    private collection: TemplateCollection;

    /**
     * Creates a new LeftPanel instance
     * @param props Component properties
     */
    constructor(props: LeftPanelProps) {
        super(props);
        debug('[LeftPanel.constructor] Creating LeftPanel instance');
        
        this.collection = new TemplateCollection();
        
        this.state = {
            templates: [],
            language: LanguageManager.getCurrentLanguage(),
            isNewTemplate: false
        };
    }

    /**
     * Handles language change events from EventManager
     * Updates the component state with the new language
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[LeftPanel.handleLanguageChangeEvent] Language changed, updating state');
        this.setState({ language: args.targetLanguage });
    }

    /**
     * Handles template save operations
     * Adds template to collection and updates parent component
     * @param template The template to save
     */
    private handleTemplateSave(template: Template): void {
        debug(`[LeftPanel.handleTemplateSave] Saving template: ${template.name}`);
        // Add to collection
        this.collection.addTemplate(template);
        const updatedTemplates = this.collection.getTemplates();
        this.setState({ templates: updatedTemplates, isNewTemplate: false });
        
        // Emit template save event
        const eventManager = EventManager.getInstance();
        eventManager.emit('template:save', new TemplateSaveEventArts(template));
        
        // Close the view
        this.props.onCloseView();
    }

    /**
     * Handles new template creation
     * Emits template request edit event for new template
     */
    private handleCreateTemplate(): void {
        debug('[LeftPanel.handleCreateTemplate] Creating new template');
        // Emit template request edit event for new template
        const eventManager = EventManager.getInstance();
        eventManager.emit('template:request-edit', new TemplateRequestEditEventArts(true));
        this.props.onCreateTemplate();
    }

    /**
     * Handles template load operations
     * Notifies parent component and closes the view
     * @param template The template to load
     */
    private handleTemplateLoad(template: Template): void {
        debug(`[LeftPanel.handleTemplateLoad] Loading template from list: ${template.name}`);
        
        // Emit template load event
        const eventManager = EventManager.getInstance();
        eventManager.emit('template:load', new TemplateLoadEventArts(template));
        
        // Close the view
        this.props.onCloseView();
    }

    /**
     * Handles view close button click
     * Notifies parent component to close the current view
     */
    private handleCloseView(): void {
        debug('[LeftPanel.handleCloseView] Closing view');
        this.props.onCloseView();
    }

    /**
     * React lifecycle method called after component mounts
     * Loads templates and sets up language change listener
     */
    componentDidMount(): void {
        debug('[LeftPanel.componentDidMount] Component mounted');
        // Load templates on mount
        const loadedTemplates = this.collection.getTemplates();
        debug(`[LeftPanel.componentDidMount] Loaded ${loadedTemplates.length} templates`);
        this.setState({ templates: loadedTemplates });
        
        // Subscribe to language change events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up language change listener
     */
    componentWillUnmount(): void {
        debug('[LeftPanel.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from language change events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called when props or state update
     * @param prevProps Previous props
     * @param prevState Previous state
     */
    componentDidUpdate(prevProps: LeftPanelProps, prevState: LeftPanelState): void {
        debug('[LeftPanel.componentDidUpdate] Component updated');
        
        if (this.props.activeView !== prevProps.activeView) {
            debug(`[LeftPanel.componentDidUpdate] Active view changed: ${prevProps.activeView} -> ${this.props.activeView}`);
        }
        
        if (this.props.currentTemplate !== prevProps.currentTemplate) {
            debug(`[LeftPanel.componentDidUpdate] Current template changed: ${prevProps.currentTemplate?.name || 'undefined'} -> ${this.props.currentTemplate?.name || 'undefined'}`);
        }
        
        if (this.state.templates !== prevState.templates) {
            debug(`[LeftPanel.componentDidUpdate] Templates changed: ${prevState.templates.length} -> ${this.state.templates.length}`);
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[LeftPanel.render] Rendering component');
        const { 
            width, 
            statistics, 
            currentTemplate,
            activeView,
            onStatisticsRowClick,
            selectedColorId
        } = this.props;

        return (
            <div className="left-panel" style={{ width: `${width}px` }}>
                {/* Show header when NOT in statistics view (activeView is not null) or when showing new template */}
                {(activeView !== null || (this.state.templates.length === 0 && !currentTemplate)) && (
                    <div className="left-panel-header">
                        <h2>
                            {activeView === 'template' || (this.state.templates.length === 0 && !currentTemplate) 
                                ? (this.state.isNewTemplate || (this.state.templates.length === 0 && !currentTemplate) ? LanguageManager.getText('newTemplate') : LanguageManager.getText('editTemplateHeader'))
                                : LanguageManager.getText('savedTemplatesHeader')}
                        </h2>
                        {activeView !== null && (
                            <button 
                                className="close-button"
                                onClick={this.handleCloseView.bind(this)}
                                title={LanguageManager.getText('close')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
                {activeView === 'template' && (
                    <TemplateConfig 
                        onTemplateSave={this.handleTemplateSave.bind(this)} 
                        isNewTemplate={this.state.isNewTemplate}
                        currentTemplate={this.state.isNewTemplate ? undefined : currentTemplate}
                        editedTemplate={this.state.isNewTemplate ? null : currentTemplate}
                    />
                )}
                {activeView === 'templates' && (
                    <TemplateList 
                        onTemplateSelect={this.handleTemplateLoad.bind(this)} 
                        onCreateTemplate={this.handleCreateTemplate.bind(this)}
                    />
                )}
                {/* Show TemplateConfig when no templates exist and no current template */}
                {this.state.templates.length === 0 && !currentTemplate && activeView === null && (
                    <TemplateConfig 
                        onTemplateSave={this.handleTemplateSave.bind(this)} 
                        isNewTemplate={this.state.isNewTemplate}
                        currentTemplate={this.state.isNewTemplate ? undefined : currentTemplate}
                        editedTemplate={this.state.isNewTemplate ? null : undefined}
                    />
                )}
                {currentTemplate && activeView === null && (
                    <StatisticsView 
                        statistics={statistics} 
                        onRowClick={onStatisticsRowClick} 
                        selectedColorId={selectedColorId}
                    />
                )}
            </div>
        );
    }
}
