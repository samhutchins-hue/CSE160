// TODO [x] remove cube class and implement functional way of building and rendering shapes
// TODO [] measure performance by frametime rather than render scene call (bind by refresh rate of monitor)
//  render calculation seems to be too quick, duration -> 0, so infinite fps
// TODO [] verify if I really don't need a Cube class for certain animation states

// TODO poke animation
// TODO slide animation

// NOTE interesting system design concept
// this is bad because it requires the caller to ensure color invariant
//function setColor(redVal, greenVal, blueVal, alpha) {
//    g_selectedColor = [redVal, greenVal, blueVal, alpha];
//}

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

const DEBUG = 1;
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
let g_selectedColor = [1, 1, 1, 1];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_globalRot = 0;
let g_globalAnimation = false;

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
//let u_PointSize;

let g_points = [];
let g_colors = [];
let g_sizes = [];
let g_shapesList = [];

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

  // // Get the storage location of u_PointSize
  // u_PointSize = gl.getUniformLocation(gl.program, "u_PointSize");
  // if (!u_PointSize) {
  //   console.log("Failed to get the storage location of u_PointSize");
  //   return false;
  // }

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
  // canvas.onmousedown = click;
  // canvas.onmousemove = function (ev) {
  //     if (ev.buttons == 1) {
  //         click(ev);
  //     }
  // };
  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  initCubeBuffer();
  //renderScene();
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
  document.getElementById("clearButton").onclick = function () {
    debugLog("clear button is working");
    // remove all shapes
    g_shapesList = [];
    // Clear <canvas>
    renderScene();
  };
  document.getElementById("pointButton").onclick = function () {
    debugLog("set to point");
    g_selectedType = POINT;
  };
  document.getElementById("triangleButton").onclick = function () {
    debugLog("set to triangle");
    g_selectedType = TRIANGLE;
  };
  document.getElementById("circleButton").onclick = function () {
    debugLog("set to circle");
    g_selectedType = CIRCLE;
  };
  document.getElementById("myPictureButton").onclick = function () {
    drawMyPicture();
    debugLog("drew my drawing");
  };

  // slider events
  // document.getElementById("redSlider").oninput = function () {
  //   g_selectedColor[0] = parseFloat(this.value) / colorScale
  //   debugLog("r value: ", g_selectedColor[0])
  // }
  // document.getElementById("greenSlider").oninput = function () {
  //   g_selectedColor[1] = parseFloat(this.value) / colorScale
  //   debugLog("g value: ", g_selectedColor[1])
  // }
  // document.getElementById("blueSlider").oninput = function () {
  //   g_selectedColor[2] = parseFloat(this.value) / colorScale
  //   debugLog("b value: ", g_selectedColor[2])
  // }
  // document.getElementById("sizeSlider").oninput = function () {
  //   g_selectedSize = parseFloat(this.value)
  //   debugLog("size value: ", g_selectedSize)
  // }

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

