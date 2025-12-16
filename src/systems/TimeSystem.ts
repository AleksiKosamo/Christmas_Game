export class TimeSystem {
    public totalTime: number = 0; // Total seconds survived

    update(dt: number) {
        this.totalTime += dt;
    }

    get isNight(): boolean {
        return false; // Always day
    }

    get formattedTime(): string {
        const minutes = Math.floor(this.totalTime / 60);
        const seconds = Math.floor(this.totalTime % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
