// Создай документацию для методов этого файла. AI!

import { en } from '../../locales/en';
import { ru } from '../../locales/ru';
import { es } from '../../locales/es';

type Language = 'en' | 'ru' | 'es';
type Translations = typeof en;

type LanguageChangeCallback = () => void;

export class LanguageManager {
    private static currentLanguage: Language = 'en';
    private static translations: Record<Language, Translations> = {
        en: en,
        ru: ru,
        es: es
    };
    private static languageChangeCallbacks: LanguageChangeCallback[] = [];

    static initialize(): void {
        // Load language preference from localStorage
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        this.updateTexts();
        this.notifyLanguageChange();
    }

    static setLanguage(language: Language): void {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            this.updateTexts();
            this.notifyLanguageChange();
        }
    }

    static getCurrentLanguage(): Language {
        return this.currentLanguage;
    }

    static onLanguageChange(callback: LanguageChangeCallback): void {
        this.languageChangeCallbacks.push(callback);
    }

    static removeLanguageChangeListener(callback: LanguageChangeCallback): void {
        const index = this.languageChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.languageChangeCallbacks.splice(index, 1);
        }
    }

    private static notifyLanguageChange(): void {
        this.languageChangeCallbacks.forEach(callback => callback());
    }

    static updateTexts(): void {
        // Update all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && key in this.translations[this.currentLanguage]) {
                const text = this.translations[this.currentLanguage][key as keyof Translations];
                if (element instanceof HTMLInputElement && element.type === 'submit') {
                    element.value = text;
                } else if (element instanceof HTMLButtonElement) {
                    element.textContent = text;
                } else if (element instanceof HTMLTableCellElement) {
                    // For table headers, preserve the sort indicator structure
                    const span = element.querySelector('span.text');
                    if (span) {
                        span.textContent = text;
                    } else {
                        element.innerHTML = `<span class="text">${text}</span><span class="sort-indicator"></span>`;
                    }
                } else {
                    element.textContent = text;
                }
            }
        });
    }

    static getText(key: keyof Translations): string {
        return this.translations[this.currentLanguage][key];
    }
}
