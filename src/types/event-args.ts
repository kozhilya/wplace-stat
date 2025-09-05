import { Template } from './template';
import { StatisticsRow } from '../managers/statistics-manager';
import { IEventArgs } from '../managers/event-manager';
import { CanvasInteractionManager, Point } from '../managers/canvas-interaction-manager';

// Event classes for AppComponent
export class TemplateSaveEventArts implements IEventArgs {
    template: Template;
    
    constructor(template: Template) {
        this.template = template;
    }
}

export class TemplateLoadEventArts implements IEventArgs {
    template: Template;
    
    constructor(template: Template) {
        this.template = template;
    }
}

export class TemplateChangeEventArts implements IEventArgs {
    template?: Template;
    
    constructor(template?: Template) {
        this.template = template;
    }
}

export class StatisticsUpdateEventArts implements IEventArgs {
    statistics: StatisticsRow[];
    
    constructor(statistics: StatisticsRow[]) {
        this.statistics = statistics;
    }
}

export class LastUpdatedEventArts implements IEventArgs {
    lastUpdated: Date;
    
    constructor(lastUpdated: Date) {
        this.lastUpdated = lastUpdated;
    }
}

// Canvas events
export class CanvasMovementEventArgs implements IEventArgs {
    /** The CanvasInteractionManager instance that generated this event */
    sender: CanvasInteractionManager;

    /** The current offset of the canvas in pixels */
    offset: Point;
    /** The current zoom scale of the canvas (1 = 100%) */
    scale: number;

    /**
     * Creates a new CanvasMovementEventArgs instance
     * @param sender The CanvasInteractionManager that generated the event
     * @param offset The current canvas offset
     * @param scale The current zoom scale
     */
    constructor(sender: CanvasInteractionManager, offset: Point, scale: number) {        
        this.sender = sender;
        this.offset = offset;
        this.scale = scale;
    }
}

/**
 * Type definition for canvas zoom request operations
 */
export type CanvasZoomRequest = 'zoom-out' | 'zoom-in' | 'zoom-reset';

/**
 * Event arguments for canvas zoom request events
 * Contains information about the requested zoom operation
 */
export class CanvasZoomRequestEventArgs implements IEventArgs {
    /** The type of zoom operation requested */
    request: CanvasZoomRequest;

    /**
     * Creates a new CanvasZoomRequestEventArgs instance
     * @param request The type of zoom operation requested
     */
    constructor(request: CanvasZoomRequest) {
        this.request = request;
    }
}

// Language events
export class LanguageRequestEventArts implements IEventArgs {
    targetLanguage: 'en' | 'ru' | 'es';

    constructor(targetLanguage: 'en' | 'ru' | 'es') {
        this.targetLanguage = targetLanguage;
    }
}

export class LanguageChangeEventArts implements IEventArgs {
    manager: any;
    targetLanguage: 'en' | 'ru' | 'es';
    translations: any;

    constructor(manager: any, targetLanguage: 'en' | 'ru' | 'es', translations: any) {
        this.manager = manager;
        this.targetLanguage = targetLanguage;
        this.translations = translations;
    }
}