function click(ev) {
  let [x, y] = convertCoordinatesToGL(ev);

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  point.segments = g_selectedSegment;
  g_shapesList.push(point);

  // g_points.push([x, y]);

  // debugLog("color being pushed: ", g_selectedColor);
  // g_colors.push(g_selectedColor.slice());

  // debugLog("size being pushed: ", g_selectedSize);
  // g_sizes.push(g_selectedSize);

  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {
  //     // First quadrant
  //     g_colors.push([1.0, 0.0, 0.0, 1.0]); // Red
  // } else if (x < 0.0 && y < 0.0) {
  //     // Third quadrant
  //     g_colors.push([0.0, 1.0, 0.0, 1.0]); // Green
  // } else {
  //     // Others
  //     g_colors.push([1.0, 1.0, 1.0, 1.0]); // White
  // }

  renderScene();
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
  if (g_globalAnimation) {
    g_globalRot = 45 * Math.sin(g_seconds);
  }
}

const bodyM = new Matrix4();

const purple = [0.4, 0.3, 0.85, 1];
const white = [0.95, 0.95, 0.95, 1];
const darkEye = [0.1, 0.1, 0.15, 1];
const yellow = [1.0, 0.85, 0.25, 1];
const blue = [0.035, 0.102, 0.184, 1];

function drawWing(rootM, shoulderRot, elbowRot, wristRot) {
  let ShoulderM = new Matrix4(rootM)
    .translate(-0.25, 0.3, 0.25)
    .rotate(shoulderRot, 0, 0, 1);

  // upper wing
  drawCube(
    new Matrix4(ShoulderM).scale(0.1, 0.4, 0.4).translate(-0.5, -1, -0.5),
    blue,
  );

  let ElbowM = new Matrix4(ShoulderM)
    .translate(0, -0.4, 0)
    .rotate(elbowRot, 0, 0, 1);

  // forearm
  drawCube(
    new Matrix4(ElbowM).scale(0.1, 0.3, 0.4).translate(-0.5, -1, -0.5),
    blue,
  );

  let WristM = new Matrix4(ElbowM)
    .translate(0, -0.3, 0)
    .rotate(wristRot, 0, 0, 1);

  // hand/tip
  drawCube(
    new Matrix4(WristM).scale(0.12, 0.15, 0.4).translate(-0.5, -1, -0.5),
    blue,
  );
}

function renderScene() {
  // pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // TODO maybe remove if not rebinding buffer anywhere else
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // TODO: add shapes list later
  // let len = g_shapesList.length;
  // for (var i = 0; i < len; i++) { g_shapesList[i].render();
  // }

  //TODO REMOVE gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  //drawTriangle3D([-1.0, 0.0, 0.0, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0]);

  // root of the penguin's local coordinate system. tilt/scale/translate
  // the whole creature by changing this one matrix.

  // main body
  drawCube(
    new Matrix4(bodyM).translate(-0.25, -0.5, 0.0).scale(0.5, 1.0, 0.5),
    blue,
  );

  // front detail
  drawCube(
    new Matrix4(bodyM).translate(-0.2, -0.55, -0.1).scale(0.4, 0.9, 0.15),
    white,
  );

  // face
  drawCube(
    new Matrix4(bodyM).translate(-0.15, 0.1, -0.08).scale(0.3, 0.38, 0.12),
    white,
  );

  // left eye
  drawCube(
    new Matrix4(bodyM).translate(-0.14, 0.3, -0.12).scale(0.1, 0.1, 0.03),
    darkEye,
  );

  // left eye pupil
  drawCube(
    new Matrix4(bodyM).translate(-0.14, 0.35, -0.13).scale(0.04, 0.04, 0.02),
    white,
  );

  // right eye
  drawCube(
    new Matrix4(bodyM).translate(0.04, 0.3, -0.12).scale(0.1, 0.1, 0.03),
    darkEye,
  );

  // right eye pupil
  drawCube(
    new Matrix4(bodyM).translate(0.04, 0.35, -0.13).scale(0.04, 0.04, 0.02),
    white,
  );

  // TODO beak

  const leftWingM = new Matrix4(bodyM);
  const rightWingM = new Matrix4(bodyM).scale(-1, 1, 1);

  drawWing(leftWingM, g_leftShoulderRot, g_leftElbowRot, g_leftWristRot);
  drawWing(rightWingM, -g_rightShoulderRot, -g_rightElbowRot, -g_rightWristRot);

  // upper right wing

  // // right arm
  // drawCube(
  //   new Matrix4()
  //     .translate(0.25, -0.2, 0.05)
  //     .rotate(-g_globalRot, 0, 0, 1)
  //     .scale(0.1, 0.55, 0.4),
  //   yellow,
  // );

  // left foot
  drawCube(
    new Matrix4(bodyM).translate(-0.2, -0.6, -0.2).scale(0.15, 0.08, 0.25),
    yellow,
  );

  // right foot
  drawCube(
    new Matrix4(bodyM).translate(0.05, -0.6, -0.2).scale(0.15, 0.08, 0.25),
    yellow,
  );

  let K = 200.0;
  for (let i = 1; i < K; ++i) {
    drawCube(
      new Matrix4()
        .translate(-0.8, (1.9 * i) / K - 1.0, 0)
        .rotate(g_seconds * 100, 1, 1, 1)
        .scale(0.1, 0.5 / K, 1.0 / K),
      white,
    );
  }
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    debugLog("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
