import * as THREE from 'three';

export class Town {
    public treeTrunk: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        // Grand Christmas Tree (Placeholder: Green Cylinder + Cone)
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 2);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
        this.treeTrunk = new THREE.Mesh(trunkGeo, trunkMat);
        this.treeTrunk.position.set(0, 1, 0);
        scene.add(this.treeTrunk);

        const geometry = new THREE.ConeGeometry(3, 8, 8); // Assuming 'geometry' refers to the cone geometry
        const material = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            emissive: 0x004400,
            emissiveIntensity: 0.5
        });
        const cone = new THREE.Mesh(geometry, material);
        cone.position.y = 5; // Adjusted position to match original leaves height
        scene.add(cone); // Add cone directly to scene

        // Add lights to the tree
        const lightGeo = new THREE.SphereGeometry(0.2);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 2.0 // High intensity for bloom
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(1, 2, 1);
        cone.add(light); // Add light to the cone

        // More lights
        const light2 = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 }));
        light2.position.set(-1, 3, 0);
        cone.add(light2); // Add light to the cone

        // Houses (Placeholders: Cubes)
        const houseLocations = [
            { x: 10, z: 10 }, { x: -10, z: 10 },
            { x: 10, z: -10 }, { x: -10, z: -10 },
            { x: 15, z: 0 }, { x: -15, z: 0 }
        ];

        const houseGeo = new THREE.BoxGeometry(5, 5, 5);
        const houseMat = new THREE.MeshStandardMaterial({ color: 0x885522 });
        const roofGeo = new THREE.ConeGeometry(4, 2, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        houseLocations.forEach(loc => {
            const house = new THREE.Mesh(houseGeo, houseMat);
            house.position.set(loc.x, 2.5, loc.z);
            scene.add(house);

            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(loc.x, 5 + 1, loc.z);
            roof.rotation.y = Math.PI / 4;
            scene.add(roof);
        });
    }
}
