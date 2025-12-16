import * as THREE from 'three';

export class XPOrb {
    public mesh: THREE.Mesh;
    public value: number;

    constructor(scene: THREE.Scene, position: THREE.Vector3, value: number = 10) {
        this.value = value;

        const geometry = new THREE.DodecahedronGeometry(0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan orbs
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Float

        scene.add(this.mesh);
    }

    update(dt: number) {
        this.mesh.rotation.y += dt;
        this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
