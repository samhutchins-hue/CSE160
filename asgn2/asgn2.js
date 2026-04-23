// TODO rename all files to fit assignment standards
// TODO remember to verify attribute vs uniform when creating a new gl variable

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

const DEBUG = true;
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

function debugLog(...args) {
    if (DEBUG) console.log(...args);
}
let canvas;
let gl;

// globals related to ui elements
const colorScale = 100;
let g_selectedColor = [1, 1, 1, 1];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;

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
        console.log(
            "Failed to get the storage location of u_GlobalRotateMatrix",
        );
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
    renderAllShapes();
}

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {
    // button events
    document.getElementById("clearButton").onclick = function () {
        debugLog("clear button is working");
        // remove all shapes
        g_shapesList = [];
        // Clear <canvas>
        renderAllShapes();
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
    document.getElementById("redSlider").oninput = function () {
        g_selectedColor[0] = parseFloat(this.value) / colorScale;
        debugLog("r value: ", g_selectedColor[0]);
    };
    document.getElementById("greenSlider").oninput = function () {
        g_selectedColor[1] = parseFloat(this.value) / colorScale;
        debugLog("g value: ", g_selectedColor[1]);
    };
    document.getElementById("blueSlider").oninput = function () {
        g_selectedColor[2] = parseFloat(this.value) / colorScale;
        debugLog("b value: ", g_selectedColor[2]);
    };
    document.getElementById("sizeSlider").oninput = function () {
        g_selectedSize = parseFloat(this.value);
        debugLog("size value: ", g_selectedSize);
    };
    document.getElementById("angleSlider").oninput = function () {
        g_globalAngle = parseFloat(this.value);
        renderAllShapes();
        debugLog("segment step: ", g_globalAngle);
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

    renderAllShapes();
}

function convertCoordinatesToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function renderAllShapes() {
    //var startTime = performance.now();

    // pass the matrix to u_ModelMatrix attribute
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // TODO: add shapes list later
    // let len = g_shapesList.length;
    // for (var i = 0; i < len; i++) {
    //   g_shapesList[i].render();
    // }

    //TODO REMOVE gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    //drawTriangle3D([-1.0, 0.0, 0.0, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0]);

    // draw a cube
    let body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    body.matrix.translate(-0.25, -0.5, 0.0);
    body.matrix.scale(0.5, 1, 0.5);
    body.render();

    // draw left arm
    let leftArm = new Cube();
    leftArm.color = [1, 1, 0, 1];
    leftArm.matrix.translate(0.7, 0, 0.0);
    leftArm.matrix.rotate(45, 0, 0, 1);
    leftArm.matrix.scale(0.25, 0.7, 0.5);
    leftArm.render();

    // test box
    let box = new Cube();
    box.color = [1, 0, 1, 1];
    box.matrix.translate(0, 0, -0.5, 0);
    box.matrix.rotate(-30, 1, 0, 0);
    box.matrix.scale(0.5, 0.5, 0.5);
    box.render();

    // var duration = performance.now() - startTime;
    // sendTextToHTML(
    //   "numdot: " +
    //     len +
    //     " ms: " +
    //     Math.floor(duration) +
    //     " fps: " +
    //     Math.floor(10000 / duration) / 10,
    //   "numdot",
    // );
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        debugLog("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
