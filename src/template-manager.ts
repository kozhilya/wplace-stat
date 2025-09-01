import { TemplateData } from './types';

export class TemplateManager {
    static saveTemplateToHash(templateData: TemplateData): void {
        const jsonData = JSON.stringify(templateData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
        window.location.hash = base64Data;
    }

    static loadTemplateFromHash(): TemplateData | null {
        if (window.location.hash) {
            const base64Data = window.location.hash.substring(1);
            try {
                const jsonData = decodeURIComponent(escape(atob(base64Data)));
                return JSON.parse(jsonData) as TemplateData;
            } catch (error) {
                console.error('Error loading data from hash:', error);
                return null;
            }
        }
        return null;
    }

    static fillFormFromTemplateData(templateData: TemplateData): void {
        (document.getElementById('tl-x') as HTMLInputElement).value = templateData.tlX.toString();
        (document.getElementById('tl-y') as HTMLInputElement).value = templateData.tlY.toString();
        (document.getElementById('px-x') as HTMLInputElement).value = templateData.pxX.toString();
        (document.getElementById('px-y') as HTMLInputElement).value = templateData.pxY.toString();
    }

    static getFormData(): Omit<TemplateData, 'imageDataUrl'> & { imageFile: File | null } {
        const tlX = parseInt((document.getElementById('tl-x') as HTMLInputElement).value);
        const tlY = parseInt((document.getElementById('tl-y') as HTMLInputElement).value);
        const pxX = parseInt((document.getElementById('px-x') as HTMLInputElement).value);
        const pxY = parseInt((document.getElementById('px-y') as HTMLInputElement).value);
        
        const imageInput = document.getElementById('template-image') as HTMLInputElement;
        const imageFile = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
        
        return { tlX, tlY, pxX, pxY, imageFile };
    }
}
