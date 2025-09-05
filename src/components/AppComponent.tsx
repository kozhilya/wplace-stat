import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Splitter } from './Splitter';
import { LanguageManager } from '../managers/language-manager';
import { Template } from '../types/template';
import { TemplateCollection } from '../types/template-collection';
import { StatisticsRow, StatisticsManager } from '../managers/statistics-manager';
import { AUTO_UPDATE_INTERVAL } from '../settings';
import { debug } from '../utils';
import { EventManager } from '../managers/event-manager';

export const AppComponent: React.FC = () => {
    const eventManager = EventManager.getInstance();

    const [templateName, setTemplateName] = useState<string>('Untitled Template');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [leftPanelWidth, setLeftPanelWidth] = useState<number>(550);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [statistics, setStatistics] = useState<StatisticsRow[]>([]);
    const statisticsManagerRef = React.useRef<StatisticsManager | null>(null);
    const [currentTemplate, setCurrentTemplate] = useState<Template | undefined>();
    const currentTemplateRef = useRef<Template | undefined>();
    
    // Keep the ref updated
    useEffect(() => {
        currentTemplateRef.current = currentTemplate;
    }, [currentTemplate]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const templateCollection = React.useRef(new TemplateCollection());
    const [leftPanelView, setLeftPanelView] = useState<'template' | 'templates' | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    useEffect(() => {
        debug('AppComponent.useEffect: Component mounted, initializing');
        LanguageManager.initialize();
        debug('AppComponent.useEffect: LanguageManager initialized');
        
        // Initialize dark mode
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        debug(`AppComponent.useEffect: Dark mode setting from localStorage: ${savedDarkMode}`);
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            debug('AppComponent.useEffect: Dark mode enabled');
        }
        
        // Load templates from localStorage
        const loadedTemplates = templateCollection.current.getTemplates();
        debug(`AppComponent.useEffect: Loaded ${loadedTemplates.length} templates from collection`);
        setTemplates(loadedTemplates);
        
        // Handle hash on mount
        const handleInitialHash = async () => {
            debug(`AppComponent.handleInitialHash: Window hash: ${window.location.hash}`);
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1);
                    debug(`AppComponent.handleInitialHash: Deserializing template from hash`);
                    const template = Template.deserialize(hash);
                    
                    // Check if the template exists in the collection
                    const exists = loadedTemplates.some(t => 
                        t.name === template.name && 
                        t.tlX === template.tlX && 
                        t.tlY === template.tlY && 
                        t.pxX === template.pxX && 
                        t.pxY === template.pxY && 
                        t.imageDataUrl === template.imageDataUrl
                    );
                    
                    debug(`AppComponent.handleInitialHash: Template exists in collection: ${exists}`);
                    // If not exists, add to collection
                    if (!exists) {
                        debug('AppComponent.handleInitialHash: Adding template to collection');
                        templateCollection.current.addTemplate(template);
                        const updatedTemplates = templateCollection.current.getTemplates();
                        setTemplates(updatedTemplates);
                    }
                    
                    // Load and set the current template
                    debug('AppComponent.handleInitialHash: Loading template image');
                    await template.loadTemplateImage();
                    debug('AppComponent.handleInitialHash: Loading Wplace image');
                    await template.loadWplaceImage();
                    setCurrentTemplate(template);
                    setTemplateName(template.name);
                    setLastUpdated(new Date());
                    debug(`AppComponent.handleInitialHash: Set current template: ${template.name}`);
                    
                    // Update statistics
                    if (template.templateImage && template.wplaceImage) {
                        debug('AppComponent.handleInitialHash: Creating statistics manager');
                        statisticsManagerRef.current = new StatisticsManager(
                            template.templateImage, 
                            template.wplaceImage
                        );
                        setStatistics(statisticsManagerRef.current.getStatistics());
                        debug('AppComponent.handleInitialHash: Statistics updated');
                    }
                } catch (error) {
                    debug('AppComponent.handleInitialHash: Error loading template from hash:', error);
                }
            } else if (loadedTemplates.length > 0) {
                debug('AppComponent.handleInitialHash: Hash empty, templates available');
                // If hash is empty but there are templates, show the template list view
                // This will be handled by LeftPanel
            } else {
                debug('AppComponent.handleInitialHash: Hash empty, no templates available');
            }
            // Otherwise, show the template config view (default)
        };

        handleInitialHash();
        
        // Listen for hash changes to update the template
        const handleHashChange = async () => {
            debug(`AppComponent.handleHashChange: Hash changed to: ${window.location.hash}`);
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1);
                    const template = Template.deserialize(hash);
                    await template.loadTemplateImage();
                    await template.loadWplaceImage();
                    setCurrentTemplate(template);
                    setTemplateName(template.name);
                    setLastUpdated(new Date());
                    debug(`AppComponent.handleHashChange: Updated template to: ${template.name}`);
                } catch (error) {
                    debug('AppComponent.handleHashChange: Error loading template from hash change:', error);
                }
            } else {
                debug('AppComponent.handleHashChange: Hash cleared, resetting template');
                setCurrentTemplate(undefined);
                setTemplateName('Untitled Template');
                setLastUpdated(new Date());
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        
        // Set up auto-update interval
        if (currentTemplate) {
            debug('AppComponent.useEffect: Starting auto-update');
            startAutoUpdate();
        }
        
        // Listen for manual update requests
        const handleManualUpdate = async () => {
            debug('AppComponent.handleManualUpdate: Manual update requested');
            if (currentTemplateRef.current && updateWplaceImageRef.current) {
                await updateWplaceImageRef.current(currentTemplateRef.current);
            } else {
                debug('AppComponent.handleManualUpdate: No template or update function available');
            }
        };
        
        window.addEventListener('manualUpdateRequested', handleManualUpdate);
        
        // Cleanup
        return () => {
            debug('AppComponent.useEffect: Cleaning up event listeners and intervals');
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('manualUpdateRequested', handleManualUpdate);
            stopAutoUpdate();
        };
    }, []);

    const handleSplitterResize = (deltaX: number) => {
        setLeftPanelWidth(prevWidth => {
            const newWidth = prevWidth + deltaX;
            // Enforce minimum and maximum widths
            if (newWidth > 200 && newWidth < window.innerWidth - 200) {
                return newWidth;
            }
            return prevWidth;
        });
    };

    const handleTemplateSave = (template: Template) => {
        debug(`AppComponent.handleTemplateSave: Saving template: ${template.name}`);
        setTemplateName(template.name);
        setLastUpdated(new Date());
        setCurrentTemplate(template);
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
    };

    const handleTemplateLoad = async (template: Template) => {
        debug(`AppComponent.handleTemplateLoad: Loading template: ${template.name}`);
        setTemplateName(template.name);
        setLastUpdated(new Date());
        
        // Ensure the template image is loaded
        if (!template.templateImage) {
            await template.loadTemplateImage();
        }
        // Load the Wplace image
        if (!template.wplaceImage) {
            await template.loadWplaceImage();
        }
        
        // Update the current template
        setCurrentTemplate(template);
        
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
        
        // Update statistics
        if (template.templateImage && template.wplaceImage) {
            statisticsManagerRef.current = new StatisticsManager(
                template.templateImage, 
                template.wplaceImage
            );
            setStatistics(statisticsManagerRef.current.getStatistics());
        }
        
        // Start auto-update when a template is loaded
        startAutoUpdate();
    };
    
    // Function to update Wplace image and recalculate statistics
    const updateWplaceImageRef = useRef<((template: Template) => Promise<void>) | null>(null);
    
    // Update the ref whenever the function changes
    useEffect(() => {
        updateWplaceImageRef.current = async (template: Template) => {
            setIsUpdating(true);
            try {
                // Reload the Wplace image directly on the current template
                await template.loadWplaceImage();
                
                // Update statistics
                if (template.templateImage && template.wplaceImage) {
                    statisticsManagerRef.current = new StatisticsManager(
                        template.templateImage, 
                        template.wplaceImage
                    );
                    setStatistics(statisticsManagerRef.current.getStatistics());
                }
                
                // Update last updated time
                setLastUpdated(new Date());
                
                // Force re-render by updating the current template reference
                // Since the template object is the same, scale and offset are preserved
                setCurrentTemplate(template);
            } catch (error) {
                console.error('Error updating Wplace image:', error);
            } finally {
                setIsUpdating(false);
            }
        };
    }, []);
    
    // Auto-update functions
    const startAutoUpdate = () => {
        stopAutoUpdate();
        if (currentTemplate) {
            autoUpdateIntervalRef.current = setInterval(() => {
                if (updateWplaceImageRef.current) {
                    updateWplaceImageRef.current(currentTemplate);
                }
            }, AUTO_UPDATE_INTERVAL);
        }
    };
    
    const stopAutoUpdate = () => {
        if (autoUpdateIntervalRef.current) {
            clearInterval(autoUpdateIntervalRef.current);
            autoUpdateIntervalRef.current = null;
        }
    };
    
    // Update auto-update interval when currentTemplate changes
    useEffect(() => {
        if (currentTemplate) {
            startAutoUpdate();
        } else {
            stopAutoUpdate();
        }
        
        return () => {
            stopAutoUpdate();
        };
    }, [currentTemplate]);

    return (
        <div className="app">
            <Header 
                templateName={templateName} 
                lastUpdated={lastUpdated} 
                onTemplateButtonClick={() => setLeftPanelView('template')}
                onTemplatesButtonClick={() => setLeftPanelView('templates')}
                hasActiveTemplate={!!currentTemplate}
                isUpdating={isUpdating}
            />
            <div className="main-content" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                <LeftPanel 
                    width={leftPanelWidth} 
                    statistics={statistics} 
                    onTemplateSave={handleTemplateSave}
                    onTemplateLoad={handleTemplateLoad}
                    currentTemplate={currentTemplate}
                    activeView={leftPanelView}
                    onCloseView={() => setLeftPanelView(null)}
                    onStatisticsRowClick={(colorId) => setSelectedColorId(colorId)}
                    onCreateTemplate={() => setLeftPanelView('template')}
                    onTemplateButtonClick={() => setLeftPanelView('template')}
                    selectedColorId={selectedColorId}
                />
                <Splitter onResize={handleSplitterResize} />
                <RightPanel 
                    currentTemplate={currentTemplate} 
                    selectedColorId={selectedColorId}
                    statistics={statistics}
                />
            </div>
        </div>
    );
};
