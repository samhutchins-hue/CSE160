// TODO [x] remove cube class and implement functional way of building and rendering shapes
// TODO [x] measure performance by frametime rather than render scene call (bind by refresh rate of monitor)
//  render calculation seems to be too quick, duration -> 0, so infinite fps
// TODO [] maybe added classes back

// TODO slide animation

// NOTE interesting system design concept
// this is bad because it requires the caller to ensure color invariant
//function setColor(redVal, greenVal, blueVal, alpha) {
//    g_selectedColor = [redVal, greenVal, blueVal, alpha];
//}

"use strict";

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;

  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
  `;

const DEBUG = 0;
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

function debugLog(...args) {
  if (DEBUG >= 1) console.log(...args);
}
function verboseLog(...args) {
  if (DEBUG >= 2) console.log(...args);
}
let canvas;
let gl;

// globals related to ui elements
const colorScale = 100;
let g_globalAngle = 0;
let g_globalRot = 0;
let g_bodyTilt = 0;
let g_bodySide = 0;
let g_globalAnimation = false;
let g_pokeAnimation = false;
let g_pokeStartTime = 0;

let g_globalX = 0;
let g_globalY = 0;
let g_mousePosX = 0;
let g_mousePosY = 0;
let g_baseRotX = 0;
let g_baseRotY = 0;

// matrices
const g_scratchM = new Matrix4();
const g_birdRootM = new Matrix4();
const g_jointM = new Matrix4();
const g_bodyM = new Matrix4();
const g_scratchRotM = new Matrix4();
// join rotations

let g_leftShoulderRot = 0;
let g_leftElbowRot = 0;
let g_leftWristRot = 0;

let g_rightShoulderRot = 0;
let g_rightElbowRot = 0;
let g_rightWristRot = 0;

let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

const g_rightWingRootM = new Matrix4();

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return false;
  }

  gl.enable(gl.DEPTH_TEST);

  return true;
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return false;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return false;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return false;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);

  return true;
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function (ev) {
    const [x, y] = convertCoordinatesToGL(ev);
    g_mousePosX = x;
    g_mousePosY = y;
    g_baseRotX = g_globalX;
    g_baseRotY = g_globalY;
  };
  canvas.onmousemove = function (ev) {
    if (ev.buttons !== 1) return;
    const [x, y] = convertCoordinatesToGL(ev);

    // first calculate the distance the mouse has moved since the last update
    // then update the rotation angles based on that distance
    const deltaX = x - g_mousePosX;
    const deltaY = y - g_mousePosY;

    //
    g_globalX = g_baseRotX + -deltaX * 180;
    g_globalY = g_baseRotY + deltaY * 180;
  };
  canvas.onclick = function (ev) {
    if (ev.shiftKey && !g_pokeAnimation) {
      g_pokeAnimation = true;
      debugLog("anim: ", g_pokeAnimation);
      g_pokeStartTime = g_seconds;
    } else if (ev.shiftKey && g_pokeAnimation) {
      g_pokeAnimation = false;
      g_bodyTilt = 0;
      debugLog("anim: ", g_pokeAnimation);
    }
  };

  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.53, 0.81, 0.98, 1.0);

  initCubeBuffer();
  initConeBuffer();

  requestAnimationFrame(tick);
}

let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
let g_lastFrameTime = performance.now();

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // button events
  document.getElementById("animOn").onclick = function () {
    g_globalAnimation = true;
    debugLog("anim: ", g_globalAnimation);
    renderScene();
  };
  document.getElementById("animOff").onclick = function () {
    g_globalAnimation = false;
    debugLog("anim: ", g_globalAnimation);
    renderScene();
  };

  document.getElementById("angleSlider").oninput = function () {
    g_globalAngle = parseFloat(this.value);
    renderScene();
    debugLog("segment step: ", g_globalAngle);
  };

  // left wing sliders
  document.getElementById("leftShoulderSlider").oninput = function () {
    g_leftShoulderRot = parseFloat(this.value);
    renderScene();
    debugLog("shoulder: ", g_leftShoulderRot);
  };
  document.getElementById("leftElbowSlider").oninput = function () {
    g_leftElbowRot = parseFloat(this.value);
    renderScene();
    debugLog("elbow: ", g_leftElbowRot);
  };
  document.getElementById("leftWristSlider").oninput = function () {
    g_leftWristRot = parseFloat(this.value);
    renderScene();
    debugLog("wrist: ", g_leftWristRot);
  };

  // right wing sliders
  document.getElementById("rightShoulderSlider").oninput = function () {
    g_rightShoulderRot = parseFloat(this.value);
    renderScene();
    debugLog("shoulder: ", g_rightShoulderRot);
  };
  document.getElementById("rightElbowSlider").oninput = function () {
    g_rightElbowRot = parseFloat(this.value);
    renderScene();
    debugLog("elbow: ", g_rightElbowRot);
  };
  document.getElementById("rightWristSlider").oninput = function () {
    g_rightWristRot = parseFloat(this.value);
    renderScene();
    debugLog("wrist: ", g_rightWristRot);
  };
}

function convertCoordinatesToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function tick() {
  const now = performance.now();
  const frameMS = now - g_lastFrameTime;
  g_lastFrameTime = now;

  g_seconds = performance.now() / 1000.0 - g_startTime;
  verboseLog(g_seconds);

  // update animation angles
  updateAnimationAngles();
  // render everything
  renderScene();

  sendTextToHTML(
    " ms: " + Math.floor(frameMS) + " fps: " + Math.floor(10000 / frameMS) / 10,
    "numdot",
  );
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_pokeAnimation) {
    const t = (g_seconds - g_pokeStartTime) / 0.6;
    debugLog(t);
    if (t >= 4) {
      debugLog("poke should not be active");
      g_pokeAnimation = false;
      g_bodyTilt = 0;
    } else {
      if (g_bodyTilt < 90) {
        g_bodyTilt = (1 - Math.pow(1 - t, 3)) * 90;
      }
    }
  } else if (g_globalAnimation) {
    const waddle = Math.sin(g_seconds * 4);
    g_bodySide = 15 * waddle;
    const flap = 20 + 10 * Math.abs(waddle);
    g_leftShoulderRot = -flap;
    g_rightShoulderRot = flap;
  } else {
    g_globalRot = 0;
    g_bodySide = 0;
  }
}

const purple = [0.4, 0.3, 0.85, 1];
const white = [0.95, 0.95, 0.95, 1];
const darkEye = [0.1, 0.1, 0.15, 1];
const yellow = [1.0, 0.85, 0.25, 1];
const blue = [0.035, 0.102, 0.184, 1];

function renderScene() {
  // TODO maybe remove if not rebinding buffer anywhere else
  gl.bindBuffer(gl.ARRAY_BUFFER, g_coneBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // pass the matrix to u_ModelMatrix attribute
  g_scratchRotM
    .setIdentity()
    .rotate(g_globalY, 1, 0, 0)
    .rotate(g_globalX, 0, 1, 0)
    .rotate(g_globalAngle, 0, 1, 0)
    .scale(0.2, 0.2, 0.2);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_scratchRotM.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // floor
  g_scratchM.setIdentity().translate(-3, -1.1, -4).scale(40, 0.5, 40);
  drawCube(g_scratchM, white);
  const bird1 = makeBird(0, 0, 0);
  drawBird(
    bird1.rootM,
    bird1.tilt,
    bird1.side,
    bird1.shoulderL,
    bird1.elbowL,
    bird1.wristL,
    bird1.shoulderR,
    bird1.elbowR,
    bird1.wristR,
  );

  const bird2 = makeBird(1, 0, 0);
  drawBird(
    bird2.rootM,
    bird2.tilt,
    bird2.side,
    bird2.shoulderL,
    bird2.elbowL,
    bird2.wristL,
    bird2.shoulderR,
    bird2.elbowR,
    bird2.wristR,
  );

  // bodyM
  //   .setIdentity()
  //   .translate(0, -0.6, 0)
  //   .rotate(g_bodyTilt, 1, 0, 0)
  //   .rotate(g_bodySide, 0, 0, 1)
  //   .translate(0, 0.6, 0);

  // let K = 200.0;
  // for (let i = 1; i < K; ++i) {
  //   drawCube(
  //     new Matrix4()
  //       .translate(-0.8, (1.9 * i) / K - 1.0, 0)
  //       .rotate(g_seconds * 100, 1, 1, 1)
  //       .scale(0.1, 0.5 / K, 1.0 / K),
  //     white,
  //   );
  // }
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    debugLog("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
