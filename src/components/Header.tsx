import React from 'react';
import { LanguageManager } from '../managers/language-manager';
import { debug } from '../utils';
import { LanguageChangeEventArts, LanguageRequestEventArts, TemplatesViewOpenedEventArts, TemplateViewOpenedEventArts } from '../types/event-args';
import { EventManager } from '../managers/event-manager';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
    onTemplateButtonClick: () => void;
    onTemplatesButtonClick: () => void;
    hasActiveTemplate: boolean;
    isUpdating: boolean;
}

interface HeaderState {
    currentLanguage: string;
    isDarkMode: boolean;
    showHelpModal: boolean;
}

/**
 * Class component for the application header
 * Displays template information, controls, and settings
 */
export class Header extends React.Component<HeaderProps, HeaderState> {
    /**
     * Creates a new Header instance
     * @param props Component properties
     */
    constructor(props: HeaderProps) {
        super(props);
        debug('[Header.constructor] Creating Header instance');
        
        this.state = {
            currentLanguage: LanguageManager.getCurrentLanguage(),
            isDarkMode: document.body.classList.contains('dark-mode'),
            showHelpModal: false
        };
    }

    /**
     * Handles language change events from EventManager
     * Updates the component state with the new language
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[Header.handleLanguageChangeEvent] Language changed, updating state');
        this.setState({ currentLanguage: args.targetLanguage });
    }

    /**
     * Handles language selector change events
     * @param event Change event from the language selector
     */
    private handleLanguageSelectorChange(event: React.ChangeEvent<HTMLSelectElement>): void {
        const newLanguage = event.target.value as 'en' | 'ru' | 'es';
        debug(`[Header.handleLanguageSelectorChange] Language changed to: ${newLanguage}`);
        
        // Emit language request event
        const eventManager = EventManager.getInstance();
        eventManager.emit('language:request', new LanguageRequestEventArts(newLanguage));
    }

    /**
     * Handles dark mode toggle button click
     * Toggles dark mode and updates localStorage
     */
    private handleDarkModeToggle(): void {
        const isDark = document.body.classList.toggle('dark-mode');
        debug(`[Header.handleDarkModeToggle] Dark mode ${isDark ? 'enabled' : 'disabled'}`);
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
        this.setState({ isDarkMode: isDark });
    }

    /**
     * Handles manual update button click
     * Dispatches a custom event to request a manual update
     */
    private handleManualUpdate(): void {
        if (!this.props.isUpdating) {
            debug('[Header.handleManualUpdate] Manual update requested');
            const event = new CustomEvent('manualUpdateRequested');
            window.dispatchEvent(event);
        }
    }

    /**
     * Handles help button click
     * Opens the help modal
     */
    private handleHelpClick(): void {
        debug('[Header.handleHelpClick] Help button clicked');
        this.setState({ showHelpModal: true });
    }

    /**
     * Handles help modal close
     * Closes the help modal
     */
    private handleHelpModalClose(): void {
        debug('[Header.handleHelpModalClose] Closing help modal');
        this.setState({ showHelpModal: false });
    }

    /**
     * Handles template button click
     * Calls the parent component's callback with debug logging
     */
    private handleTemplateButtonClick(): void {
        debug('[Header.handleTemplateButtonClick] Template edit button clicked');
        this.props.onTemplateButtonClick();
        // Emit template view opened event
        const eventManager = EventManager.getInstance();
        eventManager.emit('template-view:opened', new TemplateViewOpenedEventArts());
    }

