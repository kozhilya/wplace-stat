import { debug } from "../utils";
import { Template } from "./template";

export class TemplateCollection {
    templates: Template[] = [];

    constructor() {
        this.loadFromLocalStorage();
    }

    indexOf(template: Template): number {
        return this.templates.indexOf(template);
    }

    findIndexByCoordinates(tlX: number, tlY: number, pxX: number, pxY: number): number {
        return this.templates.findIndex(t => 
            t.tlX === tlX && 
            t.tlY === tlY && 
            t.pxX === pxX && 
            t.pxY === pxY
        );
    }

    addTemplate(template: Template): void {
        this.templates.push(template);
        this.saveToLocalStorage();
    }

    removeTemplate(index: number): void {
        this.templates.splice(index, 1);
        this.saveToLocalStorage();
    }

    getTemplates(): Template[] {
        return [...this.templates];
    }

    private saveToLocalStorage(): void {
        localStorage.setItem('templateCollection', JSON.stringify(this.templates));
    }

    private loadFromLocalStorage(): void {
        const stored = localStorage.getItem('templateCollection');
        if (stored) {
            try {
                const templatesData = JSON.parse(stored);
                this.templates = templatesData.map((data: any) => 
                    new Template(
                        data.name,
                        data.tlX,
                        data.tlY,
                        data.pxX,
                        data.pxY,
                        data.imageDataUrl
                    )
                );
            } catch (error) {
                debug('Error loading templates from localStorage:', error);
                this.templates = [];
            }
        }
    }
}
