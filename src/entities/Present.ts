import * as THREE from 'three';

export class Present {
    public mesh: THREE.Group;
    public isCollected: boolean = false;

    constructor(scene: THREE.Scene, position: THREE.Vector3, modelTemplate: THREE.Group) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        const model = modelTemplate.clone();
        // Adjust scale/offset
        model.scale.set(1.5, 1.5, 1.5);
        this.mesh.add(model);

        // Add a simple bobbing animation or light
        const light = new THREE.PointLight(0xffd700, 1, 5);
        light.position.y = 1;
        this.mesh.add(light);

        scene.add(this.mesh);
    }

    update(dt: number) {
        // Rotate
        this.mesh.rotation.y += dt;
        // Bob is handled by position y if needed, but rotation is enough visual cue
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
    }
}
