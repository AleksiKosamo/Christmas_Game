export class StorageSystem {
    private static readonly BEST_TIME_KEY = 'christmas_survival_best_time';

    static getBestTime(): number {
        const stored = localStorage.getItem(this.BEST_TIME_KEY);
        return stored ? parseFloat(stored) : 0;
    }

    static saveBestTime(time: number) {
        const currentBest = this.getBestTime();
        if (time > currentBest) {
            localStorage.setItem(this.BEST_TIME_KEY, time.toString());
            return true; // New best!
        }
        return false;
    }

    static formatTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
