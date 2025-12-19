import * as THREE from 'three';

export class Environment {
    private scene: THREE.Scene;
    private snowParticles: THREE.Points;
    private particleCount: number = 5000;
    private waftOffsets: Float32Array;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Snowy Day Atmosphere
        this.scene.fog = new THREE.FogExp2(0xbdc9d6, 0.012);
        this.scene.background = new THREE.Color(0xbdc9d6);

        // Snow
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        this.waftOffsets = new Float32Array(this.particleCount);

        for (let i = 0; i < this.particleCount; i++) {
            const x = Math.random() * 400 - 200;
            const y = Math.random() * 100;
            const z = Math.random() * 400 - 200;
            positions.push(x, y, z);

            this.waftOffsets[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const textureLoader = new THREE.TextureLoader();
        const snowflakeTexture = textureLoader.load('./textures/snowflake.png');

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.6,
            map: snowflakeTexture,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.snowParticles);
    }

    update(dt: number) {
        // Bright snowy day atmosphere
        (this.scene.fog as THREE.FogExp2).color.setHex(0xbdc9d6);
        this.scene.background = new THREE.Color(0xbdc9d6);

        // Animate snow
        const positions = this.snowParticles.geometry.attributes.position.array as Float32Array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 3;

            // Fall down
            positions[idx + 1] -= 5 * dt;

            // Wafting
            positions[idx] += Math.sin(time + this.waftOffsets[i]) * 2 * dt;
            positions[idx + 2] += Math.cos(time + this.waftOffsets[i]) * 1 * dt;

            if (positions[idx + 1] < 0) {
                positions[idx + 1] = 100; // Reset to top
            }
        }

        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
}
