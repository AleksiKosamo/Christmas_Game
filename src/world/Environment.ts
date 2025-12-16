import * as THREE from 'three';

export class Environment {
    private scene: THREE.Scene;
    private snowParticles: THREE.Points;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Fog
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02);

        // Snow
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * 100 - 50;
            const y = Math.random() * 50; // Height
            const z = Math.random() * 100 - 50;
            positions.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xdddddd, // Slightly dimmer
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.snowParticles);
    }

    update(dt: number, isNight: boolean) {
        // Update fog color based on time
        if (isNight) {
            (this.scene.fog as THREE.FogExp2).color.setHex(0x050510);
        } else {
            (this.scene.fog as THREE.FogExp2).color.setHex(0x88ccff);
        }

        // Animate snow
        const positions = this.snowParticles.geometry.attributes.position.array as Float32Array;

        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 2 * dt; // Fall down

            if (positions[i] < 0) {
                positions[i] = 50; // Reset to top
            }
        }

        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
}
