import * as THREE from 'three';
import { Input } from '../core/Input';

export class InteractionSystem {
    private raycaster: THREE.Raycaster;
    private interactables: THREE.Object3D[] = [];
    private interactionDistance: number = 3;
    public hoverObject: THREE.Object3D | null = null;

    constructor() {
        this.raycaster = new THREE.Raycaster();
    }

    public register(object: THREE.Object3D) {
        this.interactables.push(object);
    }

    public update(camera: THREE.Camera, playerPos: THREE.Vector3, input: Input): boolean {
        // Raycast from center of screen
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const intersects = this.raycaster.intersectObjects(this.interactables);

        if (intersects.length > 0) {
            const hit = intersects[0];
            // Check distance from player to the hit point
            if (playerPos.distanceTo(hit.point) < this.interactionDistance) {
                this.hoverObject = hit.object;

                if (input.isDown('KeyE')) {
                    return true; // Interaction triggered
                }
                return false;
            }
        }

        this.hoverObject = null;
        return false;
    }
}
