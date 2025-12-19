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
    private flashTimer: number = 0;
    private originalMaterials: Map<THREE.Mesh, THREE.Material> = new Map();

    // Damage Tracking for DOTs
    public iceAuraTimer: number = 0;

    // AI State
    private actionTimer: number = 0;
    private state: 'Chase' | 'ChargeWindup' | 'Charging' | 'BarrageWindup' | 'SnowfallWindup' | 'Snowfalling' | 'Summoning' = 'Chase';
    private chargeDir: THREE.Vector3 = new THREE.Vector3();
    private actionCooldown: number = 3.0; // Time between special moves

    // Boss Abilities
    private snowfallTarget: THREE.Vector3 = new THREE.Vector3();
    private aoeIndicator: THREE.Mesh | null = null;
    private snowColumn: THREE.Mesh | null = null;

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
            this.health *= 15.0; // High health
            this.damage *= 1.5;  // High touch damage
            this.speed *= 0.5;   // Slower movement
            scale = 2.5;         // Huge
            colorTint = 0xff0000; // RED

            // Setup AOE Indicator (Hidden initially)
            const ringGeo = new THREE.RingGeometry(3.8, 4.0, 32);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
            this.aoeIndicator = new THREE.Mesh(ringGeo, ringMat);
            this.aoeIndicator.visible = false;
            scene.add(this.aoeIndicator);

            // Snow Column (AoE Visual)
            const colGeo = new THREE.CylinderGeometry(4, 4, 15, 16);
            const colMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            this.snowColumn = new THREE.Mesh(colGeo, colMat);
            this.snowColumn.visible = false;
            scene.add(this.snowColumn);
        }

        // Update maxHealth match current modified health
        this.maxHealth = this.health;

        // Apply Mutation Stats
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
            const model = modelTemplate.clone();
            model.position.set(0, 0, 0);
            const baseScale = 1.5;
            model.scale.set(baseScale * scale, baseScale * scale, baseScale * scale);

            if (colorTint !== null) {
                model.traverse((child: any) => {
                    if (child.isMesh) {
                        child.material = child.material.clone();
                        child.material.color.setHex(colorTint);
                        if (child.material.emissive) {
                            child.material.emissive.setHex(colorTint);
                            child.material.emissiveIntensity = 0.2;
                        }
                    }
                });
            }
            this.mesh.add(model);
        } else {
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

            const armGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 1 * scale);
            const armMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
            const arms = new THREE.Mesh(armGeo, armMat);
            arms.position.y = mid.position.y;
            arms.rotation.z = Math.PI / 2;

            this.mesh.add(bottom, mid, top, arms);
        }

        scene.add(this.mesh);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.flashTimer = 0.1;
        this.mesh.traverse((child: any) => {
            if (child.isMesh) {
                if (!this.originalMaterials.has(child)) {
                    this.originalMaterials.set(child, child.material);
                }
                child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            }
        });
    }

    public dispose(scene: THREE.Scene) {
        if (this.aoeIndicator) scene.remove(this.aoeIndicator);
        if (this.snowColumn) scene.remove(this.snowColumn);
        scene.remove(this.mesh);
    }

    update(dt: number, playerPosition: THREE.Vector3, otherEnemies: Enemy[] = [],
        spawnProjectile?: (pos: THREE.Vector3, dir: THREE.Vector3) => void,
        spawnMinion?: (pos: THREE.Vector3) => void,
        onAoeDamage?: (amount: number) => void) {

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
            if (this.flashTimer <= 0) {
                this.mesh.traverse((child: any) => {
                    if (child.isMesh && this.originalMaterials.has(child)) {
                        child.material = this.originalMaterials.get(child)!;
                    }
                });
            }
        }

        if (this.isBoss) {
            this.updateBossAI(dt, playerPosition, spawnProjectile, spawnMinion, onAoeDamage);
            return;
        }

        const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
        direction.y = 0;

        const separation = new THREE.Vector3();
        let separationCount = 0;
        for (const other of otherEnemies) {
            if (other === this || other.isDead) continue;
            const dist = this.mesh.position.distanceTo(other.mesh.position);
            if (dist < 1.0) {
                const push = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                push.normalize();
                push.divideScalar(dist);
                separation.add(push);
                separationCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.multiplyScalar(2.0);
        }

        if (direction.length() > 1) {
            direction.normalize();
            direction.add(separation).normalize();
            this.mesh.position.addScaledVector(direction, this.speed * dt);
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
        }
    }

    private updateBossAI(dt: number, playerPosition: THREE.Vector3,
        spawnProjectile?: (pos: THREE.Vector3, dir: THREE.Vector3) => void,
        spawnMinion?: (pos: THREE.Vector3) => void,
        onAoeDamage?: (amount: number) => void) {

        if (this.state !== 'Charging' && this.state !== 'Snowfalling') {
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
        }

        if (this.state === 'Chase') {
            const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
            direction.y = 0;
            if (direction.length() > 1.0) {
                direction.normalize();
                this.mesh.position.addScaledVector(direction, this.speed * dt);
            }

            this.actionTimer += dt;
            if (this.actionTimer > this.actionCooldown) {
                this.actionTimer = 0;
                const rng = Math.random();
                if (rng < 0.25) this.state = 'ChargeWindup';
                else if (rng < 0.5) this.state = 'BarrageWindup';
                else if (rng < 0.75) {
                    this.state = 'SnowfallWindup';
                    this.snowfallTarget.copy(playerPosition);
                } else {
                    this.state = 'Summoning';
                }
            }
        }
        else if (this.state === 'ChargeWindup') {
            this.actionTimer += dt;
            this.mesh.rotation.y += 15 * dt;
            if (this.actionTimer > 0.6) {
                this.actionTimer = 0;
                this.state = 'Charging';
                this.chargeDir = new THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                this.chargeDir.y = 0;
            }
        }
        else if (this.state === 'Charging') {
            this.actionTimer += dt;
            this.mesh.position.addScaledVector(this.chargeDir, this.speed * 6.0 * dt);
            if (this.actionTimer > 0.6) {
                this.actionTimer = 0;
                this.state = 'Chase';
                this.actionCooldown = 1.0 + Math.random() * 1.5;
            }
        }
        else if (this.state === 'BarrageWindup') {
            this.actionTimer += dt;
            if (this.actionTimer > 0.4) {
                this.actionTimer = 0;
                this.state = 'Chase';
                if (spawnProjectile) {
                    const count = 18;
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                        spawnProjectile(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), dir);
                    }
                }
                this.actionCooldown = 2.0 + Math.random() * 1.5;
            }
        }
        else if (this.state === 'SnowfallWindup') {
            this.actionTimer += dt;
            // Shaking
            this.mesh.position.x += (Math.random() - 0.5) * 0.15;
            this.mesh.position.z += (Math.random() - 0.5) * 0.15;

            if (this.aoeIndicator) {
                this.aoeIndicator.visible = true;
                this.aoeIndicator.position.copy(this.snowfallTarget);
                this.aoeIndicator.position.y = 0.1;
                const scale = 1.0 + Math.sin(this.actionTimer * 10) * 0.1;
                this.aoeIndicator.scale.set(scale, 1, scale);
            }

            if (this.actionTimer > 1.5) {
                this.actionTimer = 0;
                this.state = 'Snowfalling';
                if (this.aoeIndicator) this.aoeIndicator.visible = false;
                if (this.snowColumn) {
                    this.snowColumn.visible = true;
                    this.snowColumn.position.copy(this.snowfallTarget);
                    this.snowColumn.position.y = 7.5;
                }
            }
        }
        else if (this.state === 'Snowfalling') {
            this.actionTimer += dt;

            // Damage Check
            if (this.actionTimer < 0.5 && onAoeDamage) {
                if (playerPosition.distanceTo(this.snowfallTarget) < 4.0) {
                    onAoeDamage(50 * dt); // High DPS during snow
                }
            }

            if (this.actionTimer > 1.2) {
                this.actionTimer = 0;
                this.state = 'Chase';
                if (this.snowColumn) this.snowColumn.visible = false;
                this.actionCooldown = 2.0 + Math.random() * 1.5;
            }
        }
        else if (this.state === 'Summoning') {
            this.actionTimer += dt;
            this.mesh.position.y = Math.sin(this.actionTimer * 10) * 0.5;

            if (this.actionTimer > 1.0) {
                this.actionTimer = 0;
                this.state = 'Chase';
                this.mesh.position.y = 0;
                if (spawnMinion) {
                    // Spawn 3 minions around boss
                    for (let i = 0; i < 3; i++) {
                        const angle = (i / 3) * Math.PI * 2;
                        const offset = new THREE.Vector3(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
                        spawnMinion(this.mesh.position.clone().add(offset));
                    }
                }
                this.actionCooldown = 4.0;
            }
        }
    }
}
