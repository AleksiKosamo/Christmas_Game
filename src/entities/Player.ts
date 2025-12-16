import * as THREE from 'three';
import { Input } from '../core/Input';
import { SoundManager } from '../systems/SoundManager'; // Import SoundManager

export class Player {
    public mesh: THREE.Mesh;
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
        // Placeholder: Capsule-like shape (cylinder for now) or Box
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 1; // Stand on ground
        scene.add(this.mesh);
    }

    public update(dt: number, input: Input, camera: THREE.Camera, soundManager?: SoundManager) {
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
        }
    }
}
