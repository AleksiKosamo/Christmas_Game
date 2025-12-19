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
import { LoadingUI } from '../ui/LoadingUI';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private composer: EffectComposer; // Post-processing
    // @ts-ignore
    private bloomPass: UnrealBloomPass;
    private input: Input;
    private town: Town;
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
    private loadingUI: LoadingUI;

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

    // Camera State
    private cameraYaw: number = 0;
    private cameraPitch: number = 0.5; // Start slightly tilted down
    private cameraDistance: number = 10;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();

    // Weapon State - NEW
    public hasOrnaments: boolean = false;
    public ornamentCount: number = 0;
    private ornamentMeshes: THREE.Mesh[] = [];
    private ornamentRotation: number = 0;

    public hasGiftBomb: boolean = false;
    public giftBombLevel: number = 0;
    public giftBombDamage: number = 10;
    public giftBombRadius: number = 5;
    public giftBombCooldown: number = 5.0;
    private currentGiftBombCooldown: number = 0;
    private activeGifts: any[] = []; // Simple projectiles

    public hasNaughtyList: boolean = false;

    // Loading State
    private loadedTrees: THREE.Group[] = [];
    private treesToLoad: string[] = ['tree1', 'tree2', 'tree3'];
    private loadedDecorations: { [key: string]: THREE.Group } = {};
    private decorationsToLoad: string[] = ['Snowy House', 'Snowman', 'ornament'];
    private ornamentModel: THREE.Group | null = null;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8; // Reduced exposure
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        document.getElementById('app')?.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();

        // Snowy Day Atmosphere (Slightly more overcast to prevent wash-out)
        this.scene.fog = new THREE.FogExp2(0xbdc9d6, 0.012);
        this.scene.background = new THREE.Color(0xbdc9d6);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Post-Processing Setup
        const renderScene = new RenderPass(this.scene, this.camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.15, 0.4, 0.85);
        bloomPass.threshold = 1.0; // Raise threshold significantly
        bloomPass.strength = 0.15; // Drastically lower strength
        bloomPass.radius = 0.4;
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
        this.loadingUI = new LoadingUI();

        // Dev Menu Initialization
        this.devMenu = new DevMenu({
            onAddXP: () => {
                this.playerXP += 1000;
                this.soundManager.playLevelUp();
            },
            onLevelUp: () => this.devTriggerLevelUp(),
            onHeal: () => {
                this.statsSystem.health = this.statsSystem.maxHealth;
            },
            onKillAll: () => this.devKillAllEnemies(),
            onSpawnBoss: () => {
                this.waveManager.spawnBoss(this.player.mesh.position, this.enemies, this.difficulty);
            },
            onSpawnPresent: () => this.devSpawnBonusPresent(),
            onToggleGodMode: () => {
                this.godMode = !this.godMode;
                console.log("God Mode:", this.godMode);
            },
            onChangeDifficulty: (delta: number) => this.devUpdateDifficulty(delta)
        });

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
        const ambientLight = new THREE.AmbientLight(0xb0c4de, 0.4); // Subdued ambient
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xfffaf0, 0.7); // Subdued directional
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);

        // Load Assets

        this.loadAssets();

        // Initial Floor / Grid (Centered on 100x100 play area)
        const floorGeo = new THREE.PlaneGeometry(400, 400); // Larger floor for forest depth
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xf0f8ff }); // AliceBlue snow
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const gridHelper = new THREE.GridHelper(400, 40, 0x444466, 0x222244); // Subdued festive grid
        this.scene.add(gridHelper);

        this.town = new Town(this.scene);
        this.player = new Player(this.scene);

        // Enemies managed by WaveManager now

        window.addEventListener('resize', () => this.onWindowResize());

        // Initial state is Paused and in Menu
        this.isPaused = true;
        this.inMenu = true;

        this.animate();

        // Add click to lock
        window.addEventListener('click', () => {
            if (!this.inMenu && !this.isPaused) {
                this.input.requestPointerLock();
            }
        });
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
            this.environment.update(dt);

            this.composer.render();
            return;
        }

        if (this.isPaused) return;

        const dt = this.clock.getDelta();
        // REMOVED: this.input.update(); It will be called at the end of the frame

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

                        enemy.takeDamage(this.iceAuraDamage);
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
                        enemy.takeDamage(this.slashDamage);
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
        this.environment.update(dt);
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
                    enemy.takeDamage(this.projectileDamage);
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
                    this.triggerLevelUp();
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

                // Pause game while showing bonus upgrade card
                this.isPaused = true;
                this.input.exitPointerLock();

                // Roll a single upgrade and show it as a card
                const upgrades = this.upgradeSystem.getRandomUpgrades(1, this);
                if (upgrades.length > 0) {
                    const chosen = upgrades[0];
                    this.upgradeUI.show([chosen], (upgrade) => {
                        upgrade.apply(this);
                        this.collectedUpgrades.push("BONUS: " + upgrade.name);
                        this.isPaused = false;
                        // Reset clock delta so we don't get a huge jump after pause
                        this.clock.getDelta();
                    }, "BONUS PRESENT!");
                } else {
                    // If for some reason no upgrade is available, just resume
                    this.isPaused = false;
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
            this.input.exitPointerLock();
            this.gameOverUI.show({
                killed: this.enemiesKilled,
                time: this.timeSystem.formattedTime,
                rawTime: this.timeSystem.totalTime,
                level: this.playerLevel,
                upgrades: this.collectedUpgrades
            });
            return;
        }

        // Update HUD (Custom text insert)
        // Update HUD
        this.hud.update(this.timeSystem.formattedTime, this.statsSystem.health, this.statsSystem.maxHealth, this.playerXP, this.xpToNextLevel, this.playerLevel, this.difficulty, this.statsSystem.healthRegen);

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

        this.enemies.forEach(enemy => {
            enemy.update(
                dt,
                this.player.mesh.position,
                this.enemies,
                spawnProjectile,
                (pos) => {
                    this.waveManager.spawnEnemy(this.player.mesh.position, this.enemies, this.difficulty, this.playerLevel, pos);
                },
                (amt) => {
                    if (!this.godMode) {
                        this.statsSystem.health -= amt;
                    }
                }
            );
        });

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


        // Free Look Camera Logic
        if (this.input.isLocked) {
            this.cameraYaw -= this.input.movementX * 0.003;
            this.cameraPitch += this.input.movementY * 0.003;

            // Clamp pitch to avoid flipping
            const minPitch = -Math.PI / 4; // Look up limit
            const maxPitch = Math.PI / 2.5; // Look down limit
            this.cameraPitch = Math.max(minPitch, Math.min(maxPitch, this.cameraPitch));
        }

        // Camera Positioning with Collision
        const idealOffset = new THREE.Vector3(
            this.cameraDistance * Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
            this.cameraDistance * Math.sin(this.cameraPitch),
            this.cameraDistance * Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
        );

        const playerPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        const rayDir = idealOffset.clone().normalize();
        this.raycaster.set(playerPos, rayDir);

        const collidables = [...this.town.collidables];
        const intersects = this.raycaster.intersectObjects(collidables);

        let finalDistance = this.cameraDistance;
        if (intersects.length > 0 && intersects[0].distance < this.cameraDistance) {
            finalDistance = Math.max(1.0, intersects[0].distance - 0.5);
        }

        // Quick ground check (y limit)
        const targetCamPos = playerPos.clone().add(rayDir.multiplyScalar(finalDistance));
        if (targetCamPos.y < 0.5) {
            // Adjust distance to keep camera above ground
            const factor = (playerPos.y - 0.5) / (playerPos.y - targetCamPos.y);
            finalDistance *= factor;
            targetCamPos.copy(playerPos).add(rayDir.normalize().multiplyScalar(finalDistance));
        }

        this.camera.position.lerp(targetCamPos, 0.4);
        this.camera.lookAt(playerPos);

        // --- NEW WEAPON LOGIC ---

        // Festive Ornaments (Orbital)
        if (this.hasOrnaments && this.ornamentModel) {
            this.ornamentRotation += 2 * dt;

            // Sync count
            while (this.ornamentMeshes.length < this.ornamentCount) {
                const mesh = this.ornamentModel.clone();
                // Random scale variation - BOOSTED STILL
                const s = 2.5 + Math.random() * 0.5;
                mesh.scale.set(s, s, s);
                this.scene.add(mesh);
                this.ornamentMeshes.push(mesh as any);
            }

            this.ornamentMeshes.forEach((mesh, i) => {
                const angle = this.ornamentRotation + (i / this.ornamentCount) * Math.PI * 2;
                const radius = 3;
                mesh.position.set(
                    this.player.mesh.position.x + Math.sin(angle) * radius,
                    this.player.mesh.position.y + 1,
                    this.player.mesh.position.z + Math.cos(angle) * radius
                );

                // Spin individual ornament
                mesh.rotation.y += dt;

                // Simple collision
                for (const enemy of this.enemies) {
                    if (!enemy.isDead && mesh.position.distanceTo(enemy.mesh.position) < 1.5) {
                        enemy.takeDamage(5 * dt * (this.hasNaughtyList ? 1.3 : 1));
                    }
                }
            });
        }

        // Gift Bomb
        if (this.hasGiftBomb) {
            this.currentGiftBombCooldown -= dt;
            if (this.currentGiftBombCooldown <= 0) {
                this.currentGiftBombCooldown = this.giftBombCooldown;
                // Launch gift
                const giftGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
                const giftMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const gift = new THREE.Mesh(giftGeo, giftMat);
                gift.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 2, 0));

                // Find nearest enemy to throw at
                let targetEnemy = null;
                let minDist = 20;
                for (const e of this.enemies) {
                    if (e.isDead) continue;
                    const d = this.player.mesh.position.distanceTo(e.mesh.position);
                    if (d < minDist) { minDist = d; targetEnemy = e; }
                }

                const dir = targetEnemy ?
                    new THREE.Vector3().subVectors(targetEnemy.mesh.position, gift.position).normalize() :
                    new THREE.Vector3(Math.random() - 0.5, 0.5, Math.random() - 0.5).normalize();

                this.scene.add(gift);
                this.activeGifts.push({ mesh: gift, dir, time: 2.0 });
            }

            for (let i = this.activeGifts.length - 1; i >= 0; i--) {
                const g = this.activeGifts[i];
                g.mesh.position.addScaledVector(g.dir, 15 * dt);
                g.time -= dt;

                let exploded = g.time <= 0;
                if (!exploded) {
                    for (const enemy of this.enemies) {
                        if (!enemy.isDead && g.mesh.position.distanceTo(enemy.mesh.position) < 1.5) {
                            exploded = true; break;
                        }
                    }
                }

                if (exploded) {
                    // Explosion visual (Flash)
                    const flashGeo = new THREE.SphereGeometry(this.giftBombRadius);
                    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
                    const flash = new THREE.Mesh(flashGeo, flashMat);
                    flash.position.copy(g.mesh.position);
                    this.scene.add(flash);
                    setTimeout(() => this.scene.remove(flash), 100);

                    // Area Damage
                    for (const enemy of this.enemies) {
                        if (!enemy.isDead && g.mesh.position.distanceTo(enemy.mesh.position) < this.giftBombRadius) {
                            enemy.takeDamage(this.giftBombDamage * (this.hasNaughtyList ? 1.3 : 1));
                        }
                    }

                    this.scene.remove(g.mesh);
                    this.activeGifts.splice(i, 1);
                }
            }
        }

        this.input.update();
        this.composer.render();
    }



    private killEnemy(enemy: Enemy) {
        if (enemy.isDead) return;

        this.enemiesKilled++;

        // Drop XP
        this.xpOrbs.push(new XPOrb(this.scene, enemy.mesh.position.clone()));

        // Drop Presents when a Boss is killed
        if (enemy.isBoss) {
            const basePos = enemy.mesh.position.clone();
            const offsets = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1.5, 0, 0),
                new THREE.Vector3(-1.5, 0, 0),
            ];
            offsets.forEach(offset => {
                this.spawnPresent(basePos.clone().add(offset));
            });
        }

        // Enemy death
        enemy.isDead = true;
        enemy.dispose(this.scene);

        // Remove from array
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    private loadAssets() {
        // Setup Loading Manager
        const manager = new THREE.LoadingManager();

        manager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal;
            this.loadingUI.update(progress, url);
        };

        manager.onLoad = () => {
            console.log('Loading complete!');
            setTimeout(() => {
                this.loadingUI.hide();
                this.mainMenuUI.show(() => {
                    this.inMenu = false;
                    this.isPaused = false;
                    this.clock.getDelta(); // Reset clock
                    this.soundManager.playStartGame();
                    this.input.requestPointerLock();
                });
            }, 500);
        };

        manager.onError = (url) => {
            console.log('There was an error loading ' + url);
        };

        const loader = new GLTFLoader(manager);
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

        loader.load('./models/Santa Claus.glb', (gltf: any) => {
            const model = gltf.scene;
            model.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.player.setModel(model, gltf.animations);
            console.log("Santa Claus model loaded!");
        }, undefined, (error: any) => {
            console.error('An error happened loading the Santa model:', error);
        });

        // Load Multiple Tree Models
        this.treesToLoad.forEach(treeName => {
            loader.load(`./models/${treeName}.glb`, (gltf: any) => {
                const model = gltf.scene;
                model.traverse((child: any) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Correct centering
                const wrapper = new THREE.Group();
                const box = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.x = -center.x;
                model.position.z = -center.z;
                model.position.y = -box.min.y;
                wrapper.add(model);

                this.loadedTrees.push(wrapper);
                console.log(`${treeName} loaded!`);

                if (this.loadedTrees.length === this.treesToLoad.length) {
                    this.town.createThickForest(this.loadedTrees);
                }
            });
        });

        // Load Decorations
        this.decorationsToLoad.forEach(decoName => {
            loader.load(`./models/${decoName}.glb`, (gltf: any) => {
                const model = gltf.scene;
                model.traverse((child: any) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Force non-emissive
                        if (child.material) {
                            child.material.emissive.set(0x000000);
                            child.material.emissiveIntensity = 0;
                        }
                    }
                });

                // Center models
                const wrapper = new THREE.Group();
                const box = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.x = -center.x;
                model.position.z = -center.z;
                model.position.y = -box.min.y;
                wrapper.add(model);

                this.loadedDecorations[decoName] = wrapper;

                // Special check for the weapon model
                if (decoName === 'ornament') {
                    this.ornamentModel = wrapper;
                }

                console.log(`${decoName} deco loaded!`);

                // Create decorations if all are loaded (excluding the weapon)
                const decoRequired = this.decorationsToLoad.filter(d => d !== 'ornament');
                const decoLoaded = Object.keys(this.loadedDecorations).filter(d => d !== 'ornament');

                if (decoLoaded.length === decoRequired.length) {
                    this.town.createDecorations(this.loadedDecorations);
                }
            });
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

    // --- Dev Tools ---

    public devKillAllEnemies() {
        // Use a copy to avoid splice issues while iterating
        const activeEnemies = [...this.enemies];
        activeEnemies.forEach(e => this.killEnemy(e));
        console.log("DEV: All enemies killed.");
    }

    public devTriggerLevelUp() {
        this.triggerLevelUp();
        console.log("DEV: Level up triggered.");
    }

    public devSpawnBonusPresent() {
        this.spawnPresent(this.player.mesh.position.clone());
        console.log("DEV: Bonus present spawned.");
    }

    public devUpdateDifficulty(delta: number) {
        this.difficulty = Math.max(0.5, this.difficulty + delta);
        console.log("DEV: Difficulty set to:", this.difficulty.toFixed(2));
    }

    private triggerLevelUp() {
        this.playerLevel++;
        this.playerXP = Math.max(0, this.playerXP - this.xpToNextLevel);
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
        this.difficulty += 0.05; // +5% difficulty
        console.log("Level Up! Difficulty:", this.difficulty.toFixed(2));

        // Trigger Level Up
        this.soundManager.playLevelUp();
        this.isPaused = true;
        this.input.exitPointerLock();

        const choices = this.upgradeSystem.getRandomUpgrades(3, this);
        this.upgradeUI.show(choices, (upgrade) => {
            upgrade.apply(this);
            this.collectedUpgrades.push(upgrade.name);
            this.isPaused = false;
            // Reset clock delta so we don't have a huge jump
            this.clock.getDelta();
        });
    }
}
