import { Upgrade } from "../systems/UpgradeSystem";

export class UpgradeUI {
    private container: HTMLElement;
    private onSelectCallback: ((upgrade: Upgrade) => void) | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'upgrade-overlay';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.display = 'none';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '1000';

        document.body.appendChild(this.container);
    }

    public show(upgrades: Upgrade[], onSelect: (upgrade: Upgrade) => void) {
        this.onSelectCallback = onSelect;
        this.container.innerHTML = '';
        this.container.style.display = 'flex';

        const cardContainer = document.createElement('div');
        cardContainer.style.display = 'flex';
        cardContainer.style.gap = '20px';

        upgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.style.width = '200px';
            card.style.height = '300px';
            card.style.backgroundColor = '#222';
            card.onmouseenter = () => card.style.transform = 'scale(1.05)';
            card.onmouseleave = () => card.style.transform = 'scale(1)';
            card.onclick = () => this.select(upgrade);
            const borderColor = upgrade.color || '#ffffff';
            card.style.borderColor = borderColor;
            card.style.boxShadow = `0 0 10px ${borderColor}40`; // Soft glow

            card.innerHTML = `
                <div style="color: ${borderColor}; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${upgrade.rarity?.toUpperCase() || ''}</div>
                <h2 style="color: ${borderColor}; margin-bottom: 10px; text-align: center;">${upgrade.name}</h2>
                <p style="color: white; text-align: center;">${upgrade.description}</p>
            `;

            cardContainer.appendChild(card);
        });

        const title = document.createElement('h1');
        title.innerText = "LEVEL UP!";
        title.style.color = "white";
        title.style.position = "absolute";
        title.style.top = "10%";
        this.container.appendChild(title);

        this.container.appendChild(cardContainer);
    }

    private select(upgrade: Upgrade) {
        this.container.style.display = 'none';
        if (this.onSelectCallback) {
            this.onSelectCallback(upgrade);
        }
    }
}