    /**
     * Handles templates button click
     * Calls the parent component's callback
     */
    private handleTemplatesButtonClick(): void {
        debug('[Header.handleTemplatesButtonClick] Templates button clicked');
        this.props.onTemplatesButtonClick();
        // Emit templates view opened event
        const eventManager = EventManager.getInstance();
        eventManager.emit('templates-view:opened', new TemplatesViewOpenedEventArts());
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up language change listener
     */
    componentDidMount(): void {
        debug('[Header.componentDidMount] Component mounted');
        
        // Subscribe to language change events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up language change listener
     */
    componentWillUnmount(): void {
        debug('[Header.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from language change events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
    }

    /**
     * React lifecycle method called when props or state update
     * @param prevProps Previous props
     * @param prevState Previous state
     */
    componentDidUpdate(prevProps: HeaderProps, prevState: HeaderState): void {
        debug('[Header.componentDidUpdate] Component updated');
        
        if (this.props.templateName !== prevProps.templateName) {
            debug(`[Header.componentDidUpdate] Template name changed: ${prevProps.templateName} -> ${this.props.templateName}`);
        }
        
        if (this.props.lastUpdated !== prevProps.lastUpdated) {
            debug(`[Header.componentDidUpdate] Last updated changed: ${prevProps.lastUpdated} -> ${this.props.lastUpdated}`);
        }
        
        if (this.props.isUpdating !== prevProps.isUpdating) {
            debug(`[Header.componentDidUpdate] Updating state changed: ${prevProps.isUpdating} -> ${this.props.isUpdating}`);
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[Header.render] Rendering component');
        return (
            <>
                <header className="header">
                <div className="header-left">
                    <button 
                        className="templates-button"
                        onClick={this.handleTemplatesButtonClick.bind(this)}
                        title={LanguageManager.getText('templates')}
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                    <h1>
                        WPlace Progress Tracker - {this.props.templateName}
                    </h1>
                    {this.props.hasActiveTemplate && (
                        <button 
                            className="template-button"
                            onClick={this.handleTemplateButtonClick.bind(this)}
                            title={LanguageManager.getText('template')}
                        >
                            <i className="fas fa-pencil-alt"></i>
                        </button>
                    )}
                </div>
                <div className="header-right">
                    <div className="last-updated-container">
                        <button 
                            className="last-updated-button"
                            onClick={this.handleManualUpdate.bind(this)}
                            title="Click to update now"
                            disabled={this.props.isUpdating}
                        >
                            <i className={`fas fa-sync-alt refresh-icon ${this.props.isUpdating ? 'rotating' : ''}`}></i>
                            {LanguageManager.getText('lastUpdated')}: {this.props.lastUpdated.toLocaleTimeString()}
                        </button>
                    </div>
                    <select 
                        value={this.state.currentLanguage}
                        onChange={this.handleLanguageSelectorChange.bind(this)}
                        className="language-selector"
                    >
                        <option value="en">EN</option>
                        <option value="ru">RU</option>
                        <option value="es">ES</option>
                    </select>
                    <button 
                        className="dark-mode-toggle"
                        onClick={this.handleDarkModeToggle.bind(this)}
                        title={this.state.isDarkMode ? LanguageManager.getText('lightMode') : LanguageManager.getText('darkMode')}
                    >
                        <i className={this.state.isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
                    </button>
                    <button 
                        className="help-button"
                        onClick={this.handleHelpClick.bind(this)}
                        title={LanguageManager.getText('help')}
                    >
                        <i className="fas fa-question-circle"></i>
                    </button>
                    <a 
                        href="https://github.com/kozhilya/wplace-stat" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="button github-link"
                        title="View on GitHub"
                    >
                        <i className="fab fa-github"></i>
                    </a>
                </div>
            </header>
            
            {/* Help Modal */}
            {this.state.showHelpModal && (
                <div className="modal-overlay" onClick={this.handleHelpModalClose.bind(this)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{LanguageManager.getText('helpTitle')}</h2>
                            <button 
                                className="modal-close-button"
                                onClick={this.handleHelpModalClose.bind(this)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <ol>
                                {LanguageManager.getTextArray('helpItems').map((item: string, index: number) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ol>
                            <p><strong>{LanguageManager.getText('helpNote')}</strong></p>
                        </div>
                    </div>
                </div>
            )}
        </>);
    }
}
