import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  {
    const planeSize = 40;
    const loader = new THREE.TextureLoader();
    const texture = loader.load("../cobblestone_bricks_mossy.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);
  }
  {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: "#8AC" });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
    scene.add(mesh);
  }
  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisons = 16;
    const sphereGeo = new THREE.SphereGeometry(
      sphereRadius,
      sphereWidthDivisions,
      sphereHeightDivisons,
    );
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#CA8" });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    scene.add(mesh);
  }

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

  {
    function makeXYZGUI(gui, vector3, name, onChangeFn) {
      const folder = gui.addFolder(name);
      folder.add(vector3, "x", -10, 10).onChange(onChangeFn);
      folder.add(vector3, "y", 0, 10).onChange(onChangeFn);
      folder.add(vector3, "z", -10, 10).onChange(onChangeFn);
      folder.open();
    }

    const color = 0xffffff;
    // const intensity = 1;
    // const light = new THREE.DirectionalLight(color, intensity);
    const intensity = 150;
    const light = new THREE.PointLight(color, intensity);
    light.position.set(0, 10, 0);
    // light.target.position.set(-5, 0, 0);
    scene.add(light);
    // scene.add(light.target);

    // const helper = new THREE.DirectionalLightHelper(light);
    const helper = new THREE.PointLightHelper(light);
    scene.add(helper);

    // function updateLight() {
    //   light.target.updateMatrixWorld();
    //   helper.update();
    // }
    function updateLight() {
      helper.update();
    }
    updateLight();

    const gui = new GUI();
    gui.addColor(new ColorGUIHelper(light, "color"), "value").name("color");
    gui.add(light, "intensity", 0, 5, 0.01);
    gui.add(light, "distance", 0, 40).onChange(updateLight);

    makeXYZGUI(gui, light.position, "position", updateLight);
    // makeXYZGUI(gui, light.target.position, "target", updateLight);
  }

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

  // function loadColorTexture(path) {
  //   const texture = loader.load(path);
  //   texture.colorSpace = THREE.SRGBColorSpace;
  //   return texture;
  // }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // cubes.forEach((cube, ndx) => {
    //   const speed = 0.2 + ndx * 0.1;
    //   const rot = time * speed;
    //   cube.rotation.x = rot;
    //   cube.rotation.y = rot;
    // });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
