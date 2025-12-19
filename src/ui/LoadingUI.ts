export class LoadingUI {
    private container: HTMLElement;
    private progressBar: HTMLElement;
    private statusText: HTMLElement;
    private progressText: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'loading-ui';
        this.setupStyles();

        this.container.innerHTML = `
            <div class="loading-box">
                <h1 class="loading-title">CHRISTMAS SURVIVOR</h1>
                <div class="progress-wrapper">
                    <div id="loading-bar-fill"></div>
                </div>
                <div class="loading-stats">
                    <span id="loading-status">Waking up Santa...</span>
                    <span id="loading-percent">0%</span>
                </div>
            </div>
        `;

        this.progressBar = this.container.querySelector('#loading-bar-fill') as HTMLElement;
        this.statusText = this.container.querySelector('#loading-status') as HTMLElement;
        this.progressText = this.container.querySelector('#loading-percent') as HTMLElement;

        document.body.appendChild(this.container);
    }

    private setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #loading-ui {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at center, #1a2a6c, #b21f1f, #fdbb2d);
                background-size: 200% 200%;
                animation: gradientBG 15s ease infinite;
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: opacity 0.8s ease-out, visibility 0.8s;
                font-family: 'Mountains of Christmas', cursive, sans-serif;
            }

            @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            .loading-box {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                padding: 50px;
                border-radius: 30px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 25px 45px rgba(0,0,0,0.2);
                width: 500px;
                text-align: center;
                color: white;
            }

            .loading-title {
                font-size: 3.5rem;
                margin-bottom: 30px;
                text-shadow: 0 0 20px rgba(255,255,255,0.5);
                letter-spacing: 2px;
            }

            .progress-wrapper {
                width: 100%;
                height: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 15px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            #loading-bar-fill {
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #ff416c, #ff4b2b);
                box-shadow: 0 0 15px rgba(255, 65, 108, 0.5);
                transition: width 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
            }

            .loading-stats {
                display: flex;
                justify-content: space-between;
                font-size: 1.1rem;
                color: rgba(255,255,255,0.8);
                font-family: 'Outfit', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }

    public update(progress: number, item: string) {
        const percent = Math.floor(progress * 100);
        this.progressBar.style.width = `${percent}%`;
        this.progressText.innerText = `${percent}%`;

        // Clean up item name for display (e.g. from path)
        const name = item.split('/').pop()?.split('.')[0] || item;
        this.statusText.innerText = `Loading ${name}...`;
    }

    public hide() {
        this.container.style.opacity = '0';
        this.container.style.visibility = 'hidden';
        setTimeout(() => {
            this.container.remove();
        }, 1000);
    }
}
