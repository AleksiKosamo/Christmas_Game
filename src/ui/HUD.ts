export class HUD {
    private timeDisplay: HTMLElement | null;

    private barsContainer: HTMLElement | null;

    constructor() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.innerHTML = `
                <div style="position: absolute; top: 10px; right: 10px; color: white; font-family: monospace; font-size: 20px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 5px;">
                    <div id="time-display">00:00</div>
                </div>
                

                <div id="bars-container" style="position: absolute; bottom: 20px; left: 20px; width: 250px; display: flex; flex-direction: column; gap: 10px; color: white; font-family: monospace; font-size: 14px; text-shadow: 1px 1px 2px black;">
                    <!-- Health bar inserted here -->
                </div>
            `;

            this.timeDisplay = document.getElementById('time-display');
            this.barsContainer = document.getElementById('bars-container');
        } else {
            this.timeDisplay = null;
            this.barsContainer = null;
        }
    }

    public update(time: string, health: number, maxHealth: number, xp: number, maxXp: number, level: number) {
        if (this.timeDisplay) this.timeDisplay.innerText = time;

        // Update Bars
        if (this.barsContainer) {
            const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
            const xpPct = Math.max(0, Math.min(100, (xp / maxXp) * 100));

            this.barsContainer.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <div style="color: #ff4444; font-weight: bold; margin-bottom:2px;">HEALTH ${Math.ceil(health)}/${maxHealth}</div>
                    <div style="width: 100%; height: 15px; background: rgba(0,0,0,0.6); border: 2px solid #ff4444; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${healthPct}%; height: 100%; background: #ff4444; transition: width 0.2s;"></div>
                    </div>
                </div>

                <div style="margin-bottom: 5px;">
                    <div style="color: #4488ff; font-weight: bold; margin-bottom:2px; display: flex; justify-content: space-between;">
                        <span>EXP</span>
                        <span style="color: gold;">LVL ${level}</span>
                    </div>
                    <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.6); border: 2px solid #4488ff; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${xpPct}%; height: 100%; background: #4488ff; transition: width 0.2s;"></div>
                    </div>
                </div>
            `;
        }
    }
}
