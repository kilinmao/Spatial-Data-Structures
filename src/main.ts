// external dependencies
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

// local from us provided global utilities
import * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import { Application, createWindow } from './lib/window';
import { KDTreeVisualizer } from "./visualizer";

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';
import { KDTree } from './kdTree';

var mesh = new THREE.Points(helper.createCube(), new THREE.PointsMaterial({
  color: 0x0000ff,
  size: 0.05,
}));

mesh.geometry.computeBoundingBox();

let k = 3;
let showKdTree = true;
let kdTree = new KDTree(mesh, 3)
console.log(mesh,'mesh');

let kdTreeVisualizer = new KDTreeVisualizer(kdTree, mesh.geometry.boundingBox!)
var scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
/*******************************************************************************
 * Defines Settings and GUI
 ******************************************************************************/

// enum(s)
enum Models {
  cube = "Cube",
  sphere = "Sphere",
  tree = "Tree",
  // bunny = "Bunny"
}

// (default) Settings.
class Settings extends utils.Callbackable{
  // different setting types are possible (e.g. string, enum, number, boolean, function)
  name: string = "Basic";
  model: Models = Models.cube;
  scale: number = 1;
  showKdTree: boolean = true;
  k: number = 3;
}

// create GUI given a Settings object
function createGUI(settings: Settings): dat.GUI {
  // we are using dat.GUI (https://github.com/dataarts/dat.gui)
  var gui: dat.GUI = new dat.GUI();

  // build GUI
  // the five types have different appearances

  // changed by Mao
  // The App name section in the interface should deﬁne the document title
  gui.add(settings, 'name').name('App name').onChange(function (e) {
    document.title = e;
  });
  gui.add(settings, 'model', utils.enumOptions(Models)).name('3D Model');
  // changed by Mao
  // Use the slider to adjust the objects scale.
  gui.add(settings, 'scale', 0, 10, 0.1).name('size').onChange(function (e) {
    mesh.scale.x = e;
    mesh.scale.y = e;
    mesh.scale.z = e;
  });

  // changed by Mao
  // Add a checkbox that allows to show/hide the kd-tree.
  gui.add(settings, 'showKdTree').name('show kd-tree').onChange(function (e) {
    if (e) {
      updateShowKdTree(scene, true)
      showKdTree = true;
    } else {
      updateShowKdTree(scene, false)
      showKdTree = false;
    }
  });

  // changed by Mao
  // Add a slider that allows to adjust the number of nearest neighbors.
  gui.add(settings, 'k', 1, 10, 1).name('k').onChange(function (e) {
    k = e;
    updateKNearestNeighbors();
  });



  return gui;
}




/*******************************************************************************
 * The main application. Your logic should later be separated into a different file.
 * A custom class(es) should be used later as well, since a global namespace is "ugly"
 ******************************************************************************/



// defines callback that should get called
function callback(changed: utils.KeyValuePair<Settings>) {

  // 只有模型改变时才加载新的3D模型
  if (changed.key == "model") {
    const modelName = changed.value;
    mesh.geometry.dispose();
    // 根据所选模型名称,获取对应的obj文件路径
    switch (modelName) {
      
      case Models.cube:
        kdTreeVisualizer.removeGrid(scene);
        mesh.geometry = helper.createCube();
    updateKNearestNeighbors();
    updateShowKdTree(scene,showKdTree)
        break;

      case Models.sphere:
        kdTreeVisualizer.removeGrid(scene);
        mesh.geometry = helper.createSphere();
    updateKNearestNeighbors();
    updateShowKdTree(scene,showKdTree)
        break;
      
      case Models.tree:
        kdTreeVisualizer.removeGrid(scene);
        mesh.geometry = helper.createTree();
            
    updateKNearestNeighbors();
    updateShowKdTree(scene,showKdTree)
        break;
      
      // case Models.bunny:
      //   mesh.geometry = helper.createBunny();
      //   break;
      
      default:
        break;

    }




  }
}

