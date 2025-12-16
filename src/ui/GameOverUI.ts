export class GameOverUI {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'game-over-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '2000';
        this.container.style.color = 'white';
        this.container.style.fontFamily = "'Mountains of Christmas', cursive, sans-serif";
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s';
        this.container.style.pointerEvents = 'none'; // Initially click-through

        document.body.appendChild(this.container);
    }

    show(stats: { killed: number, time: string, level: number, upgrades: string[] }) {
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = '1';

        const counts: { [key: string]: number } = {};
        for (const u of stats.upgrades) {
            counts[u] = (counts[u] || 0) + 1;
        }

        const upgradeList = Object.keys(counts).length > 0
            ? Object.entries(counts).map(([name, count]) =>
                `<span style="background: #333; padding: 5px 10px; border-radius: 5px; margin: 5px; display: inline-block; border: 1px solid #555;">${name} <span style="color: #ffff88; font-weight: bold;">x${count}</span></span>`
            ).join('')
            : "<em>No upgrades collected</em>";

        this.container.innerHTML = `
            <h1 style="font-size: 80px; color: #ff3333; margin-bottom: 20px; text-shadow: 0 0 20px red;">GAME OVER</h1>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 15px; border: 2px solid #555; text-align: center; max-width: 600px;">
                <h2 style="font-size: 30px; margin-bottom: 30px; color: gold;">Statistics</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; font-size: 24px; margin-bottom: 30px;">
                    <div>🕒 Time Survived:</div> <div style="color: #88ff88;">${stats.time}</div>
                    <div>💀 Enemies Defeated:</div> <div style="color: #ff8888;">${stats.killed}</div>
                    <div>⭐ Level Reached:</div> <div style="color: #ffff88;">${stats.level}</div>
                </div>

                <h3 style="margin-bottom: 15px; color: #aaa;">Upgrades Collected</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; font-family: monospace; font-size: 14px;">
                    ${upgradeList}
                </div>
            </div>

            <button id="restart-btn" style="
                margin-top: 40px;
                padding: 15px 40px;
                font-size: 30px;
                background: linear-gradient(to bottom, #2ecc71, #27ae60);
                border: none;
                border-radius: 10px;
                color: white;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                font-family: inherit;
                transition: transform 0.1s;
            ">Try Again</button>
        `;

        const btn = document.getElementById('restart-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                location.reload();
            });
            btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        }
    }
}
