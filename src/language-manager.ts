import { en } from './locales/en';

export class LanguageManager {
    private static currentLanguage = en;

    static initialize(): void {
        this.updateTexts();
    }

    static updateTexts(): void {
        // Update all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && key in this.currentLanguage) {
                const text = this.currentLanguage[key as keyof typeof this.currentLanguage];
                if (element instanceof HTMLInputElement && element.type === 'submit') {
                    element.value = text;
                } else {
                    element.textContent = text;
                }
            }
        });
    }

    static getText(key: keyof typeof en): string {
        return this.currentLanguage[key];
    }
}
