import * as THREE from 'three';
import { Input } from '../core/Input';
import { SoundManager } from '../systems/SoundManager'; // Import SoundManager

export class Player {
    public mesh: THREE.Group; // Changed to Group to act as a container
    private model: THREE.Object3D | null = null;
    private placeholder: THREE.Mesh | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    private actions: { [key: string]: THREE.AnimationAction } = {};
    private currentAction: THREE.AnimationAction | null = null;
    public speed: number = 5;

    // Dash Params
    private dashSpeedMultiplier: number = 4.0;
    private dashDuration: number = 0.2;
    private dashCooldown: number = 1.0;

    // Dash State
    public isDashing: boolean = false;
    private currentDashTime: number = 0;
    private currentCooldown: number = 0;
    private dashDirection: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene) {
        this.mesh = new THREE.Group();
        this.mesh.position.y = 1; // Stand on ground

        // Placeholder: Capsule-like shape (cylinder for now) or Box
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.placeholder = new THREE.Mesh(geometry, material);
        this.mesh.add(this.placeholder);

        scene.add(this.mesh);
    }

    public setModel(model: THREE.Group, animations?: THREE.AnimationClip[]) {
        if (this.placeholder) {
            this.mesh.remove(this.placeholder);
            this.placeholder = null;
        }

        if (this.model) {
            this.mesh.remove(this.model);
        }

        this.model = model;
        // Adjust model orientation/scale if needed
        this.model.scale.set(1, 1, 1);
        this.model.rotation.y = 0; // Fixed backward walking in previous step, now alignment depends on model
        this.model.position.y = -1; // Align feet with ground (if group center is at waist/middle)

        this.mesh.add(this.model);

        // Setup Animations
        if (animations && animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);

            animations.forEach(clip => {
                const action = this.mixer!.clipAction(clip);

                // Map animations more robustly (handle prefixes like "Armature|")
                if (clip.name.toLowerCase().includes('idle')) {
                    this.actions['Idle'] = action;
                } else if (clip.name.toLowerCase().includes('walk')) {
                    this.actions['Walk'] = action;
                } else {
                    this.actions[clip.name] = action;
                }
            });

            // Start with Idle
            if (this.actions['Idle']) {
                this.fadeToAction('Idle', 0.1);
            }
        }
    }

    private fadeToAction(name: string, duration: number) {
        const nextAction = this.actions[name];
        if (!nextAction || nextAction === this.currentAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(duration);
        }

        nextAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();

        this.currentAction = nextAction;
    }

    public update(dt: number, input: Input, camera: THREE.Camera, soundManager?: SoundManager) {
        // Update Animation Mixer
        if (this.mixer) {
            this.mixer.update(dt);
        }

        // Cooldown tick
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt;
        }

        // Handle Dashing Movement
        if (this.isDashing) {
            this.mesh.position.addScaledVector(this.dashDirection, this.speed * this.dashSpeedMultiplier * dt);
            this.currentDashTime -= dt;

            if (this.currentDashTime <= 0) {
                this.isDashing = false;
            }
            return; // Skip normal movement while dashing
        }

        const moveDir = new THREE.Vector3();

        // Basic WASD Movement relative to camera
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        if (input.isDown('KeyW')) moveDir.add(forward);
        if (input.isDown('KeyS')) moveDir.sub(forward);
        if (input.isDown('KeyD')) moveDir.add(right);
        if (input.isDown('KeyA')) moveDir.sub(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();

            // Handle Animation Switching
            if (this.actions['Walk']) {
                this.fadeToAction('Walk', 0.2);
            }

            // Rotate model to face moveDir
            if (this.model) {
                // The moveDir is in world space. We need to find the angle.
                const targetAngle = Math.atan2(moveDir.x, moveDir.z);
                // Adjust for the parent group rotation (this.mesh)
                const relativeAngle = targetAngle - this.mesh.rotation.y;

                // Smoothly interpolate rotation
                // We use a helper for shortest path rotation
                let currentY = this.model.rotation.y;
                let targetY = relativeAngle; // Removed + Math.PI to fix backward walking

                // Normalize angles to -PI to PI
                const diff = ((targetY - currentY + Math.PI) % (Math.PI * 2)) - Math.PI;
                this.model.rotation.y += diff * 10 * dt;
            }

            // Check Dash Trigger
            if (input.isDown('Space') && this.currentCooldown <= 0) {
                this.isDashing = true;
                this.currentDashTime = this.dashDuration;
                this.currentCooldown = this.dashCooldown;
                this.dashDirection.copy(moveDir);

                // Play Sound
                if (soundManager) {
                    soundManager.playDash(); // Need to implement this in SoundManager
                }
            } else {
                // Normal Move
                this.mesh.position.addScaledVector(moveDir, this.speed * dt);
            }
        } else {
            // Idle Animation
            if (this.actions['Idle']) {
                this.fadeToAction('Idle', 0.2);
            }
        }
    }
}
