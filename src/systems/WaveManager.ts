import * as THREE from 'three';
import { Enemy, MutationType } from '../entities/Enemy';

export class WaveManager {
    private scene: THREE.Scene;
    private spawnTimer: number = 0;
    private spawnRate: number = 2.0; // Seconds between spawns
    private spawnRadius: number = 20; // Distance from player
    private enemyModel: THREE.Group | null = null;

    private bossSpawnLevel: number = 0; // Track last level boss was spawned at

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public setEnemyModel(model: THREE.Group) {
        this.enemyModel = model;
    }

    update(dt: number, playerPos: THREE.Vector3, enemies: Enemy[], difficulty: number = 1.0, playerLevel: number) {
        this.spawnTimer += dt;

        // Check for Boss Spawn (Every 5 levels, e.g., 5, 10, 15)
        if (playerLevel > 0 && playerLevel % 5 === 0 && this.bossSpawnLevel !== playerLevel) {
            this.bossSpawnLevel = playerLevel;
            this.spawnBoss(playerPos, enemies, difficulty);
        }

        // Scale spawn rate by difficulty: Higher difficulty = Lower interval
        const currentSpawnRate = Math.max(0.2, this.spawnRate / difficulty);

        // Cap max enemies to avoid lag
        const maxEnemies = Math.floor(10 * difficulty);

        if (this.spawnTimer >= currentSpawnRate && enemies.length < maxEnemies) {
            this.spawnTimer = 0;
            this.spawnEnemy(playerPos, enemies, difficulty, playerLevel);
        }
    }

    public spawnEnemy(playerPos: THREE.Vector3, enemies: Enemy[], difficulty: number, playerLevel: number, overridePos?: THREE.Vector3) {
        let spawnPos: THREE.Vector3;

        if (overridePos) {
            spawnPos = overridePos.clone();
        } else {
            // Random angle
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * this.spawnRadius;
            const z = Math.sin(angle) * this.spawnRadius;
            spawnPos = new THREE.Vector3(playerPos.x + x, 0, playerPos.z + z);
        }

        // Roll Mutation
        // Mutations ONLY after level 10
        let mutation: MutationType = 'None';

        if (playerLevel >= 10) {
            // Chance scales with difficulty: base 0.1 at diff 1.0, 0.2 at diff 2.0, etc.
            const mutationChance = Math.min(0.5, 0.1 * difficulty);

            if (Math.random() < mutationChance) {
                const types: MutationType[] = ['Giant', 'Sprinter', 'Tank'];
                mutation = types[Math.floor(Math.random() * types.length)];
            }
        }

        enemies.push(new Enemy(this.scene, spawnPos, this.enemyModel, mutation, difficulty));
    }

    public spawnBoss(playerPos: THREE.Vector3, enemies: Enemy[], difficulty: number) {
        // Random angle
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * this.spawnRadius;
        const z = Math.sin(angle) * this.spawnRadius;

        const spawnPos = new THREE.Vector3(playerPos.x + x, 0, playerPos.z + z);

        // Boss: Passed as Normal Mutation, Difficulty, but isBoss = true
        enemies.push(new Enemy(this.scene, spawnPos, this.enemyModel, 'None', difficulty, true));
        console.log("BOSS SPAWNED!");
    }
}
