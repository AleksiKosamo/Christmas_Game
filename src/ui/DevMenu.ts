export class DevMenu {
    private element: HTMLElement;
    private isVisible: boolean = false;

    constructor(
        onAddXP: () => void,
        onSpawnBoss: () => void,
        onHeal: () => void,
        onToggleGodMode: () => void
    ) {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '50%';
        this.element.style.left = '50%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.element.style.padding = '20px';
        this.element.style.borderRadius = '10px';
        this.element.style.display = 'none';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '10px';
        this.element.style.color = 'white';
        this.element.style.fontFamily = 'monospace';
        this.element.style.border = '2px solid #00ff00';
        this.element.style.zIndex = '1000';
        this.element.style.pointerEvents = 'auto'; // Ensure clickable

        // Prevent clicks from reaching the game (and re-locking pointer)
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());
        this.element.addEventListener('click', (e) => e.stopPropagation());

        this.element.innerHTML = '<h2 style="margin: 0 0 10px 0; color: #00ff00;">DEV MENU</h2>';

        const createBtn = (text: string, onClick: () => void) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.padding = '10px';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '#333';
            btn.style.color = 'white';
            btn.style.border = '1px solid #666';
            btn.onclick = onClick;
            return btn;
        };

        this.element.appendChild(createBtn("Add 1000 XP", onAddXP));
        this.element.appendChild(createBtn("Spawn Boss", onSpawnBoss));
        this.element.appendChild(createBtn("Full Heal", onHeal));

        const godBtn = createBtn("Toggle God Mode: OFF", () => {
            onToggleGodMode();
            // Simple toggle text update, actual state is managed by Game, assumes sync
            godBtn.innerText = godBtn.innerText.includes("OFF") ? "Toggle God Mode: ON" : "Toggle God Mode: OFF";
            godBtn.style.color = godBtn.innerText.includes("ON") ? "gold" : "white";
        });
        this.element.appendChild(godBtn);

        this.element.appendChild(createBtn("Close", () => this.hide()));

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.appendChild(this.element);
        }
    }

    public show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        // Unlock pointer to allow clicking
        document.exitPointerLock();
    }

    public hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
        // Re-locking pointer is up to user clicking game
    }

    public toggle() {
        if (this.isVisible) this.hide();
        else this.show();
    }
}
