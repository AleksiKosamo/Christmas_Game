import * as THREE from 'three';

export class Snowball {
    public mesh: THREE.Mesh;
    private velocity: THREE.Vector3;
    private lifeTime: number = 2.0;

    constructor(scene: THREE.Scene, position: THREE.Vector3, direction: THREE.Vector3) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);

        scene.add(this.mesh);

        this.velocity = direction.clone().multiplyScalar(20); // Speed
    }

    update(dt: number): boolean {
        this.lifeTime -= dt;
        this.mesh.position.addScaledVector(this.velocity, dt);

        // Simple gravity
        this.velocity.y -= 9.8 * dt;

        if (this.mesh.position.y < 0) {
            this.lifeTime = 0; // Hit ground
        }

        return this.lifeTime > 0;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
