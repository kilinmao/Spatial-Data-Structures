import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as dat from 'dat.gui';

// local from us provided utilities
import * as utils from './lib/utils';
import cubeObj from './assets/obj_files/cube.obj'
import sphereObj from './assets/obj_files/sphere.obj'
import torusObj from './assets/obj_files/torus.obj'
import treeObj from './assets/obj_files/tree.obj'
import bunnyObj from './assets/obj_files/bunny.obj'


/*******************************************************************************
 * helper functions to build scene (geometry, light), camera and controls.
 ******************************************************************************/





export function createPlane(normal: THREE.Vector3, distance: number, minBounds: THREE.Vector3, maxBounds: THREE.Vector3, color: number): THREE.Mesh {
    const planeGeometry = new THREE.PlaneGeometry((maxBounds.x - minBounds.x) * 2, (maxBounds.y - minBounds.y) * 2);

    // 设置平面的法向量和常数
    const plane = new THREE.Plane(normal, distance);
    // 将平面围绕世界原点对齐
    const alignedPosition = new THREE.Vector3().addVectors(minBounds, maxBounds).multiplyScalar(0.5);
    const localPos = alignedPosition.clone().sub(plane.projectPoint(alignedPosition, new THREE.Vector3()));
    localPos.z = 0;
    planeGeometry.translate(localPos.x, localPos.y, localPos.z);

    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(planeGeometry, material);
    // 设置 mesh 的位置以使其与 node.point 对齐
    mesh.position.copy(alignedPosition);
    // 设置 mesh 的旋转以使其与平面对齐
  mesh.lookAt(new THREE.Vector3().addVectors(alignedPosition, normal));
  mesh.userData.type = 'kdTreeGrid';

    return mesh;
}

// enum(s)
export enum Geometries { cube = 'Cube', sphere = "Sphere", knot = "Knot", bunny = "Bunny" }

export class Settings extends utils.Callbackable {
  geometry: Geometries = Geometries.sphere

}

export function createGUI(params: Settings): dat.GUI {
  var gui: dat.GUI = new dat.GUI();

  gui.add(params, 'geometry', utils.enumOptions(Geometries)).name('Geometry')
  return gui;
}

function createGeometryFromObj(objString: string) {
  const loader = new OBJLoader();
  let geometry = new THREE.BufferGeometry();
  const mesh = loader.parse(objString).children[0];
  if (mesh instanceof THREE.Mesh) {
    geometry = mesh.geometry as THREE.BufferGeometry;
  }
  geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
  return geometry;
}

export function createCube() {
  return createGeometryFromObj(cubeObj);
}

export function createSphere() {
  return createGeometryFromObj(sphereObj);
}

export function createTorus() {
  return createGeometryFromObj(torusObj);
}

export function createBunny() {
  return createGeometryFromObj(bunnyObj);
}

export function createTree() {
  return createGeometryFromObj(treeObj);
}



// define camera that looks into scene
export function setupCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
  // https://threejs.org/docs/#api/cameras/PerspectiveCamera
  camera.near = 0.01;
  camera.far = 1000;
  camera.fov = 70;
  camera.position.z = 5;
  camera.lookAt(scene.position);
  camera.updateProjectionMatrix()
  return camera
}

// define controls (mouse interaction with the renderer)
export function setupControls(controls: OrbitControls) {
  // https://threejs.org/docs/#examples/en/controls/OrbitControls
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.enableZoom = true;
  controls.keys = { LEFT: '65', UP: '87', RIGHT: '68', BOTTOM: '83' };
  controls.minDistance = 0.1;
  controls.maxDistance = 9;
  return controls;
};



export function setupLight(scene: THREE.Scene){
  // add two point lights and a basic ambient light
  // https://threejs.org/docs/#api/lights/PointLight
  var light = new THREE.PointLight(0xffffcc, 1, 100);
  light.position.set( 10, 30, 15 );
  scene.add(light);

  var light2 = new THREE.PointLight(0xffffcc, 1, 100);
  light2.position.set( 10, -30, -15 );
  scene.add(light2);

  //https://threejs.org/docs/#api/en/lights/AmbientLight
  scene.add(new THREE.AmbientLight(0x999999));
  return scene;
};

