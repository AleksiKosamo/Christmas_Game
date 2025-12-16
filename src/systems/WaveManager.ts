import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';

export class WaveManager {
    private scene: THREE.Scene;
    private spawnTimer: number = 0;
    private spawnRate: number = 2.0; // Seconds between spawns
    private spawnRadius: number = 20; // Distance from player

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    update(dt: number, playerPos: THREE.Vector3, enemies: Enemy[], playerLevel: number = 1) {
        this.spawnTimer += dt;

        // Base spawn rate = 2.0s
        // Decrease by 0.1s for each level
        const levelFactor = (playerLevel - 1) * 0.1;
        const currentSpawnRate = Math.max(0.5, this.spawnRate - levelFactor);

        // Cap max enemies to avoid lag
        const maxEnemies = 10 + (playerLevel * 5); // 15 at lvl 1, 20 at lvl 2, etc.

        if (this.spawnTimer >= currentSpawnRate && enemies.length < maxEnemies) {
            this.spawnTimer = 0;
            this.spawnEnemy(playerPos, enemies);
        }
    }

    private spawnEnemy(playerPos: THREE.Vector3, enemies: Enemy[]) {
        // Random angle
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * this.spawnRadius;
        const z = Math.sin(angle) * this.spawnRadius;

        const spawnPos = new THREE.Vector3(playerPos.x + x, 0, playerPos.z + z);

        enemies.push(new Enemy(this.scene, spawnPos));
    }
}
