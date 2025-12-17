import * as THREE from 'three';

export class EnemyProjectile {
    public mesh: THREE.Mesh;
    private velocity: THREE.Vector3;
    private lifeTime: number = 3.0;

    constructor(scene: THREE.Scene, position: THREE.Vector3, direction: THREE.Vector3) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8); // Slightly bigger than player snowball
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);

        scene.add(this.mesh);

        this.velocity = direction.clone().multiplyScalar(10); // Slower than player shot so dodgeable
    }

    update(dt: number): boolean {
        this.lifeTime -= dt;
        this.mesh.position.addScaledVector(this.velocity, dt);

        if (this.mesh.position.y < 0) {
            this.lifeTime = 0;
        }

        return this.lifeTime > 0;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
