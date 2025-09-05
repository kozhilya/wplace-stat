import { debug } from '../utils';

/**
 * Base class for all event arguments
 * Provides a foundation for typed event data
 */
export class EventArgs {   
    // Base class for all event arguments
}

/**
 * Type definition for event mapping structure
 * Maps event names to their corresponding argument classes
 */
export type EventMappingType = { [key in string]: typeof EventArgs };

/**
 * Mapping of event names to their argument classes
 * Defines the type structure for all events in the application
 */
export const EventMapping: EventMappingType = {
    'app:start': EventArgs,
} as const;

/**
 * Union type of all available event names
 */
export type EventNames = keyof typeof EventMapping;

/**
 * Type definition for event handler functions
 * @template T The type of event arguments
 */
type EventHandler<T extends EventArgs> = (args: T) => void;

/**
 * Singleton class for managing application events
 * Provides type-safe event subscription, emission, and unsubscription
 */
export class EventManager {
    private static instance: EventManager;
    private handlers: Map<EventNames, Set<EventHandler<any>>> = new Map();

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        debug('[EventManager.constructor] EventManager instance created');
    }

    /**
     * Subscribes to an event
     * @param eventName The name of the event to subscribe to
     * @param handler The event handler function
     */
    public on<T extends EventNames>(eventName: T, handler: EventHandler<InstanceType<typeof EventMapping[T]>>): void {
        debug(`[EventManager.on] Subscribing to event: ${eventName}`);
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
            debug(`[EventManager.on] Created new handler set for event: ${eventName}`);
        }
        this.handlers.get(eventName)!.add(handler);
        debug(`[EventManager.on] Handler added for event: ${eventName}. Total handlers: ${this.handlers.get(eventName)!.size}`);
    }

    /**
     * Unsubscribes from an event
     * @param eventName The name of the event to unsubscribe from
     * @param handler The event handler function to remove
     */
    public off<T extends EventNames>(eventName: T, handler: EventHandler<InstanceType<typeof EventMapping[T]>>): void {
        debug(`[EventManager.off] Unsubscribing from event: ${eventName}`);
        const eventHandlers = this.handlers.get(eventName);
        if (eventHandlers) {
            const beforeSize = eventHandlers.size;
            eventHandlers.delete(handler);
            const afterSize = eventHandlers.size;
            debug(`[EventManager.off] Handler removed from event: ${eventName}. Handlers: ${beforeSize} -> ${afterSize}`);
            
            if (eventHandlers.size === 0) {
                this.handlers.delete(eventName);
                debug(`[EventManager.off] Handler set cleared for event: ${eventName}`);
            }
        } else {
            debug(`[EventManager.off] No handlers found for event: ${eventName}`);
        }
    }

    /**
     * Emits an event, calling all subscribed handlers
     * @param eventName The name of the event to emit
     * @param args The event arguments to pass to handlers
     */
    public emit<T extends EventNames>(eventName: T, args: InstanceType<typeof EventMapping[T]>): void {
        debug(`[EventManager.emit] Emitting event: ${eventName}`);
        const eventHandlers = this.handlers.get(eventName);
        if (eventHandlers) {
            debug(`[EventManager.emit] Calling ${eventHandlers.size} handler(s) for event: ${eventName}`);
            eventHandlers.forEach(handler => {
                try {
                    handler(args);
                } catch (error) {
                    debug(`[EventManager.emit] Error in event handler for ${eventName}:`, error);
                }
            });
        } else {
            debug(`[EventManager.emit] No handlers registered for event: ${eventName}`);
        }
    }

    /**
     * Clears all handlers for a specific event
     * @param eventName The name of the event to clear
     */
    public clear(eventName: EventNames): void {
        debug(`[EventManager.clear] Clearing all handlers for event: ${eventName}`);
        const hadHandlers = this.handlers.has(eventName);
        this.handlers.delete(eventName);
        if (hadHandlers) {
            debug(`[EventManager.clear] Cleared handlers for event: ${eventName}`);
        } else {
            debug(`[EventManager.clear] No handlers to clear for event: ${eventName}`);
        }
    }

    /**
     * Clears all event handlers
     */
    public clearAll(): void {
        debug('[EventManager.clearAll] Clearing all event handlers');
        const eventCount = this.handlers.size;
        this.handlers.clear();
        debug(`[EventManager.clearAll] Cleared ${eventCount} event handler set(s)`);
    }

    /**
     * Gets the number of handlers for a specific event
     * @param eventName The name of the event
     * @returns The number of handlers subscribed to the event
     */
    public getHandlerCount(eventName: EventNames): number {
        const handlers = this.handlers.get(eventName);
        return handlers ? handlers.size : 0;
    }

    /**
     * Gets the singleton instance of EventManager
     * @returns The singleton EventManager instance
     */
    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            debug('[EventManager.getInstance] Creating new EventManager instance');
            EventManager.instance = new EventManager();
        } else {
            debug('[EventManager.getInstance] Returning existing EventManager instance');
        }
        return EventManager.instance;
    }
}
