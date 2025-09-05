type EventHandler<T extends EventArgs> = (args: T) => void;

export class EventManager {
    private static instance: EventManager;
    private handlers: Map<EventNames, Set<EventHandler<any>>> = new Map();

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Gets the singleton instance of EventManager
     */
    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    /**
     * Subscribes to an event
     * @param eventName The name of the event to subscribe to
     * @param handler The event handler function
     */
    public on<T extends EventNames>(eventName: T, handler: EventHandler<InstanceType<typeof EventMapping[T]>>): void {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add(handler);
    }

    /**
     * Unsubscribes from an event
     * @param eventName The name of the event to unsubscribe from
     * @param handler The event handler function to remove
     */
    public off<T extends EventNames>(eventName: T, handler: EventHandler<InstanceType<typeof EventMapping[T]>>): void {
        const eventHandlers = this.handlers.get(eventName);
        if (eventHandlers) {
            eventHandlers.delete(handler);
            if (eventHandlers.size === 0) {
                this.handlers.delete(eventName);
            }
        }
    }

    /**
     * Emits an event, calling all subscribed handlers
     * @param eventName The name of the event to emit
     * @param args The event arguments to pass to handlers
     */
    public emit<T extends EventNames>(eventName: T, args: InstanceType<typeof EventMapping[T]>): void {
        const eventHandlers = this.handlers.get(eventName);
        if (eventHandlers) {
            eventHandlers.forEach(handler => {
                try {
                    handler(args);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Clears all handlers for a specific event
     * @param eventName The name of the event to clear
     */
    public clear(eventName: EventNames): void {
        this.handlers.delete(eventName);
    }

    /**
     * Clears all event handlers
     */
    public clearAll(): void {
        this.handlers.clear();
    }
}

export class EventArgs {   
    // Base class for all event arguments
}

export const EventMapping: { [key in EventNames]: typeof EventArgs } = {
    'app:start': EventArgs,
} as const;

export type EventNames = keyof typeof EventMapping;
