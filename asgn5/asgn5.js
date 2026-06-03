import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

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
    if (this.background && this.background.isColor) {
      this.background.set(hexString);
    }
  }
}

const COLORS = {
  nightSky: 0x05060a,
  sideWall: 0x2b2b33,
  backWall: 0x23232a,
  lampPole: 0x111114,
  lampBulb: 0xffd9a0,
  lampGlow: 0xffaa55,
  ambient: 0x404060,
  moonlight: 0x8899ff,
};

const LAMP = {
  poleRadius: 0.12,
  poleHeight: 5,
  bulbRadius: 0.35,
  bulbWidthSegments: 16,
  bulbHeightSegments: 12,
  lightIntensity: 30,
  lightDistance: 25,
  lightDecay: 2,
};

const LAMP_FLICKER = {
  baseLevel: 0.88,
  waveAmount: 0.12,
  waveSpeed: 11,
  noiseAmount: 0.04,
};

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 90;
  const aspect = 2;
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const EYE_HEIGHT = 3; // camera height, roughly a person's eye level
  const CAMERA_START_Z = 25; // start near the open end, looking down the alley
  camera.position.set(0, EYE_HEIGHT, CAMERA_START_Z);

  // const controls = new OrbitControls(camera, canvas);
  // controls.target.set(0, 3, 0);
  // controls.update();

  const controls = new PointerLockControls(camera, canvas);
  canvas.addEventListener("click", () => controls.lock());

  const keys = { forward: false, back: false, left: false, right: false };
  const MOVE_SPEED = 20;

  document.addEventListener("keydown", (e) => setKey(e.code, true));
  document.addEventListener("keyup", (e) => setKey(e.code, false));
  function setKey(code, isDown) {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        keys.forward = isDown;
        break;
      case "KeyS":
      case "ArrowDown":
        keys.back = isDown;
        break;
      case "KeyA":
      case "ArrowLeft":
        keys.left = isDown;
        break;
      case "KeyD":
      case "ArrowRight":
        keys.right = isDown;
        break;
    }
  }

  const scene = new THREE.Scene();
  const FOG_NEAR = 20;
  const FOG_FAR = 70;
  scene.fog = new THREE.Fog(COLORS.nightSky, FOG_NEAR, FOG_FAR);

  scene.background = new THREE.CubeTextureLoader()
    .setPath("skybox/")
    .load(["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]);

  const clock = new THREE.Clock();

  const ALLEY_WIDTH = 10;
  const ALLEY_LENGTH = 60;
  const WALL_HEIGHT = 16;
  const WALL_THICKNESS = 1;

  const lampLights = [];

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
  async function loadModel(path, { x = 0, y = 0, z = 0 } = {}) {
    try {
      const gltf = await gltfLoader.loadAsync(path);
      const model = gltf.scene;
      model.position.set(x, y, z);
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
    const geo = new THREE.BoxGeometry(
      WALL_THICKNESS,
      WALL_HEIGHT,
      ALLEY_LENGTH,
    );
    const mat = new THREE.MeshPhongMaterial({ color: COLORS.sideWall });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, WALL_HEIGHT / 2, 0);
    scene.add(wall);
    return wall;
  }

  function makeBackWall() {
    const geo = new THREE.BoxGeometry(ALLEY_WIDTH, WALL_HEIGHT, WALL_THICKNESS);
    const mat = new THREE.MeshPhongMaterial({ color: COLORS.backWall });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(0, WALL_HEIGHT / 2, -ALLEY_LENGTH / 2);
    scene.add(wall);
    return wall;
  }

  function makeStreetLamp(x, z) {
    const lamp = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(
      LAMP.poleRadius,
      LAMP.poleRadius,
      LAMP.poleHeight,
    );
    const poleMat = new THREE.MeshPhongMaterial({ color: COLORS.lampPole });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = LAMP.poleHeight / 2; // base sits on the ground
    lamp.add(pole);

    const bulbGeo = new THREE.SphereGeometry(
      LAMP.bulbRadius,
      LAMP.bulbWidthSegments,
      LAMP.bulbHeightSegments,
    );
    const bulbMat = new THREE.MeshPhongMaterial({
      color: COLORS.lampBulb,
      emissive: COLORS.lampGlow,
      emissiveIntensity: 1,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.y = LAMP.poleHeight;
    lamp.add(bulb);

    const light = new THREE.PointLight(
      COLORS.lampGlow,
      LAMP.lightIntensity,
      LAMP.lightDistance,
      LAMP.lightDecay,
    );
    light.position.y = LAMP.poleHeight;
    light.userData.baseIntensity = LAMP.lightIntensity;
    light.userData.phase = Math.random() * Math.PI * 2; // desync the flicker
    lampLights.push(light);
    lamp.add(light);

    lamp.position.set(x, 0, z);
    scene.add(lamp);
    return lamp;
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

  const LAMP_WALL_GAP = 0.6;
  const LAMP_END_MARGIN = 6;
  const lampInset = ALLEY_WIDTH / 2 - LAMP_WALL_GAP;
  const lampsPerSide = 4;
  const firstZ = -ALLEY_LENGTH / 2 + LAMP_END_MARGIN;
  const lastZ = ALLEY_LENGTH / 2 - LAMP_END_MARGIN;
  const lampSpacing = (lastZ - firstZ) / (lampsPerSide - 1);
  for (let i = 0; i < lampsPerSide; i++) {
    const z = firstZ + i * lampSpacing;
    makeStreetLamp(-lampInset, z);
    makeStreetLamp(lampInset, z);
  }

  // load blender lab model
  loadModel("./blenderlabsamh.glb", { y: 1, z: -ALLEY_LENGTH / 2 + 5 });

  const AMBIENT_INTENSITY = 0.4;
  const ambient = new THREE.AmbientLight(COLORS.ambient, AMBIENT_INTENSITY);
  scene.add(ambient);

  const MOON_INTENSITY = 0.6;
  const moon = new THREE.DirectionalLight(COLORS.moonlight, MOON_INTENSITY);
  moon.position.set(-5, 20, 10); // up and to one side, like a high moon
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

    const delta = clock.getDelta();
    if (controls.isLocked) {
      const step = MOVE_SPEED * delta;
      if (keys.forward) controls.moveForward(step);
      if (keys.back) controls.moveForward(-step);
      if (keys.right) controls.moveRight(step);
      if (keys.left) controls.moveRight(-step);
    }

    const t = performance.now() * 0.001;
    for (const light of lampLights) {
      const base = light.userData.baseIntensity;
      light.intensity =
        base *
        (LAMP_FLICKER.baseLevel +
          LAMP_FLICKER.waveAmount *
            Math.sin(t * LAMP_FLICKER.waveSpeed + light.userData.phase) +
          LAMP_FLICKER.noiseAmount * (Math.random() - 0.5));
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
