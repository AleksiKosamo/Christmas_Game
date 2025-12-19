export interface DevMenuCallbacks {
    onAddXP: () => void;
    onLevelUp: () => void;
    onHeal: () => void;
    onKillAll: () => void;
    onSpawnBoss: () => void;
    onSpawnPresent: () => void;
    onToggleGodMode: () => void;
    onChangeDifficulty: (delta: number) => void;
}

export class DevMenu {
    private element: HTMLElement;
    private isVisible: boolean = false;
    private godBtn: HTMLButtonElement | null = null;

    constructor(callbacks: DevMenuCallbacks) {
        this.element = document.createElement('div');
        this.setupStyles();

        // Prevent clicks from reaching the game
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());
        this.element.addEventListener('click', (e) => e.stopPropagation());

        this.element.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #00ff00; font-size: 24px; text-shadow: 0 0 10px rgba(0,255,0,0.5);">DEV CONSOLE</h2>
                <div style="font-size: 10px; color: #888;">Numpad 6+7 to Toggle</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="dev-section">
                    <h3 style="color: #ffd700; margin-top: 0; font-size: 14px; border-bottom: 1px solid #444;">PLAYER</h3>
                    <div id="player-actions" style="display: flex; flexDirection: column; gap: 8px;"></div>
                </div>
                
                <div class="dev-section">
                    <h3 style="color: #00d2ff; margin-top: 0; font-size: 14px; border-bottom: 1px solid #444;">WORLD / SPAWN</h3>
                    <div id="world-actions" style="display: flex; flexDirection: column; gap: 8px;"></div>
                </div>
            </div>

            <div style="margin-top: 20px; border-top: 1px solid #444; padding-top: 10px; display: flex; justify-content: space-between;">
                <button id="dev-close" style="background: #900; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">CLOSE</button>
            </div>
        `;

        const playerContainer = this.element.querySelector('#player-actions')!;
        const worldContainer = this.element.querySelector('#world-actions')!;

        // --- Stats ---
        playerContainer.appendChild(this.createBtn("Add 1000 XP", callbacks.onAddXP));
        playerContainer.appendChild(this.createBtn("Instant Level Up", callbacks.onLevelUp));
        playerContainer.appendChild(this.createBtn("Full Heal", callbacks.onHeal));

        this.godBtn = this.createBtn("God Mode: OFF", () => {
            callbacks.onToggleGodMode();
            this.updateGodBtn();
        });
        playerContainer.appendChild(this.godBtn);

        // --- World ---
        worldContainer.appendChild(this.createBtn("Kill All Enemies", callbacks.onKillAll, "#900"));
        worldContainer.appendChild(this.createBtn("Spawn Boss", callbacks.onSpawnBoss));
        worldContainer.appendChild(this.createBtn("Spawn Present", callbacks.onSpawnPresent));

        const diffGrid = document.createElement('div');
        diffGrid.style.display = 'flex';
        diffGrid.style.gap = '5px';
        diffGrid.appendChild(this.createBtn("Diff -0.1", () => callbacks.onChangeDifficulty(-0.1)));
        diffGrid.appendChild(this.createBtn("Diff +0.1", () => callbacks.onChangeDifficulty(0.1)));
        worldContainer.appendChild(diffGrid);

        this.element.querySelector('#dev-close')!.addEventListener('click', () => this.hide());

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.appendChild(this.element);
        }
    }

    private setupStyles() {
        const s = this.element.style;
        s.position = 'absolute';
        s.top = '50%';
        s.left = '50%';
        s.transform = 'translate(-50%, -50%)';
        s.background = 'rgba(10, 15, 20, 0.85)';
        s.backdropFilter = 'blur(10px)';
        s.padding = '30px';
        s.borderRadius = '15px';
        s.display = 'none';
        s.flexDirection = 'column';
        s.color = 'white';
        s.fontFamily = "'Inter', 'Segoe UI', sans-serif";
        s.border = '1px solid rgba(0, 255, 0, 0.3)';
        s.boxShadow = '0 20px 50px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,255,0,0.1)';
        s.zIndex = '2000';
        s.pointerEvents = 'auto';
        s.minWidth = '450px';
    }

    private createBtn(text: string, onClick: () => void, bg: string = "#2a2d32") {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.width = '100%';
        btn.style.padding = '10px';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = bg;
        btn.style.color = '#eee';
        btn.style.border = '1px solid rgba(0,255,0,0.1)';
        btn.style.borderRadius = '6px';
        btn.style.fontSize = '12px';
        btn.style.fontWeight = 'bold';
        btn.style.transition = 'all 0.2s ease';
        btn.style.outline = 'none';
        btn.style.marginBottom = '5px';

        btn.onmouseover = () => {
            btn.style.backgroundColor = '#3e4248';
            btn.style.border = '1px solid rgba(0,255,0,0.5)';
            btn.style.transform = 'translateY(-1px)';
        };
        btn.onmouseout = () => {
            btn.style.backgroundColor = bg;
            btn.style.border = '1px solid rgba(0,255,0,0.1)';
            btn.style.transform = 'translateY(0)';
        };
        btn.onclick = onClick;
        return btn;
    }

    private updateGodBtn() {
        if (!this.godBtn) return;
        const isOn = this.godBtn.innerText.includes("OFF");
        this.godBtn.innerText = isOn ? "God Mode: ON" : "God Mode: OFF";
        this.godBtn.style.color = isOn ? "#00ff00" : "#eee";
        this.godBtn.style.boxShadow = isOn ? "0 0 10px rgba(0,255,0,0.3)" : "none";
    }

    public show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        document.exitPointerLock();
    }

    public hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
    }

    public toggle() {
        if (this.isVisible) this.hide();
        else this.show();
    }
}
