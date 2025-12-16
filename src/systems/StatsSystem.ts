export class StatsSystem {
    public health: number = 100;
    public maxHealth: number = 100;

    constructor() { }

    update(_dt: number) {
        // Future health regen or decay logic can go here
        // For now, no implicit changes to health over time
    }

    get isDead(): boolean {
        return this.health <= 0;
    }
}
