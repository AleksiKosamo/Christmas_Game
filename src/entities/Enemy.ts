import * as THREE from 'three';

export class Enemy {
    public mesh: THREE.Group;
    public health: number = 3;
    private speed: number = 2;
    public isDead: boolean = false;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        // Snowman body
        const bottomGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const midGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const topGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

        const bottom = new THREE.Mesh(bottomGeo, material);
        bottom.position.y = 0.6;

        const mid = new THREE.Mesh(midGeo, material);
        mid.position.y = 0.6 + 0.4 + 0.3; // Stacked

        const top = new THREE.Mesh(topGeo, material);
        top.position.y = 0.6 + 0.4 + 0.3 + 0.25 + 0.15;

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
        const arms = new THREE.Mesh(armGeo, armMat);
        arms.position.y = mid.position.y;
        arms.rotation.z = Math.PI / 2;

        this.mesh.add(bottom, mid, top, arms);
        scene.add(this.mesh);
    }

    update(dt: number, playerPosition: THREE.Vector3, otherEnemies: Enemy[] = []) {
        // Simple follow logic
        const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
        direction.y = 0; // Don't fly

        // Separation Force
        const separation = new THREE.Vector3();
        let separationCount = 0;

        for (const other of otherEnemies) {
            if (other === this || other.isDead) continue;

            const dist = this.mesh.position.distanceTo(other.mesh.position);
            if (dist < 1.0) { // Keep them 1 unit apart
                const push = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                push.normalize();
                push.divideScalar(dist); // Weight by distance (closer = stronger push)
                separation.add(push);
                separationCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.multiplyScalar(2.0); // Strength of separation
        }

        const distance = direction.length();
        if (distance > 1) { // Always chase if not touching
            direction.normalize();

            // Blend follow and separation
            direction.add(separation).normalize();

            this.mesh.position.addScaledVector(direction, this.speed * dt);

            // Look at player
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
        }
    }
}