function updateKNearestNeighbors(pointClicked = [0, 0, 0]) {
      
  kdTree = new KDTree(mesh, 3)
  kdTreeVisualizer = new KDTreeVisualizer(kdTree, mesh.geometry.boundingBox!)
  kdTree.kNearestNeighbors(pointClicked, k, true);
}

function updateShowKdTree(scene:THREE.Scene, show:boolean){
  if (show) {
    kdTreeVisualizer.removeGrid(scene);
    mesh.geometry.computeBoundingBox();
    kdTree = new KDTree(mesh, 3)
    kdTreeVisualizer = new KDTreeVisualizer(kdTree, mesh.geometry.boundingBox!)
    kdTreeVisualizer.renderGrid(scene);
  } else {
    kdTreeVisualizer.removeGrid(scene);
  }
}



/*******************************************************************************
 * Main entrypoint. Previouly declared functions get managed/called here.
 * Start here with programming.
 ******************************************************************************/

function main(){
  // setup/layout root Application.
  // Its the body HTMLElement with some additional functions.
  var root = Application("Basic");
  // define the (complex) layout, that will be filled later:
  root.setLayout([
      ["renderer", "."],
      [".",        "."]
  ]);
  // 1fr means 1 fraction, so 2fr 1fr means
  // the first column has 2/3 width and the second 1/3 width of the application
  // changed by Mao
  root.setLayoutColumns(["1fr", "0fr"]);
  // you can use percentages as well, but (100/3)% is difficult to realize without fr.
  // changed by Mao
  root.setLayoutRows(["100%", "0%"]);

  // ---------------------------------------------------------------------------
  // create Settings
  var settings = new Settings();
  // create GUI using settings
  var gui = createGUI(settings);
  gui.open();
  // adds the callback that gets called on settings change
  settings.addCallback(callback);

  // ---------------------------------------------------------------------------
  // create window with given id
  // the root layout will ensure that the window is placed right
  var rendererDiv = createWindow("renderer");
  // add it to the root application
  root.appendChild(rendererDiv);

  // create renderer
  var renderer = new THREE.WebGLRenderer({
       antialias: true,  // to enable anti-alias and get smoother output
    alpha: true // Allow transparent background
  });



  
  // create scene
  
  // scene.add(new THREE.GridHelper(10, 10))
  // scene.add(new THREE.AxesHelper(5));
  // user ./helper.ts for building the scene
  helper.setupLight(scene);
  scene.add(mesh);
    // Set scene background to black
  scene.background = new THREE.Color(0x000000);



  // create camera
  var camera = new THREE.PerspectiveCamera();
  // user ./helper.ts for setting up the camera
  helper.setupCamera(camera, scene);



  updateKNearestNeighbors();
  updateShowKdTree(scene,showKdTree)  
  

  // create controls
  var controls = new OrbitControls(camera, rendererDiv);
  // user ./helper.ts for setting up the controls
  helper.setupControls(controls);

  rendererDiv.addEventListener("click", onClick, false);

  function onClick(event: MouseEvent) {
  // 将屏幕空间的鼠标坐标转换为归一化设备坐标
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 使用 raycaster 对鼠标点击事件进行处理
  raycaster.setFromCamera(mouse, camera);

  // 获取场景中与射线相交的对象
  const intersects = raycaster.intersectObjects([mesh]);

  // 如果找到了与射线相交的对象，则获取第一个对象的交点位置
  if (intersects.length > 0) {
    const pointClicked = intersects[0].point;

    // 更新 K 近邻，并传递选点的坐标
    updateKNearestNeighbors(pointClicked.toArray());
  }
}

  // fill the Window (renderDiv). In RenderWidget happens all the magic.
  // It handles resizes, adds the fps widget and most important defines the main animate loop.
  // You dont need to touch this, but if feel free to overwrite RenderWidget.animate
  var wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
  // start the draw loop (this call is async)
  wid.animate();
}

// call main entrypoint
main();


