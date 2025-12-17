import * as THREE from 'three';

export type MutationType = 'None' | 'Giant' | 'Sprinter' | 'Tank';

export class Enemy {
    public mesh: THREE.Group;
    public health: number = 3;
    public maxHealth: number = 3;
    private speed: number = 2;
    public damage: number = 10; // Damage per second
    public isDead: boolean = false;
    public isBoss: boolean = false;

    // Damage Tracking for DOTs
    public iceAuraTimer: number = 0;

    // AI State
    private actionTimer: number = 0;
    private state: 'Chase' | 'ChargeWindup' | 'Charging' | 'BarrageWindup' = 'Chase';
    private chargeDir: THREE.Vector3 = new THREE.Vector3();
    private actionCooldown: number = 3.0; // Time between special moves

    constructor(scene: THREE.Scene, position: THREE.Vector3, modelTemplate: THREE.Group | null = null, mutation: MutationType = 'None', difficultyScalar: number = 1.0, isBoss: boolean = false) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        this.isBoss = isBoss;

        // Base HP
        this.health = 3;
        this.maxHealth = 3;

        // Apply Difficulty
        this.health *= difficultyScalar;
        this.damage *= difficultyScalar;
        this.speed *= (1 + (difficultyScalar - 1) * 0.5); // Scale speed slower than hp/dmg to avoid unplayable speed

        // Apply Scaling and Tint
        let scale = 1.0;
        let colorTint: number | null = null; // Hex

        if (this.isBoss) {
            this.health *= 25.0; // Buffed Health (was 15x)
            this.damage *= 2.5;  // Buffed Damage
            this.speed *= 0.75; // Faster (was 0.5)
            scale = 2.5; // Huge
            colorTint = 0xff0000; // RED
        }

        // Update maxHealth match current modified health
        this.maxHealth = this.health;

        // Apply Mutation Stats

        // Apply Mutation Stats
        // Bosses don't mutate, or mutations stack? Let's say Boss overrides mutation for simplicity or stacks.
        // Let's allow Boss + Mutation for crazy fun, but Boss visuals override.
        if (!this.isBoss) {
            switch (mutation) {
                case 'Giant':
                    this.health *= 2.5;
                    this.speed *= 0.6;
                    scale = 1.6;
                    colorTint = 0x55ff55;
                    break;
                case 'Sprinter':
                    this.health *= 0.6;
                    this.speed *= 1.8;
                    scale = 0.7;
                    colorTint = 0xffaa00;
                    break;
                case 'Tank':
                    this.health *= 4.0;
                    this.speed *= 0.4;
                    scale = 1.3;
                    colorTint = 0x5555ff;
                    break;
            }
        }

        if (modelTemplate) {
            // Clone the model
            const model = modelTemplate.clone();
            // Reset position of clone to 0,0,0 relative to parent mesh
            model.position.set(0, 0, 0);
            // Ensure visible scale
            const baseScale = 1.5;
            model.scale.set(baseScale * scale, baseScale * scale, baseScale * scale);

            // Apply Color Tint if needed
            if (colorTint !== null) {
                model.traverse((child: any) => {
                    if (child.isMesh) {
                        // Clone material to avoid affecting shared asset
                        child.material = child.material.clone();
                        child.material.color.setHex(colorTint);
                        // Also tint emissive for visibility if standard material
                        if (child.material.emissive) {
                            child.material.emissive.setHex(colorTint);
                            child.material.emissiveIntensity = 0.2;
                        }
                    }
                });
            }

            this.mesh.add(model);
        } else {
            // Fallback: Snowman body
            const bottomGeo = new THREE.SphereGeometry(0.6 * scale, 16, 16);
            const midGeo = new THREE.SphereGeometry(0.4 * scale, 16, 16);
            const topGeo = new THREE.SphereGeometry(0.25 * scale, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: colorTint || 0xffffff });

            const bottom = new THREE.Mesh(bottomGeo, material);
            bottom.position.y = 0.6 * scale;

