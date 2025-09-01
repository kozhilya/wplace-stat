import './styles/main.scss';

class App {
    constructor() {
        this.init();
    }

    private init(): void {
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = '<h1>Hello, TypeScript SPA!</h1>';
        }
    }
}

new App();
