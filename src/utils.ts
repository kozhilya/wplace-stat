import { IS_LOCALHOST } from "./settings.js";

// Global flag to control debug mode
declare global {
    interface Window {
        DEBUG_MODE: boolean;
    }
}

// Set DEBUG_MODE based on environment or query parameter
if (typeof window !== 'undefined') {
    window.DEBUG_MODE = window.DEBUG_MODE || IS_LOCALHOST ||
                        new URLSearchParams(window.location.search).has('debug');
}

/**
 * Clamps a value between a minimum and maximum value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Debug logging function that only logs when DEBUG_MODE is true
 */
export function debug(...args: any[]): void {
    if (typeof window !== 'undefined' && window.DEBUG_MODE) {
        console.log(...args);
    }
}