            const mid = new THREE.Mesh(midGeo, material);
            mid.position.y = (0.6 + 0.4 + 0.3) * scale;

            const top = new THREE.Mesh(topGeo, material);
            top.position.y = (0.6 + 0.4 + 0.3 + 0.25 + 0.15) * scale;

            // Arms
            const armGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 1 * scale);
            const armMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
            const arms = new THREE.Mesh(armGeo, armMat);
            arms.position.y = mid.position.y;
            arms.rotation.z = Math.PI / 2;

            this.mesh.add(bottom, mid, top, arms);
        }

        scene.add(this.mesh);
    }

    update(dt: number, playerPosition: THREE.Vector3, otherEnemies: Enemy[] = [], spawnProjectile?: (pos: THREE.Vector3, dir: THREE.Vector3) => void) {
        if (this.isBoss) {
            this.updateBossAI(dt, playerPosition, spawnProjectile);
            return;
        }

        // Simple follow logic
        const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
        direction.y = 0; // Don't fly

        // Separation Force
        const separation = new THREE.Vector3();
        let separationCount = 0;

        for (const other of otherEnemies) {
            if (other === this || other.isDead) continue;

            const dist = this.mesh.position.distanceTo(other.mesh.position);
            if (dist < 1.0) { // Keep them 1 unit apart
                const push = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                push.normalize();
                push.divideScalar(dist); // Weight by distance (closer = stronger push)
                separation.add(push);
                separationCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.multiplyScalar(2.0); // Strength of separation
        }

        const distance = direction.length();
        if (distance > 1) { // Always chase if not touching
            direction.normalize();

            // Blend follow and separation
            direction.add(separation).normalize();

            this.mesh.position.addScaledVector(direction, this.speed * dt);

            // Look at player
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
        }
    }

    private updateBossAI(dt: number, playerPosition: THREE.Vector3, spawnProjectile?: (pos: THREE.Vector3, dir: THREE.Vector3) => void) {
        // Default Rotation to look at player unless charging
        if (this.state !== 'Charging') {
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
        }

        if (this.state === 'Chase') {
            // Chase Behavior same as normal but maybe slower/faster?
            const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
            direction.y = 0;
            if (direction.length() > 1.0) {
                direction.normalize();
                this.mesh.position.addScaledVector(direction, this.speed * dt);
            }

            // Timer for special ability
            this.actionTimer += dt;
            if (this.actionTimer > this.actionCooldown) {
                this.actionTimer = 0;
                // Pick Ability
                if (Math.random() < 0.5) {
                    this.state = 'ChargeWindup';
                    // Visual cue: Tint brighter? Flash?
                    // For now, simple stop.
                } else if (spawnProjectile) {
                    this.state = 'BarrageWindup';
                }
            }
        }
        else if (this.state === 'ChargeWindup') {
            this.actionTimer += dt;
            // 0.6 second warning (Faster)
            this.mesh.rotation.y += 15 * dt;

            if (this.actionTimer > 0.6) {
                this.actionTimer = 0;
                this.state = 'Charging';
                // Lock direction
                this.chargeDir = new THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                this.chargeDir.y = 0;
            }
        }
        else if (this.state === 'Charging') {
            this.actionTimer += dt;
            // Charge! Faster (6x)
            this.mesh.position.addScaledVector(this.chargeDir, this.speed * 6.0 * dt);

            if (this.actionTimer > 0.6) { // Shorter charge duration but faster
                this.actionTimer = 0;
                this.state = 'Chase'; // Back to normal
                this.actionCooldown = 1.5 + Math.random() * 1.5; // Lower CD
            }
        }
        else if (this.state === 'BarrageWindup') {
            this.actionTimer += dt;
            // 0.4s stop
            if (this.actionTimer > 0.4) {
                this.actionTimer = 0;
                this.state = 'Chase';

                // FIRE!
                if (spawnProjectile) {
                    const count = 18; // More projectiles
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                        spawnProjectile(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), dir);
                    }
                }
                this.actionCooldown = 2.0 + Math.random() * 2.0;
            }
        }
    }
}
