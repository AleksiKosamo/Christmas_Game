import * as THREE from 'three';

export class Town {
    public collidables: THREE.Object3D[] = [];
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        // Placeholders removed
    }

    public createThickForest(treeModels: THREE.Group[]) {
        if (treeModels.length === 0) {
            console.error("No tree models provided to createThickForest!");
            return;
        }

        console.log(`Creating forest around a 50x50 clear area...`);

        // 1. Core Arena Boundary (Start forest at 50x50 edge)
        const arenaSize = 50;
        const half = arenaSize / 2;
        const layers = 6;
        const spacing = 4;

        const addTree = (x: number, z: number) => {
            const model = treeModels[Math.floor(Math.random() * treeModels.length)];
            const tree = model.clone();

            // Force non-emissive to prevent wash-out/bloom
            tree.traverse((child: any) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });

            // Randomization for natural placement
            const rx = x + (Math.random() * 4 - 2);
            const rz = z + (Math.random() * 4 - 2);

            tree.position.set(rx, 0, rz);
            // Randomize scale for variety (Imposing wall)
            const s = 2.5 + Math.random() * 2.5;
            tree.scale.set(s, s, s);
            tree.rotation.y = Math.random() * Math.PI * 2;

            this.scene.add(tree);
            this.collidables.push(tree);
        };

        // Create the thick border starting exactly at the 50x50 clearing edge
        for (let l = 0; l < layers; l++) {
            const offset = l * 5;
            const currentHalf = half + offset;

            for (let i = -currentHalf; i <= currentHalf; i += spacing) {
                addTree(i, -currentHalf);
                addTree(i, currentHalf);
                addTree(-currentHalf, i);
                addTree(currentHalf, i);
            }
        }

        // 2. Dense Internal forest REMOVED to keep the 50x50 area clear
        console.log(`Forest created! 50x50 center is clear. Total trees: ${this.collidables.length}`);
    }

    public createDecorations(models: { [key: string]: THREE.Group }) {
        const arenaSize = 50;
        const half = arenaSize / 2;

        const addDecoration = (model: THREE.Group, x: number, z: number, scale: number = 2) => {
            const deco = model.clone();

            // Force non-emissive to prevent wash-out/bloom
            deco.traverse((child: any) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });

            deco.position.set(x, 0, z);
            deco.scale.set(scale, scale, scale);
            deco.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(deco);
            this.collidables.push(deco);
        };

        // Scatter some Snowmen at the edges
        if (models['Snowman']) {
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = half + 2 + Math.random() * 5;
                addDecoration(models['Snowman'], Math.cos(angle) * r, Math.sin(angle) * r, 1.5 + Math.random());
            }
        }

        // Add some Snowy Houses deeper in the trees (Removed Igloos)
        if (models['Snowy House']) {
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = half + 12 + Math.random() * 10;
                addDecoration(models['Snowy House'], Math.cos(angle) * r, Math.sin(angle) * r, 3);
            }
        }

        // --- Hard Boundary Walls (Invisible Barriers) ---
        // This ensures the player cannot walk into the forest layers
        const wallThickness = 2;
        const wallHeight = 20;
        const wallMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible

        const createWall = (x: number, z: number, w: number, d: number) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMaterial);
            wall.position.set(x, wallHeight / 2, z);
            this.scene.add(wall);
            this.collidables.push(wall);
        };

        // Walls placed at the 50x50 boundary
        createWall(0, half + wallThickness / 2, arenaSize + wallThickness * 2, wallThickness); // Top
        createWall(0, -(half + wallThickness / 2), arenaSize + wallThickness * 2, wallThickness); // Bottom
        createWall(half + wallThickness / 2, 0, wallThickness, arenaSize + wallThickness * 2); // Right
        createWall(-(half + wallThickness / 2), 0, wallThickness, arenaSize + wallThickness * 2); // Left

        console.log("Hard forest boundaries and decorations initialized.");
    }
}
