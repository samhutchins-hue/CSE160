// TODO rename all files to fit assignment standards
// TODO remember to verify attribute vs uniform when creating a new gl variable

const DEBUG = true;
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

function debugLog(...args) {
    if (DEBUG) console.log(...args);
}
var g_points = []; // The array for the position of a mouse press
var g_colors = []; // The array to store the color of a point
var canvas;
var gl;

// globals related to ui elements
const colorScale = 100;
let g_selectedColor = [0, 0, 0, 1];
let g_selectedSize = 5;
g_selectedType = POINT;

var a_Position;
var u_FragColor;
var u_PointSize;

var g_points = [];
var g_colors = [];
var g_sizes = [];
var g_shapesList = [];

// NOTE interesting system design concept
// this is bad because it requires the caller to ensure color invariant
//function setColor(redVal, greenVal, blueVal, alpha) {
//    g_selectedColor = [redVal, greenVal, blueVal, alpha];
//}

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_PointSize;
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

    // Get the storage location of u_PointSize
    u_PointSize = gl.getUniformLocation(gl.program, "u_PointSize");
    if (!u_PointSize) {
        console.log("Failed to get the storage location of u_PointSize");
        return false;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return false;
    }

    return true;
}

function main() {
    if (!setupWebGL()) return;
    if (!connectVariablesToGLSL()) return;

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) {
        if (ev.buttons == 1) {
            click(ev);
        }
    };
    addActionsForHtmlUI();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
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

    // RGB slider events
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

    // size slider events
    document.getElementById("sizeSlider").oninput = function () {
        g_selectedSize = parseFloat(this.value);
        debugLog("size value: ", g_selectedSize);
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
    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    let len = g_shapesList.length;
    for (var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }
    var duration = performance.now() - startTime;
    sendTextToHTML(
        "numdot: " +
            len +
            " ms: " +
            Math.floor(duration) +
            " fps: " +
            Math.floor(10000 / duration) / 10,
        "numdot",
    );
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        debugLog("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
