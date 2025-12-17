import * as THREE from 'three';
import { Input } from './Input';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Present } from '../entities/Present';
import { TimeSystem } from '../systems/TimeSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { HUD } from '../ui/HUD';
import { Environment } from '../world/Environment';
import { Town } from '../world/Town';
// REMOVED: import { InteractionSystem } from '../systems/InteractionSystem';
import { Snowball } from '../entities/Snowball';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { WaveManager } from '../systems/WaveManager';
import { XPOrb } from '../entities/XPOrb';
import { UpgradeSystem } from '../systems/UpgradeSystem';
// @ts-ignore
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UpgradeUI } from '../ui/UpgradeUI';
import { GameOverUI } from '../ui/GameOverUI';
import { MainMenuUI } from '../ui/MainMenuUI';
import { FloatingText } from '../entities/FloatingText';
import { SoundManager } from '../systems/SoundManager';
import { DevMenu } from '../ui/DevMenu';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private composer: EffectComposer; // Post-processing
    // @ts-ignore
    private bloomPass: UnrealBloomPass;
    private input: Input;
    private player: Player;
    private enemies: Enemy[] = [];
    private snowballs: Snowball[] = [];
    private xpOrbs: XPOrb[] = [];
    private floatingTexts: FloatingText[] = [];
    private presents: Present[] = [];
    private enemyProjectiles: EnemyProjectile[] = [];
    private presentModel: THREE.Group | null = null;
    private clock: THREE.Clock;

    private timeSystem: TimeSystem;
    private statsSystem: StatsSystem;
    private hud: HUD;
    private environment: Environment;
    // REMOVED: private interactionSystem: InteractionSystem;
    private waveManager: WaveManager;
    private upgradeSystem: UpgradeSystem;
    private upgradeUI: UpgradeUI;
    private gameOverUI: GameOverUI;
    private mainMenuUI: MainMenuUI;
    private soundManager: SoundManager;
    private devMenu: DevMenu;

    // Dev State
    private lastNumpad6Time: number = 0;
    private lastNumpad7Time: number = 0;
    private godMode: boolean = false;

    // Stats tracking
    private enemiesKilled: number = 0;
    private collectedUpgrades: string[] = [];

    private directionalLight: THREE.DirectionalLight;

    // Combat Stats
    private fireTimer: number = 0;
    public fireRate: number = 0.5; // Seconds between shots

    // Game State
    private isPaused: boolean = false;
    private inMenu: boolean = true; // Start in menu

    // Progression
    private playerLevel: number = 1;
    private playerXP: number = 0;
    private xpToNextLevel: number = 100;
    public xpPickupRange: number = 3.0; // Magnet range
    public xpMultiplier: number = 1.0;
    public difficulty: number = 1.0;

    // Advanced Combat Stats
    public projectileCount: number = 1; // Multishot
    public projectileDamage: number = 1; // Basic damage
    public projectileSpeed: number = 1.0;
    public projectileRange: number = 20.0; // Default range

    // Ice Aura
    public hasIceAura: boolean = false;
    public iceAuraRadius: number = 3.0; // Visual radius
    public iceAuraDamage: number = 2.0; // Damage per TICK
    public iceAuraTickRate: number = 2.0; // Ticks per second
    public iceAuraMesh: THREE.Mesh | null = null;

    // Auto Slash
    public hasAutoSlash: boolean = false;
    public slashCooldown: number = 2.0; // Seconds
    public slashTimer: number = 0;
    public slashRadius: number = 2.5;
    public slashDamage: number = 3;
    public slashMesh: THREE.Mesh | null = null;
    public slashEffectTimer: number = 0; // For visual feedback

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false is better for post-processing performance usually, or let composer handle it
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('app')?.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Post-Processing Setup
        const renderScene = new RenderPass(this.scene, this.camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.8; // Only very bright things glow
        bloomPass.strength = 1.5; // Stronger glow for those who qualify
        bloomPass.radius = 1.0;
        this.bloomPass = bloomPass;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        this.clock = new THREE.Clock();
        this.input = new Input();

        this.timeSystem = new TimeSystem();
        this.statsSystem = new StatsSystem();
        this.hud = new HUD();
        this.environment = new Environment(this.scene);
        // REMOVED: this.interactionSystem = new InteractionSystem();
        this.waveManager = new WaveManager(this.scene);
        this.upgradeSystem = new UpgradeSystem();
        this.upgradeUI = new UpgradeUI();
        this.gameOverUI = new GameOverUI();
        this.mainMenuUI = new MainMenuUI();
        this.soundManager = new SoundManager();

        // Dev Menu Initialization
        this.devMenu = new DevMenu(
            () => { // Add XP
                this.playerXP += 1000;
                this.soundManager.playLevelUp();
            },
            () => { // Spawn Boss
                this.waveManager.spawnBoss(this.player.mesh.position, this.enemies, this.difficulty);
            },
            () => { // Heal
                this.statsSystem.health = this.statsSystem.maxHealth;
            },
            () => { // Toggle God Mode
                this.godMode = !this.godMode;
                console.log("God Mode:", this.godMode);
            }
        );

        // Dev Combo Listener
        window.addEventListener('keydown', (e) => {
            const now = Date.now();
            if (e.code === 'Numpad6') {
                this.lastNumpad6Time = now;
                if (now - this.lastNumpad7Time < 500) {
                    this.devMenu.toggle();
                }
            } else if (e.code === 'Numpad7') {
                this.lastNumpad7Time = now;
                if (now - this.lastNumpad6Time < 500) {
                    this.devMenu.toggle();
                }
            }
        });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(10, 20, 10);
        this.scene.add(this.directionalLight);

        // Load Assets
        this.loadAssets();

        // Add a ground plane
        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);

        new Town(this.scene);
        this.player = new Player(this.scene);

        // Enemies managed by WaveManager now

        window.addEventListener('resize', () => this.onWindowResize());

        // SHOW MENU
        this.isPaused = true;
        this.inMenu = true;
        this.mainMenuUI.show(() => {
            this.inMenu = false;
            this.isPaused = false;
            this.clock.getDelta(); // Reset clock
        });

        this.animate();
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());

        // Always render scene even in menu for background?
        // If in menu, maybe rotate camera or something
        if (this.inMenu) {
            const dt = this.clock.getDelta();

            // Orbit camera around 0,0 for menu bg
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.sin(time) * 20;
            this.camera.position.z = Math.cos(time) * 20;
            this.camera.position.y = 10;
            this.camera.lookAt(0, 0, 0);

            // Update environment (snow, lights)
            this.environment.update(dt, true); // Keep it night? or time based?
            // Let time pass? No, maybe static night

            this.composer.render();
            return;
        }

        if (this.isPaused) return;

        const dt = this.clock.getDelta();
        this.input.update(); // Reset mousePressed

        // ICE AURA LOGIC
        if (this.hasIceAura) {
            if (!this.iceAuraMesh) {
                // Create Aura Visual
                const geo = new THREE.RingGeometry(this.iceAuraRadius - 0.2, this.iceAuraRadius, 32);
                geo.rotateX(-Math.PI / 2);
                const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
                this.iceAuraMesh = new THREE.Mesh(geo, mat);
                this.scene.add(this.iceAuraMesh);
            }
            this.iceAuraMesh.position.copy(this.player.mesh.position);
            this.iceAuraMesh.position.y = 0.1; // Just above ground
            // Pulse visual
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            this.iceAuraMesh.scale.set(scale, 1, scale);

            // Aura Damage
            for (const enemy of this.enemies) {
                if (enemy.isDead) continue;
                const dist = this.player.mesh.position.distanceTo(enemy.mesh.position);
                if (dist < this.iceAuraRadius) {
                    // Tick Logic
                    enemy.iceAuraTimer += dt;
                    if (enemy.iceAuraTimer >= (1.0 / this.iceAuraTickRate)) {
                        enemy.iceAuraTimer = 0;

                        enemy.health -= this.iceAuraDamage;
                        this.spawnFloatingText(enemy.mesh.position, this.iceAuraDamage.toFixed(0), "#00ffff");

                        if (enemy.health <= 0) this.killEnemy(enemy);
                    }
                    // Slow effect could go here
                }
            }
        }

        // AUTO SLASH LOGIC
        if (this.hasAutoSlash) {
            this.slashTimer += dt;
            if (this.slashTimer >= this.slashCooldown) {
                // Check if any enemy is close
                let hitAny = false;
                for (const enemy of this.enemies) {
                    if (enemy.isDead) continue;
                    if (this.player.mesh.position.distanceTo(enemy.mesh.position) < this.slashRadius) {
                        enemy.health -= this.slashDamage;
                        if (enemy.health <= 0) this.killEnemy(enemy);
                        hitAny = true;
                        // Spawn text
                        this.spawnFloatingText(enemy.mesh.position, this.slashDamage.toString(), "#ff0000");
                    }
                }

                if (hitAny || this.enemies.some(e => e.mesh.position.distanceTo(this.player.mesh.position) < this.slashRadius + 2)) {
                    // Trigger slash visual if there are enemies nearby even if not hit, for feedback
                    this.slashTimer = 0;
                    this.soundManager.playDash(); // Reuse whoosh sound

                    // Visual
                    if (!this.slashMesh) {
                        const geo = new THREE.TorusGeometry(this.slashRadius, 0.1, 8, 32, Math.PI); // Half circle
                        geo.rotateX(-Math.PI / 2);
                        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                        this.slashMesh = new THREE.Mesh(geo, mat);
                        this.scene.add(this.slashMesh);
                    }
                    this.slashMesh.position.copy(this.player.mesh.position);
                    // Since player doesn't rotate mesh Y yet, we just spin it
                    this.slashMesh.rotation.y += Math.PI / 2;
                    this.slashEffectTimer = 0.2;
                }
            }
        }

        // Slash Visual cleanup
        if (this.slashEffectTimer > 0) {
            this.slashEffectTimer -= dt;
            if (this.slashEffectTimer <= 0 && this.slashMesh) {
                this.slashMesh.position.y = -100; // Hide
            } else if (this.slashMesh) {
                this.slashMesh.position.copy(this.player.mesh.position);
            }
        }

        // Update Systems
        this.timeSystem.update(dt);
        this.statsSystem.update(dt);
        this.environment.update(dt, this.timeSystem.isNight);
        this.waveManager.update(dt, this.player.mesh.position, this.enemies, this.difficulty, this.playerLevel);

        // Interaction
        // REMOVED INTERACTION SYSTEM LOGIC
        /*
        const interacted = this.interactionSystem.update(this.camera, this.player.mesh.position, this.input);
        if (interacted) {
            // Restore health at the tree
            this.statsSystem.health = Math.min(this.statsSystem.maxHealth, this.statsSystem.health + 10);
            this.floatingTexts.push(new FloatingText(this.scene, this.player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), "+10 HP", "#00ff00"));
        }
        */

        // Auto-Fire Logic
        this.fireTimer += dt;
        if (this.fireTimer >= this.fireRate) {
            // Find nearest enemy
            let nearestEnemy: Enemy | null = null;
            let minDist = this.projectileRange; // Range

            for (const enemy of this.enemies) {
                const dist = enemy.mesh.position.distanceTo(this.player.mesh.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                this.fireTimer = 0;

                const targetPos = nearestEnemy.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
                const spawnPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
                const baseDir = new THREE.Vector3().subVectors(targetPos, spawnPos).normalize();

                // Multishot Fan
                const count = this.projectileCount;
                const spreadAngle = 0.2; // Radians separation

                for (let i = 0; i < count; i++) {
                    // Calculate offset angle: centered around 0
                    // 1 proj: 0
                    // 2 proj: -0.5, 0.5
                    // 3 proj: -1, 0, 1
                    const offset = (i - (count - 1) / 2) * spreadAngle;

                    const dir = baseDir.clone();
                    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), offset);

                    this.snowballs.push(new Snowball(this.scene, spawnPos, dir));
                }

                this.soundManager.playShoot();
            }
        }

        // Projectiles Loop
        for (let i = this.snowballs.length - 1; i >= 0; i--) {
            const ball = this.snowballs[i];
            const alive = ball.update(dt);

            if (!alive) {
                ball.dispose(this.scene);
                this.snowballs.splice(i, 1);
                continue;
            }

            // Collision with Enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = ball.mesh.position.distanceTo(enemy.mesh.position);

                if (dist < 1.0) { // Hit!
                    enemy.health -= this.projectileDamage;
                    // Spawn Floating Text
                    this.spawnFloatingText(enemy.mesh.position, this.projectileDamage.toString(), "#ffffff");
                    this.soundManager.playHit();

                    // Despawn ball
                    ball.dispose(this.scene);
                    this.snowballs.splice(i, 1);

                    if (enemy.health <= 0) {
                        this.killEnemy(enemy);
                    }
                    break;
                }
            }
        }

        // XP Orb Loop
        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i];

            // Magnet Logic
            const dist = orb.mesh.position.distanceTo(this.player.mesh.position);
            if (dist < this.xpPickupRange) {
                // Fly towards player
                const dir = new THREE.Vector3().subVectors(this.player.mesh.position, orb.mesh.position).normalize();
                orb.mesh.position.addScaledVector(dir, 10 * dt); // High speed
            }

            orb.update(dt); // Bobbing animation

            if (dist < 1.0) { // Collect (Collision radius)
                this.playerXP += orb.value * this.xpMultiplier;
                if (this.playerXP >= this.xpToNextLevel) {
                    this.playerLevel++;
                    this.playerXP -= this.xpToNextLevel;
                    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
                    this.difficulty += 0.05; // +5% difficulty
                    console.log("Level Up! Difficulty:", this.difficulty.toFixed(2));

                    // Trigger Level Up
                    this.soundManager.playLevelUp();
                    this.isPaused = true;
                    // Reset inputs to prevent stuck keys
                    // this.input.keys.clear(); // If input class supports it

                    const choices = this.upgradeSystem.getRandomUpgrades(3, this);
                    this.upgradeUI.show(choices, (upgrade) => {
                        upgrade.apply(this);
                        this.collectedUpgrades.push(upgrade.name);
                        this.isPaused = false;
                        // Reset clock delta so we don't have a huge jump
                        this.clock.getDelta();
                    });
                }

                orb.dispose(this.scene);
                this.xpOrbs.splice(i, 1);
            }
        }

        // Floating Text Loop
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            const alive = text.update(dt);
            if (!alive) {
                text.dispose(this.scene);
                this.floatingTexts.splice(i, 1);
            }
        }

        // Present Logic
        for (let i = this.presents.length - 1; i >= 0; i--) {
            const present = this.presents[i];
            present.update(dt);

            // Check Collision
            if (present.mesh.position.distanceTo(this.player.mesh.position) < 2.0) {
                // Collect
                this.soundManager.playLevelUp(); // Use LevelUp sound for now
                this.spawnFloatingText(present.mesh.position, "BONUS UPGRADE!", "#ffd700");

                // Grant Upgrade
                const upgrades = this.upgradeSystem.getUpgrades(1, 100); // Reroll count high to ensure some randomness
                if (upgrades.length > 0) {
                    this.upgradeSystem.selectUpgrade(upgrades[0], this);
                    this.collectedUpgrades.push("BONUS: " + upgrades[0].name);
                }

                present.dispose(this.scene);
                this.presents.splice(i, 1);
            }
        }

        // Enemy Collision Damage
        // Debounce damage/visuals to avoid spamming text every frame? 
        // For simplicity, we just apply damage. Text might be too spamy if per frame.
        // Let's create a visual indicator only occasionally or just rely on health bar.

        let takingDamage = false;
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;
            const dist = this.player.mesh.position.distanceTo(enemy.mesh.position);
            if (dist < 1.5) { // Increased radius for easier hit
                if (!this.godMode) {
                    this.statsSystem.health -= enemy.damage * dt; // Scaled Damage
                    takingDamage = true;
                }
            }
        }

        // Red Flash Effect (Screen tint) if taking damage
        const damageLayer = document.getElementById('ui-layer');
        if (damageLayer) {
            if (takingDamage) {
                damageLayer.style.boxShadow = "inset 0 0 50px rgba(255,0,0,0.5)";
            } else {
                damageLayer.style.boxShadow = "none";
            }
        }

        // Check Death
        if (this.statsSystem.isDead && !this.isPaused) {
            this.isPaused = true;
            this.gameOverUI.show({
                killed: this.enemiesKilled,
                time: this.timeSystem.formattedTime,
                level: this.playerLevel,
                upgrades: this.collectedUpgrades
            });
            return;
        }

        // Update HUD (Custom text insert)
        // Update HUD
        this.hud.update(this.timeSystem.formattedTime, this.statsSystem.health, this.statsSystem.maxHealth, this.playerXP, this.xpToNextLevel, this.playerLevel, this.difficulty);

        // Update Boss HP Bar
        const activeBoss = this.enemies.find(e => e.isBoss && !e.isDead);
        if (activeBoss) {
            this.hud.updateBossHealth(activeBoss.health, activeBoss.maxHealth, "EVIL SNOWMAN");
        } else {
            this.hud.hideBossHealth();
        }

        // Remove old hack level display if exists
        const oldLevelDisplay = document.getElementById('level-display');
        if (oldLevelDisplay) oldLevelDisplay.remove();

        this.player.update(dt, this.input, this.camera, this.soundManager);

        // Callback for enemies to spawn projectiles
        const spawnProjectile = (pos: THREE.Vector3, dir: THREE.Vector3) => {
            if (this.enemyProjectiles.length < 50) { // Limit count
                this.enemyProjectiles.push(new EnemyProjectile(this.scene, pos, dir));
            }
        };

        this.enemies.forEach(enemy => enemy.update(dt, this.player.mesh.position, this.enemies, spawnProjectile));

        // Update Enemy Projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const proj = this.enemyProjectiles[i];
            const alive = proj.update(dt);
            if (!alive) {
                proj.dispose(this.scene);
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            // Hit Player?
            if (proj.mesh.position.distanceTo(this.player.mesh.position) < 0.8) {
                if (!this.godMode) {
                    this.statsSystem.health -= 20; // Big hit
                    this.soundManager.playHit(); // Re-use hit sound
                }
                proj.dispose(this.scene);
                this.enemyProjectiles.splice(i, 1);
            }
        }


        // Simple light animation
        // Fixed day lighting
        this.directionalLight.intensity = 1.0;
        this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, 0.2, dt);


        // TPS Camera Logic
        if (this.input.isLocked) {
            // Rotate player mesh (Yaw)
            this.player.mesh.rotation.y -= this.input.movementX * 0.002;
        }

        // Camera Follow
        const offset = new THREE.Vector3(0, 5, 8); // Height 5, Distance 8
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.mesh.rotation.y);

        const targetPos = this.player.mesh.position.clone().add(offset);
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(this.player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0))); // Look slightly above player

        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
        this.composer.render();
    } // This closes the update method.



    private killEnemy(enemy: Enemy) {
        if (enemy.isDead) return;

        this.enemiesKilled++;

        // Drop XP
        this.xpOrbs.push(new XPOrb(this.scene, enemy.mesh.position.clone()));

        // Enemy death
        enemy.isDead = true;
        this.scene.remove(enemy.mesh);

        // Remove from array
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    private loadAssets() {
        const loader = new GLTFLoader();
        loader.load('./models/Snowman.glb', (gltf: any) => {
            const model = gltf.scene;
            // Traverse to set shadows or material fixes if needed
            model.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.waveManager.setEnemyModel(model);
            console.log("Snowman model loaded!");
        }, undefined, (error: any) => {
            console.error('An error happened loading the model:', error);
        });

        loader.load('./models/Present.glb', (gltf: any) => {
            const model = gltf.scene;
            model.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.presentModel = model;
            console.log("Present model loaded!");
        }, undefined, (error: any) => {
            console.error('An error happened loading the Present model:', error);
        });
    }

    public spawnPresent(position: THREE.Vector3) {
        if (this.presentModel) {
            this.presents.push(new Present(this.scene, position, this.presentModel));
        }
    }

    private spawnFloatingText(position: THREE.Vector3, text: string, color: string) {
        this.floatingTexts.push(new FloatingText(this.scene, position.clone().add(new THREE.Vector3(0, 1.5, 0)), text, color));
    }
}
