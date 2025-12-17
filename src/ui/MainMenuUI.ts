export class MainMenuUI {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'main-menu-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent for background view
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '3000'; // Above Game Over
        this.container.style.color = 'white';
        this.container.style.fontFamily = "'Mountains of Christmas', cursive, sans-serif";
        this.container.style.backdropFilter = "blur(5px)";

        document.body.appendChild(this.container);
        this.render();
    }

    private render() {
        this.container.innerHTML = `
            <div style="text-align: center; max-width: 800px; padding: 50px; border-radius: 20px; background: rgba(0,0,0,0.5); border: 2px solid #555; box-shadow: 0 0 50px rgba(0,0,0,0.8);">
                <h1 style="font-size: 100px; color: #ff3333; margin: 0; text-shadow: 0 0 20px red; letter-spacing: 5px;">Christmas Survival</h1>
                <p style="font-size: 30px; color: #aaa; margin-top: 10px; margin-bottom: 50px;">Can you survive the Christmas Eve blizzard?</p>
                
                <button id="start-btn" style="
                    padding: 20px 60px;
                    font-size: 40px;
                    background: linear-gradient(to bottom, #2ecc71, #27ae60);
                    border: none;
                    border-radius: 15px;
                    color: white;
                    cursor: pointer;
                    font-family: inherit;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                    transition: transform 0.1s;
                ">Start Game</button>

                <div style="margin-top: 40px; color: #888; font-size: 18px; font-family: monospace;">
                    WASD to Move | Space to Dash
                </div>
            </div>
        `;

        const btn = document.getElementById('start-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.hide();
                // We emit an event or handle callback? 
                // For simplicity, we can pass a callback to show, or constructor.
            });
            btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        }
    }

    public show(onStart: () => void) {
        this.container.style.display = 'flex';

        // Re-bind click since render might be called once, but let's just make sure
        const btn = document.getElementById('start-btn');
        if (btn) {
            btn.onclick = () => {
                this.hide();
                onStart();
            };
        }
    }

    public hide() {
        this.container.style.display = 'none';
    }
}
