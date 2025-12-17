export class StatsSystem {
    public health: number = 100;
    public maxHealth: number = 100;
    public healthRegen: number = 0; // HP per second

    constructor() { }

    update(dt: number) {
        if (this.health < this.maxHealth && this.healthRegen > 0) {
            this.health = Math.min(this.maxHealth, this.health + this.healthRegen * dt);
        }
    }

    get isDead(): boolean {
        return this.health <= 0;
    }
}
