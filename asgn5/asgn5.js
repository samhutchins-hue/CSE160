import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return "#" + this.object[this.prop].getHexString();
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}

class FogGUIHelper {
  constructor(fog, background) {
    this.fog = fog;
    this.background = background;
  }
  get near() {
    return this.fog.near;
  }
  set near(v) {
    this.fog.near = v;
    this.fog.far = Math.max(this.fog.far, v);
  }
  get far() {
    return this.fog.far;
  }
  set far(v) {
    this.fog.far = v;
    this.fog.near = Math.min(this.fog.near, v);
  }
  get color() {
    return "#" + this.fog.color.getHexString();
  }
  set color(hexString) {
    this.fog.color.set(hexString);
    this.background.set(hexString);
  }
}

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 90;
  const aspect = 2;
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 3, 25);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 3, 0);
  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.Fog(0x05060a, 20, 70);

  const ALLEY_WIDTH = 10;
  const ALLEY_LENGTH = 60;
  const WALL_HEIGHT = 16;

  const loader = new THREE.TextureLoader();

  function loadTiled(path, repeatX, repeatY) {
    const texture = loader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(repeatX, repeatY);
    return texture;
  }

  const gltfLoader = new GLTFLoader();
  async function loadModel(path) {
    try {
      const gltf = await gltfLoader.loadAsync(path);

      const model = gltf.scene;
      scene.add(model);

      return model;
    } catch (error) {
      console.error("error occurred loading GLTF model:", error);
    }
  }

  function makeGround() {
    const groundTex = loadTiled(
      "cobblestone_bricks_mossy.png",
      ALLEY_WIDTH / 2,
      ALLEY_LENGTH / 2,
    );
    const geo = new THREE.PlaneGeometry(ALLEY_WIDTH, ALLEY_LENGTH);
    const mat = new THREE.MeshPhongMaterial({ map: groundTex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI * -0.5; // lay flat
    scene.add(mesh);
    return mesh;
  }

  function makeSideWall(x) {
    const geo = new THREE.BoxGeometry(1, WALL_HEIGHT, ALLEY_LENGTH);
    const mat = new THREE.MeshPhongMaterial({ color: 0x2b2b33 });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, WALL_HEIGHT / 2, 0);
    scene.add(wall);
    return wall;
  }

  function makeBackWall() {
    const geo = new THREE.BoxGeometry(ALLEY_WIDTH, WALL_HEIGHT, 1);
    const mat = new THREE.MeshPhongMaterial({ color: 0x23232a });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(0, WALL_HEIGHT / 2, -ALLEY_LENGTH / 2);
    scene.add(wall);
    return wall;
  }

  function setupGui(moon, ambient) {
    const gui = new GUI();

    const moonFolder = gui.addFolder("Moonlight");
    moonFolder
      .addColor(new ColorGUIHelper(moon, "color"), "value")
      .name("color");
    moonFolder.add(moon, "intensity", 0, 3, 0.01);
    moonFolder.add(moon.position, "x", -30, 30).name("pos x");
    moonFolder.add(moon.position, "y", 0, 40).name("pos y");
    moonFolder.add(moon.position, "z", -30, 30).name("pos z");
    moonFolder.open();

    const ambientFolder = gui.addFolder("Ambient");
    ambientFolder
      .addColor(new ColorGUIHelper(ambient, "color"), "value")
      .name("color");
    ambientFolder.add(ambient, "intensity", 0, 2, 0.01);

    const fogFolder = gui.addFolder("Fog");
    const fogHelper = new FogGUIHelper(scene.fog, scene.background);
    fogFolder.add(fogHelper, "near", 0.1, 100).listen();
    fogFolder.add(fogHelper, "far", 0.1, 100).listen();
    fogFolder.addColor(fogHelper, "color").name("color");
    fogFolder.open();
  }

  makeGround();
  makeSideWall(-ALLEY_WIDTH / 2);
  makeSideWall(ALLEY_WIDTH / 2);
  makeBackWall();

  const ambient = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0x8899ff, 0.6);
  moon.position.set(-5, 20, 10);
  scene.add(moon);

  setupGui(moon, ambient);

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
