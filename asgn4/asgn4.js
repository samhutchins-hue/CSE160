"use strict";
const DEBUG = 1;
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;

  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform vec3 u_LightPos;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_NormalDir = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));

    vec4 worldPos = u_ModelMatrix * a_Position;
    v_LightDir = normalize(u_LightPos - vec3(worldPos));
    // v_Lighting = dot(LightDir, v_Normal);
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;

  uniform vec4 u_FragColor;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;

  uniform int u_whichTexture;
  uniform bool u_normalOn;
  uniform vec3 u_LightPos;

  void main() {
    vec3 N = normalize(v_NormalDir);
    vec3 L = normalize(v_LightDir);
    float nDotL = max(dot(L, N), 0.0);

    if (u_normalOn) {
      gl_FragColor = vec4((N+1.0)/2.0, 1.0);
      return;
    }
    if (u_whichTexture == -2) {
      gl_FragColor = vec4((N+1.0)/2.0, 1.0);
    } else if (u_whichTexture == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
    gl_FragColor.rgb *= nDotL;
  }
  `;

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
const g_normalScratchM = new Matrix4();

let g_keys = {};
let g_LightPos = [5, 3, 2];

let a_Position;
let a_Normal;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let a_UV;
let u_FragColor;
let u_whichTexture;

let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_NormalMatrix;
let u_normalOn;
let u_LightPos;

function setupWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    // TODO: remove
    // gl = WebGLDebugUtils.makeDebugContext(gl);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
    }
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);

    return true;
}

function addActionsForHtmlUI() {
    document.getElementById("normalOn").onclick = function () {
        debugLog("normal is on");
        gl.uniform1i(u_normalOn, 1);
    };
    document.getElementById("normalOff").onclick = function () {
        debugLog("normal is off");
        gl.uniform1i(u_normalOn, 0);
    };
    document.getElementById("lightSliderX").oninput = function () {
        g_LightPos[0] = parseFloat(this.value);
    };
    document.getElementById("lightSliderY").oninput = function () {
        g_LightPos[1] = parseFloat(this.value);
    };
    document.getElementById("lightSliderZ").oninput = function () {
        g_LightPos[2] = parseFloat(this.value);
    };
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

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    if (a_Normal < 0) {
        console.log("Failed to get the storage location of a_Normal");
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

    // Get the storage location of u_Sampler2
    u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
    if (!u_Sampler2) {
        console.log("Failed to get the storage location of u_Sampler2");
    }

    // Get the storage location of u_Sampler3
    u_Sampler3 = gl.getUniformLocation(gl.program, "u_Sampler3");
    if (!u_Sampler3) {
        console.log("Failed to get the storage location of u_Sampler3");
    }

    u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
    if (!u_whichTexture) {
        console.log("Failed to get the storage location of u_whichTexture");
    }

    u_normalOn = gl.getUniformLocation(gl.program, "u_normalOn");
    if (!u_normalOn) {
        console.log("Failed to get the storage location of u_normalOn");
    }

    u_LightPos = gl.getUniformLocation(gl.program, "u_LightPos");
    if (!u_LightPos) {
        console.log("Failed to get the storage location of u_LightPos");
    }

    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    if (!u_NormalMatrix) {
        console.log("Failed to get the storage location of u_NormalMatrix");
    }

    // setup initial matrices
    // NOTE: should work with a single created identiy matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

    return true;
}

// TODO: implement multiple textures with data structure + lambda function
function initTextures() {
    var image0 = new Image();
    if (!image0) {
        console.log("Failed to create the image object");
        return false;
    }
    image0.onload = function () {
        sendImageToTEXTURE0(image0);
    };
    image0.src = "./img/dirt.png";

    var image1 = new Image();
    if (!image1) {
        console.log("Failed to create the image object");
        return false;
    }
    image1.onload = function () {
        sendImageToTEXTURE1(image1);
    };
    image1.src = "./img/cobblestone.png";

    var image2 = new Image();
    if (!image2) {
        console.log("Failed to create the image object");
        return false;
    }
    image2.onload = function () {
        sendImageToTEXTURE2(image2);
    };
    image2.src = "./img/cobblestone_bricks.png";

    var image3 = new Image();
    if (!image3) {
        console.log("Failed to create the image object");
        return false;
    }
    image3.onload = function () {
        sendImageToTEXTURE3(image3);
    };
    image3.src = "./img/cobblestone_bricks_mossy.png";

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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler1, 1);
}

function sendImageToTEXTURE2(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.uniform1i(u_Sampler2, 2);
}

function sendImageToTEXTURE3(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.uniform1i(u_Sampler3, 3);
}

function main() {
    if (!setupWebGL()) return;
    if (!connectVariablesToGLSL()) return;
    // TODO: maybe move initTextures call
    if (!initTextures(gl, 0)) return;
    addActionsForHtmlUI();

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
    initSphereBuffer();
    generateMaze();
    initWalls();
    // TODO: cone
    // initConeBuffer();

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

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3f(u_LightPos, g_LightPos[0], g_LightPos[1], g_LightPos[2]);

    // ground

    g_scratchM.setIdentity().translate(-500, -0.1, -500).scale(1000, 0.1, 1000);
    drawCube(g_scratchM, white, 0);
    // g_scratchM.setIdentity().translate(-25, -1, -25).scale(80, 0.1, 80);
    // drawCube(g_scratchM, [0.3, 0.6, 0.3, 1], -1);

    // sky
    g_scratchM
        .setIdentity()
        .translate(16, 0, 16)
        .scale(-500, -500, -500)
        .translate(-0.5, -0.5, -0.5);
    drawCube(g_scratchM, blue, -1);
    g_scratchM.setIdentity().translate(8, 2, 8).scale(2, 2, 2);
    drawSphere(g_scratchM, [1, 0, 0, 1], -1);

    g_scratchM
        .setIdentity()
        .translate(g_LightPos[0], g_LightPos[1], g_LightPos[2])
        .scale(0.3, 0.3, 0.3)
        .translate(-0.5, -0.5, -0.5);
    drawCube(g_scratchM, blue, -1);

    // drawMap();
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        debugLog("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
