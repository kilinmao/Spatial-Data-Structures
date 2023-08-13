import * as THREE from 'three';
import pointsVertexShader from './shaders/points.v.glsl';
import pointsFragmentShader from './shaders/points.f.glsl';
import pointsTexture from './assets/texture/disc.png';

export class Node {
  point: number[];
  left: Node | null;
  right: Node | null;

  constructor(point: number[]) {
    this.point = point;
    this.left = null;
    this.right = null;
  }
}

export class KDTree {
  private root: Node | null;
    private k: number;
    private points: number[][];
      private model: THREE.Points;
  private highlightMaterial: THREE.Material;
  private originalMaterials: THREE.Material[];

  constructor(model: THREE.Points, dimensions: number = 3) {
    this.root = null;
    this.k = dimensions;

      // 构建KD树
    this.points = this.extractPointsFromModel(model);
      this.root = this.build(this.points, 0);
         this.model = model;
    this.highlightMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
    this.originalMaterials = this.model.material as THREE.Material[];
  }
    
  private extractPointsFromModel(model: THREE.Points): number[][] {
  const positions = model.geometry.attributes.position.array;
  const points: number[][] = [];
  for (let i = 0; i < positions.length; i += 3) {
    points.push([positions[i], positions[i + 1], positions[i + 2]]);
  }
  
  return points;

  }
    
    

  private build(points: number[][], depth: number): Node | null {
    if (points.length === 0) return null;

    const axis = depth % this.k;
    points.sort((a, b) => a[axis] - b[axis]);

    const median = Math.floor(points.length / 2);
    const node = new Node(points[median]);

    node.left = this.build(points.slice(0, median), depth + 1);
    node.right = this.build(points.slice(median + 1), depth + 1);

    return node;
  }

  public insert(point: number[], node: Node | null = this.root, depth: number = 0): void {
    if (!this.root) {
      this.root = new Node(point);
    } else if (!node) {
      return;
    } else {
      const axis = depth % this.k;
      const direction = point[axis] < node.point[axis] ? "left" : "right";
      if (!node[direction]) {
        node[direction] = new Node(point);
      } else {
        this.insert(point, node[direction], depth + 1);
      }
    }
  }

public kNearestNeighbors(queryPoint: number[], k: number = 1, highlight: boolean = true): number[][] {
  if (!this.root){
    return [];
  }

  const bestMatches: [number[], number][] = [];
  this._kNearestNeighbors(this.root, queryPoint, 0, k, bestMatches);

  // Sort the best matches one more time and slice to get only k nearest points
  bestMatches.sort((a, b) => a[1] - b[1]);
  const kNearestPoints = bestMatches.slice(0, k).map(match => match[0]);

  if (highlight) {
    this.highlightPoints(kNearestPoints);
  }

  console.log(kNearestPoints,'kNearestPoints');
  return kNearestPoints;
}


private _kNearestNeighbors(
  node: Node | null,
  queryPoint: number[],
  depth: number,
  k: number,
  bestMatches: [number[], number][],
  limitSearchedSpace: boolean = false
): void {
  if (!node) {
    return;
  }

  // Add this to include the root node in bestMatches
  if (depth === 0 && this.root) {
    const rootDistance = this.calculateDistance(queryPoint, this.root.point);
    bestMatches.push([this.root.point, rootDistance]);
    bestMatches.sort((a, b) => a[1] - b[1]);
  }

  const axis = depth % this.k;
  const nextBranch = queryPoint[axis] < node.point[axis] ? 'left' : 'right';
  const oppositeBranch = nextBranch === 'left' ? 'right' : 'left';

  this._kNearestNeighbors(node[nextBranch], queryPoint, depth + 1, k, bestMatches, limitSearchedSpace);

  const distance = this.calculateDistance(queryPoint, node.point);

  const pointAlreadyExistsInBestMatches = bestMatches.some(([point, _]) => this.pointEquals(point, node.point));

  if (!pointAlreadyExistsInBestMatches) {
    if (bestMatches.length < k) {
      bestMatches.push([node.point, distance]);
      bestMatches.sort((a, b) => a[1] - b[1]);
    } else if (distance < bestMatches[bestMatches.length - 1][1]) {
      bestMatches.push([node.point, distance]);
      bestMatches.sort((a, b) => a[1] - b[1]);
      bestMatches = bestMatches.slice(0, k);
    }
  }

  if (
    Math.abs(node.point[axis] - queryPoint[axis]) < bestMatches[bestMatches.length - 1][1] ||
    !limitSearchedSpace
  ) {
    this._kNearestNeighbors(node[oppositeBranch], queryPoint, depth + 1, k, bestMatches, limitSearchedSpace);
  }
}

    private pointEquals(pointA: number[], pointB: number[]): boolean {
  return pointA.length === pointB.length && pointA.every((value, index) => value === pointB[index]);
}


public highlightPoints(points: number[][]): void {
    this.clearHighlight();
    this.updatePoints(points);
}

public clearHighlight(): void {
    this.updatePoints([]);
}

private updatePoints(points: number[][]): void {
    const geometry = this.model.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const color = new THREE.Color();
    const colors: number[] = [];
    const sizes: number[] = [];

    for (let i = 0, l = positionAttribute.count; i < l; i++) {
        if (points.some(point => point.every((value, index) => value === positionAttribute.array[i * 3 + index]))) {
            color.setRGB(1, 1, 0.5);
            sizes[i] = 0.2;
        } else {
            color.setRGB(1, 1, 1);
            sizes[i] = points.length > 0 ? 0.1 : 0.3;
        }
        color.toArray(colors, i * 3)
    }

    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    this.updateMaterial();
}

private updateMaterial(): void {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load(pointsTexture) },
            alphaTest: { value: 0.9 }
        },
        vertexShader: pointsVertexShader,
        fragmentShader: pointsFragmentShader,
    });

    this.model.material = material;
}


  public flatPoints(points: number[][]): number[] {
    return points.flat();
  }

  public findPointIndexInModel(point: number[]): number {
    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].every((value, index) => value === point[index])) {
        return i;
      }
    }
    return -1;
  }

  private calculateDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((acc, _, i) => acc + Math.pow(b[i] - a[i], 2), 0));
  }
    
    public getNodes(): Node[] {
    const nodes: Node[] = [];
    const traverse = (node: Node | null) => {
        if (!node) return;
        nodes.push(node);
        traverse(node.left);
        traverse(node.right);
    };
    traverse(this.root);
    return nodes;
    }
}
