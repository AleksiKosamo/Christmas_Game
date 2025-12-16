import * as THREE from 'three';

export class FloatingText {
    public mesh: THREE.Mesh;
    private lifeTime: number = 1.0;
    private velocity: THREE.Vector3;

    constructor(scene: THREE.Scene, position: THREE.Vector3, text: string, color: string = '#ffffff') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            context.font = 'Bold 40px Arial';
            context.fillStyle = color;
            context.fillText(text, 0, 40);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.position.copy(position);
        sprite.scale.set(2, 1, 1); // Adjust scale

        this.mesh = sprite as unknown as THREE.Mesh; // Hack to treat sprite as mesh for simple list management
        scene.add(this.mesh);

        this.velocity = new THREE.Vector3(0, 2, 0); // Float up
    }

    update(dt: number): boolean {
        this.lifeTime -= dt;
        this.mesh.position.addScaledVector(this.velocity, dt);
        (this.mesh.material as THREE.Material).opacity = this.lifeTime;

        return this.lifeTime > 0;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
