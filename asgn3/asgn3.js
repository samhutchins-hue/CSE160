"use strict";

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;

  attribute vec2 a_UV;
  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;

  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
  }
  `;

const DEBUG = 0;

function debugLog(...args) {
    if (DEBUG >= 1) console.log(...args);
}
function verboseLog(...args) {
    if (DEBUG >= 2) console.log(...args);
}
let canvas;
let gl;

let g_camera = null;

// matrices
const g_scratchM = new Matrix4();

let g_keys = {};

let a_Position;
let u_Sampler0;
let u_Sampler1;
let a_UV;
let u_FragColor;
let u_whichTexture;

let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;

function setupWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    // TODO: remove
    // gl = WebGLDebugUtils.makeDebugContext(gl);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
    }
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

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

    // Get the storage location of u_Sampler0
    u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
    if (!u_Sampler0) {
        console.log("Failed to get the storage location of u_Sampler0");
    }

    // Get the storage location of u_Sampler1
    u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
    if (!u_Sampler1) {
        console.log("Failed to get the storage location of u_Sampler1");
    }

    u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
    if (!u_whichTexture) {
        console.log("Failed to get the storage location of u_whichTexture");
    }

    // setup initial matrices
    // NOTE: should work with a single created identiy matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

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
    // image.src = "./img/128x128/Gray/Prototype_Grid_Gray_03-128x128.png";
    image.src = "./img/uvCoords.png";

    // TODO: add more textures later

    var image1 = new Image();
    if (!image1) {
        console.log("Failed to create the image object");
        return false;
    }
    image1.src = "./img/blocks/slate.png";

    image1.onload = function () {
        sendImageToTEXTURE1(image1);
    };
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

function sendImageToTEXTURE1(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE1);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler1, 1);
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

    canvas.addEventListener("click", async () => {
        if (!document.pointerLockElement) {
            try {
                await canvas.requestPointerLock({
                    unadjustedMovement: true,
                });
            } catch (error) {
                if (error.name === "NotSupportedError") {
                    // Some platforms may not support unadjusted movement.
                    await canvas.requestPointerLock();
                } else {
                    throw error;
                }
            }
        }
    });

    document.addEventListener("pointerlockchange", lockChangeAlert, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas) {
            console.log("The pointer lock status is now locked");
            document.addEventListener("mousemove", updatePosition, false);
        } else {
            console.log("The pointer lock status is now unlocked");
            document.removeEventListener("mousemove", updatePosition, false);
        }
    }

    function updatePosition(e) {
        const sensitivity = 0.2;
        g_camera.panBy(-e.movementX * sensitivity);
        g_camera.pitchBy(-e.movementY * sensitivity);
    }

    gl.clearColor(0, 0, 0, 1.0);

    initCubeBuffers();
    initWalls();
    // TODO: cone
    initConeBuffer();

    requestAnimationFrame(tick);
}

let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
let g_lastFrameTime = performance.now();

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

    const baseSpeed = (0.1 / 20) * frameMS;
    if (g_keys["w"]) {
        g_camera.moveForward(baseSpeed);
    }
    if (g_keys["a"]) {
        g_camera.moveLeft(baseSpeed);
    }
    if (g_keys["s"]) {
        g_camera.moveBackward(baseSpeed);
    }
    if (g_keys["d"]) {
        g_camera.moveRight(baseSpeed);
    }
    if (g_keys["e"]) {
        g_camera.panRight();
    }
    if (g_keys["q"]) {
        g_camera.panLeft();
    }

    g_seconds = performance.now() / 1000.0 - g_startTime;
    verboseLog(g_seconds);

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

const purple = [0.4, 0.3, 0.85, 1];
const white = [0.95, 0.95, 0.95, 1];
const darkEye = [0.1, 0.1, 0.15, 1];
const yellow = [1.0, 0.85, 0.25, 1];
const blue = [0.035, 0.102, 0.184, 1];

let g_map = [];
for (let i = 0; i < 32; ++i) {
    g_map[i] = [];
    for (let j = 0; j < 32; ++j) {
        // g_map[i][j] = Math.floor(Math.random() * 20);
        g_map[i][j] = 0;
    }
}

// g_map[0][1] = 1;
g_map[0][0] = 1;
g_map[1][0] = 2;

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
    for (let i = 0; i < g_walls.length; ++i) {
        drawCube(g_walls[i], [1.0, 0, 0, 1.0], 1);
    }
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ground
    // g_scratchM.setIdentity().translate(-3, -1.1, -4).scale(40, 0.5, 40);
    // g_scratchM
    //     .scale(1000, 0.1, 1000)
    //     .translate(-0.5, 0, -0.5);
    // drawCube(g_scratchM, white, 0);

    g_scratchM.setIdentity().scale(50, 50, 50).translate(-0.5, -0.5, -0.5);
    drawCube(g_scratchM, blue, -1);
    drawMap();
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        debugLog("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
