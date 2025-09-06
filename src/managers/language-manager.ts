/**
 * Manages internationalization (i18n) for the application
 * Handles language switching, translation retrieval, and UI text updates
 */
import { en } from '../locales/en';
import { ru } from '../locales/ru';
import { es } from '../locales/es';
import { EventManager } from './event-manager';
import { LanguageChangeEventArts, LanguageRequestEventArts } from '../types/event-args';
import { debug } from '../utils';

/** Supported language codes */
type Language = 'en' | 'ru' | 'es';

/** Type for translation objects matching the structure of the English translations */
type Translations = {
    [K in keyof typeof en]: string | string[];
};

/** Callback function type for language change events */
type LanguageChangeCallback = () => void;

/**
 * A static class that manages application internationalization
 * Provides methods to set/get current language, retrieve translations, and update UI elements
 */
export class LanguageManager {
    /** The currently selected language code */
    private static currentLanguage: Language = 'en';
    /** Dictionary of all available translations by language code */
    private static translations: Record<Language, Translations> = {
        en: en,
        ru: ru,
        es: es
    };
    /** Array of callbacks to be notified when the language changes */
    private static languageChangeCallbacks: LanguageChangeCallback[] = [];

    /**
     * Initializes the language manager by loading the saved language preference
     * Updates all UI texts and notifies listeners of the current language
     * Should be called when the application starts
     */
    static initialize(): void {
        // Load language preference from localStorage
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        this.updateTexts();
        
        // Subscribe to language request events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:request', this.handleLanguageRequest.bind(this));
        
        // Emit initial language change event
        eventManager.emit('language:change', new LanguageChangeEventArts(
            this,
            this.currentLanguage,
            this.translations[this.currentLanguage]
        ));
    }

    /**
     * Changes the application's current language
     * @param language The language code to switch to ('en', 'ru', or 'es')
     */
    static setLanguage(language: Language): void {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            this.updateTexts();
            
            // Emit language change event
            const eventManager = EventManager.getInstance();
            eventManager.emit('language:change', new LanguageChangeEventArts(
                this,
                language,
                this.translations[language]
            ));
        }
    }

    /**
     * Gets the currently active language code
     * @returns The current language code
     */
    static getCurrentLanguage(): Language {
        return this.currentLanguage;
    }

    /**
     * Registers a callback to be notified when the language changes
     * @param callback Function to call when the language changes
     */
    static onLanguageChange(callback: LanguageChangeCallback): void {
        this.languageChangeCallbacks.push(callback);
    }

    /**
     * Handles language request events
     * @param args Language request event arguments
     */
    private static handleLanguageRequest(args: LanguageRequestEventArts): void {
        debug(`[LanguageManager.handleLanguageRequest] Language requested: ${args.targetLanguage}`);
        this.setLanguage(args.targetLanguage);
    }


    /**
     * Updates all UI elements with data-i18n attributes to display text in the current language
     * Handles different element types (inputs, buttons, table cells) appropriately
     */
    static updateTexts(): void {
        // Update all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && key in this.translations[this.currentLanguage]) {
                const text = this.translations[this.currentLanguage][key as keyof Translations];
                // Convert arrays to strings by joining with commas
                const displayText = Array.isArray(text) ? text.join(', ') : text;
                
                if (element instanceof HTMLInputElement && element.type === 'submit') {
                    element.value = displayText;
                } else if (element instanceof HTMLButtonElement) {
                    element.textContent = displayText;
                } else if (element instanceof HTMLTableCellElement) {
                    // For table headers, preserve the sort indicator structure
                    const span = element.querySelector('span.text');
                    if (span) {
                        span.textContent = displayText;
                    } else {
                        element.innerHTML = `<span class="text">${displayText}</span><span class="sort-indicator"></span>`;
                    }
                } else {
                    element.textContent = displayText;
                }
            }
        });
    }

    /**
     * Retrieves a translated string for the given key in the current language
     * @param key The translation key to look up
     * @returns The translated string
     */
    static getText(key: keyof Translations): string {
        return this.translations[this.currentLanguage][key];
    }
}
