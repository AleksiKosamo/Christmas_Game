export class HUD {
    private timeDisplay: HTMLElement | null;

    private barsContainer: HTMLElement | null;
    private expContainer: HTMLElement | null;
    private bossHealthContainer: HTMLElement | null;

    constructor() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.innerHTML = `
                <div id="boss-health-container" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 400px; display: none; flex-direction: column; align-items: center; z-index: 500;">
                    <div id="boss-name" style="color: #ff00ff; font-family: 'Mountains of Christmas', cursive; font-size: 24px; text-shadow: 0 0 5px white; margin-bottom: 5px;">BOSS</div>
                    <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.7); border: 2px solid #ff00ff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px #ff00ff; position: relative;">
                        <div id="boss-health-bar" style="width: 100%; height: 100%; background: linear-gradient(to right, #aa00aa, #ff00ff); transition: width 0.1s;"></div>
                        <div id="boss-health-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-family: monospace; font-size: 14px; font-weight: bold; text-shadow: 1px 1px 2px black;"></div>
                    </div>
                </div>

                <div style="position: absolute; top: 10px; right: 10px; color: white; font-family: monospace; font-size: 20px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 5px;">
                    <div id="time-display">00:00</div>
                </div>
                

                <div id="bars-container" style="position: absolute; bottom: 40px; left: 20px; width: 250px; display: flex; flex-direction: column; gap: 10px; color: white; font-family: monospace; font-size: 14px; text-shadow: 1px 1px 2px black;">
                    <!-- Health bar inserted here -->
                </div>

                <div id="exp-container" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 20px; background: rgba(0,0,0,0.8); border-top: 2px solid #4488ff;">
                     <!-- EXP Bar -->
                </div>
            `;

            this.timeDisplay = document.getElementById('time-display');
            this.barsContainer = document.getElementById('bars-container');
            this.expContainer = document.getElementById('exp-container');
            this.bossHealthContainer = document.getElementById('boss-health-container');
        } else {
            this.timeDisplay = null;
            this.barsContainer = null;
            this.expContainer = null;
            this.bossHealthContainer = null;
        }
    }

    public update(time: string, health: number, maxHealth: number, xp: number, maxXp: number, level: number, difficulty: number) {
        if (this.timeDisplay) this.timeDisplay.innerText = time;

        // Update Bars
        if (this.barsContainer) {
            const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));

            this.barsContainer.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <div style="color: #ff4444; font-weight: bold; margin-bottom:2px;">HEALTH ${Math.ceil(health)}/${maxHealth}</div>
                    <div style="width: 100%; height: 15px; background: rgba(0,0,0,0.6); border: 2px solid #ff4444; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${healthPct}%; height: 100%; background: #ff4444; transition: width 0.2s;"></div>
                    </div>
                </div>

                <div style="margin-top: 5px; text-align: left;">
                    <span style="color: #aaaaaa; font-size: 12px;">Difficulty: <span style="color: #ffffff;">${difficulty.toFixed(2)}x</span></span>
                </div>
            `;
        }

        if (this.expContainer) {
            const xpPct = Math.max(0, Math.min(100, (xp / maxXp) * 100));
            this.expContainer.innerHTML = `
                <div style="width: 100%; height: 100%; position: relative;">
                    <div style="width: ${xpPct}%; height: 100%; background: linear-gradient(to right, #2266cc, #4488ff); transition: width 0.2s;"></div>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-family: monospace; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        LVL ${level} - ${Math.floor(xp)} / ${maxXp} EXP
                    </div>
                </div>
            `;
        }
    }

    public updateBossHealth(current: number, max: number, name: string = "EVIL SNOWMAN") {
        if (this.bossHealthContainer) {
            if (current <= 0) {
                this.bossHealthContainer.style.display = 'none';
                return;
            }
            this.bossHealthContainer.style.display = 'flex';

            const bar = document.getElementById('boss-health-bar');
            const nameEl = document.getElementById('boss-name');
            const textEl = document.getElementById('boss-health-text');

            if (nameEl) nameEl.innerText = name;
            if (bar) {
                const pct = (current / max) * 100;
                bar.style.width = `${pct}%`;
            }
            if (textEl) {
                textEl.innerText = `${Math.ceil(current)}/${Math.ceil(max)}`;
            }
        }
    }

    public hideBossHealth() {
        if (this.bossHealthContainer) {
            this.bossHealthContainer.style.display = 'none';
        }
    }
}
