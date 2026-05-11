"use strict";

// NOTE: model_matrix: cube location,
// NOTE: global_rotate_matrix: global rotation
// NOTE:
// TODO: view_matrix set with lookat command
// TODO: projection_matrix set with gl_perspective command
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;

  attribute vec2 a_UV;
  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
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
let g_globalAngle = 0;
let g_globalRot = 0;
let g_bodyTilt = 0;
let g_bodySide = 0;
let g_globalAnimation = false;
let g_pokeAnimation = false;
let g_pokeStartTime = 0;

let g_camera = null;

let g_globalX = 0;
let g_globalY = 0;
let g_mousePosX = 0;
let g_mousePosY = 0;
let g_baseRotX = 0;
let g_baseRotY = 0;

let g_map = [];
for (let i = 0; i < 32; ++i) {
    g_map[i] = [];
    for (let j = 0; j < 32; ++j) {
        g_map[i][j] = 0;
    }
}
g_map[0][1] = 1;
g_map[0][0] = 2;
g_map[1][0] = 3;

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
let g_keys = {};

let a_Position;
let u_Sampler0;
let a_UV;
let u_FragColor;
let u_whichTexture;

let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;

const g_rightWingRootM = new Matrix4();

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById("webgl");

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    // TODO: remove
    gl = WebGLDebugUtils.makeDebugContext(gl);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
    }

    gl.enable(gl.DEPTH_TEST);

    return true;
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to intialize shaders.");
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
    }
    a_UV = gl.getAttribLocation(gl.program, "a_UV");
    if (a_UV < 0) {
        console.log("Failed to get the storage location of a_UV");
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    if (!u_ViewMatrix) {
        console.log("Failed to get the storage location of u_ViewMatrix");
    }

    u_ProjectionMatrix = gl.getUniformLocation(
        gl.program,
        "u_ProjectionMatrix",
    );
    if (!u_ProjectionMatrix) {
        console.log("Failed to get the storage location of u_ProjectionMatrix");
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(
        gl.program,
        "u_GlobalRotateMatrix",
    );

    if (!u_GlobalRotateMatrix) {
        console.log(
            "Failed to get the storage location of u_GlobalRotateMatrix",
        );
    }

    // Get the storage location of u_Sampler0
    u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
    if (!u_Sampler0) {
        console.log("Failed to get the storage location of u_Sampler0");
    }

    u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
    if (!u_whichTexture) {
        console.log("Failed to get the storage location of u_whichTexture");
    }

    // setup initial matrices
    // NOTE: should work with a single created identiy matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);

    return true;
}

// TODO: implement multiple textures with data structure + lambda function
function initTextures() {
    var image = new Image();
    if (!image) {
        console.log("Failed to create the image object");
        return false;
    }
    image.onload = function () {
        sendImageToTEXTURE0(image);
    };
    image.src = "./img/uvCoords.png";

    // TODO: add more textures later
    return true;
}

function sendImageToTEXTURE0(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
}

function main() {
    if (!setupWebGL()) return;
    if (!connectVariablesToGLSL()) return;
    // TODO: maybe move initTextures call
    if (!initTextures(gl, 0)) return;

    g_camera = new Camera();
    gl.uniformMatrix4fv(
        u_ProjectionMatrix,
        false,
        g_camera.projectionMatrix.elements,
    );

    document.addEventListener("keydown", (e) => {
        g_keys[e.key] = true;
        debugLog("key down");
    });
    document.addEventListener("keyup", (e) => {
        g_keys[e.key] = false;
        debugLog("key up");
    });

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
    // canvas.onclick = function (ev) {
    //     if (ev.shiftKey && !g_pokeAnimation) {
    //         g_pokeAnimation = true;
    //         debugLog("anim: ", g_pokeAnimation);
    //         g_pokeStartTime = g_seconds;
    //     } else if (ev.shiftKey && g_pokeAnimation) {
    //         g_pokeAnimation = false;
    //         g_bodyTilt = 0;
    //         debugLog("anim: ", g_pokeAnimation);
    //     }
    // };

    addActionsForHtmlUI();

    // Specify the color for clearing <canvas>
    // gl.clearColor(0.53, 0.81, 0.98, 1.0);
    gl.clearColor(0, 0, 0, 1.0);

    initCubeBuffers();
    initWalls();
    // TODO: cone
    //initConeBuffer();

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

    if (g_keys["w"]) {
        g_camera.moveForward();
        debugLog("forward");
    }
    if (g_keys["a"]) {
        g_camera.moveLeft();
    }
    if (g_keys["s"]) {
        g_camera.moveBackward();
    }
    if (g_keys["d"]) {
        g_camera.moveRight();
    }
    if (g_keys["e"]) {
        g_camera.panRight();
    }
    if (g_keys["q"]) {
        g_camera.panLeft();
    }

    // update animation angles
    updateAnimationAngles();
    // render everything
    renderScene();

    sendTextToHTML(
        " ms: " +
            Math.floor(frameMS) +
            " fps: " +
            Math.floor(10000 / frameMS) / 10,
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

let g_walls = [];
function initWalls() {
    for (let i = 0; i < 32; ++i) {
        for (let j = 0; j < 32; ++j) {
            const height = g_map[i][j];
            for (let h = 0; h < height; ++h) {
                const w = new Matrix4().translate(i, h, j);
                g_walls.push(w);
            }
        }
    }
}

function drawMap() {
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < g_walls.length; ++i) {
        drawCube(g_walls[i], [1.0, 0, 0, 1.0], 0);
    }
}

function renderScene() {
    // TODO CONE
    //gl.bindBuffer(gl.ARRAY_BUFFER, g_coneBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // pass the matrix to u_ModelMatrix attribute
    g_scratchRotM.setIdentity();
    // .setIdentity()
    // .rotate(g_globalY, 1, 0, 0)
    // .rotate(g_globalX, 0, 1, 0)
    // .rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_scratchRotM.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ground
    // g_scratchM.setIdentity().translate(-3, -1.1, -4).scale(40, 0.5, 40);
    g_scratchM
        .setIdentity()
        .translate(0, -1, 0)
        .scale(1000, 0.1, 1000)
        .translate(-0.5, 0, -0.5);
    drawCube(g_scratchM, white, 0);

    g_scratchM.setIdentity().scale(50, 50, 50).translate(-0.5, -0.5, -0.5);
    drawCube(g_scratchM, blue, -1);

    drawMap();

    // const bird1 = makeBird(0, 0, 0);
    // drawBird(
    //     bird1.rootM,
    //     bird1.tilt,
    //     bird1.side,
    //     bird1.shoulderL,
    //     bird1.elbowL,
    //     bird1.wristL,
    //     bird1.shoulderR,
    //     bird1.elbowR,
    //     bird1.wristR,
    // );

    // const bird2 = makeBird(1, 0, 0);
    // drawBird(
    //     bird2.rootM,
    //     bird2.tilt,
    //     bird2.side,
    //     bird2.shoulderL,
    //     bird2.elbowL,
    //     bird2.wristL,
    //     bird2.shoulderR,
    //     bird2.elbowR,
    //     bird2.wristR,
    // );

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
