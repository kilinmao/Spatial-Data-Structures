
import * as THREE from 'three';
import { KDTree, Node } from './kdTree';
import { createPlane } from './helper';

export class KDTreeVisualizer {
    private kdTree: KDTree;
    private gridObjects: THREE.Mesh[] = [];
    private boundingBox: THREE.Box3 = new THREE.Box3();

    constructor(kdTree: KDTree, boundingBox: THREE.Box3) {
        this.kdTree = kdTree;
        this.boundingBox = boundingBox;
        console.log(boundingBox,'boundingBox');
        
    }

    renderGrid(scene: THREE.Scene): void {
        const boundsStack = [
            {
                node: this.kdTree.getNodes()[0],
                minBounds: this.boundingBox.min.clone(),
                maxBounds: this.boundingBox.max.clone(),
                depth: 0,
            },
        ];

const colors = [0xe57373, 0x81c784, 0x64b5f6];

while (boundsStack.length > 0) {
    const { node, minBounds, maxBounds, depth } = boundsStack.pop()!;

    if (!node) continue;

    const axis = depth % 3;
    const color = colors[axis];
    const normal = new THREE.Vector3();
    normal.setComponent(axis, 1);

    const distance = node.point[axis];
    const plane = createPlane(normal, distance, minBounds, maxBounds, color);
    this.gridObjects.push(plane);
    scene.add(plane);

    if (node.left) {
        const leftMaxBounds = maxBounds.clone();
        leftMaxBounds.setComponent(axis, node.point[axis]);
        boundsStack.push({ node: node.left, minBounds, maxBounds: leftMaxBounds, depth: depth + 1 });
    }

    if (node.right) {
        const rightMinBounds = minBounds.clone();
        rightMinBounds.setComponent(axis, node.point[axis]);
        boundsStack.push({ node: node.right, minBounds: rightMinBounds, maxBounds, depth: depth + 1 });
    }
}


    }

    removeGrid(scene: THREE.Scene): void {
    for (const object of this.gridObjects) {
        scene.remove(object);
    }
    this.gridObjects = [];
}




}
