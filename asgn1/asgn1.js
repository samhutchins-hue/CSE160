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
let g_selectedColor = [1, 1, 1, 1];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 10;

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
    document.getElementById("segmentSlider").oninput = function () {
        g_selectedSegment = parseFloat(this.value);
        debugLog("segment step: ", g_selectedSegment);
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

// draw my picture on the gl canvas
function drawMyPicture() {
    debugLog("drawMyPicture() entered");
    g_shapesList = [];
    gl.clear(gl.COLOR_BUFFER_BIT);
    let currColor = [];
    const gridW = 26;
    const gridH = 24;
    const scale = 2.0 / Math.max(gridW, gridH);
    const ox = -1.0;
    const oy = -1.0;

    function triScaled(x1, y1, x2, y2, x3, y3) {
        //gl.uniform4f(u_FragColor, color[0], color[1], color[2], 1.0);
        // scale
        drawTriangle([
            // xy
            ox + x1 * scale,
            oy + y1 * scale,
            // x + d, y
            ox + x2 * scale,
            oy + y2 * scale,
            // x, y + d
            ox + x3 * scale,
            oy + y3 * scale,
        ]);
    }

    const mainColor = [0.6, 0.42, 0.18]; // body tan/brown
    const highLight = [0.78, 0.58, 0.28]; // scale highlight
    const darkMainColor = [0.42, 0.28, 0.08]; // dark brown
    const tongueColor = [209 / 255, 142 / 255, 141 / 255];
    const eyeColor = [1, 1, 1];

    // tail + set color
    gl.uniform4f(u_FragColor, mainColor[0], mainColor[1], mainColor[2], 1.0);
    triScaled(3, 0, 3, 1, 5, 1);
    triScaled(5, 1, 8, 1, 8, 4);
    triScaled(8, 4, 9, 4, 9, 5);
    triScaled(6, 5, 9, 5, 6, 9);

    // body
    triScaled(3, 9, 8, 9, 3, 16);
    triScaled(3, 16, 8, 9, 8, 16);

    // legs
    // left leg top
    triScaled(3, 15, 3, 13, 1, 13);
    triScaled(0.5, 13, 1.5, 13, 0.5, 15);
    // right leg top
    triScaled(8, 15, 8, 13, 10, 13);
    triScaled(9.5, 13, 11, 13, 11, 15);

    // left leg bottom
    triScaled(3, 8, 3, 10, 1, 10);
    triScaled(0.5, 8, 0.5, 10, 1.5, 10);
    // right leg bottom
    triScaled(8, 8, 8, 10, 10, 10);
    triScaled(9.5, 10, 11, 10, 11, 8);

    // head
    gl.uniform4f(u_FragColor, darkMainColor[0], darkMainColor[1], darkMainColor[2], 1.0);
    triScaled(7, 16, 4, 19, 8, 21);
    triScaled(7, 16, 11, 18, 7, 21);
    //scale
    triScaled(8, 21, 7, 20, 5, 22);
    triScaled(6, 20, 5, 19, 1, 20);
    triScaled(10, 17.5, 8, 16.5, 9, 15.5);
    // eyes
    gl.uniform4f(u_FragColor, eyeColor[0], eyeColor[1], eyeColor[2], 1.0);
    triScaled(6.5, 19, 7, 18.5, 7.5, 19);
    triScaled(8.5, 18, 9, 17.5, 9.5, 18);
    // tongue
    gl.uniform4f(u_FragColor, tongueColor[0], tongueColor[1], tongueColor[2], 1.0);
    triScaled(9, 20, 9, 19, 12.5, 20.5);
    triScaled(12.5, 21, 12.5, 20, 13.5, 23);

    // logs (H shape)
    const logColor = [0.45, 0.25, 0.1];
    const logLight = [0.6, 0.35, 0.15];

    gl.uniform4f(u_FragColor, logColor[0], logColor[1], logColor[2], 1.0);

    // left log
    triScaled(14, 4, 16, 4, 14, 20);
    triScaled(16, 4, 16, 20, 14, 20);

    // right log
    triScaled(21, 4, 23, 4, 21, 20);
    triScaled(23, 4, 23, 20, 21, 20);

    // horizontal log
    triScaled(14, 11, 23, 11, 14, 13);
    triScaled(23, 11, 23, 13, 14, 13);

    // highlights on logs
    gl.uniform4f(u_FragColor, logLight[0], logLight[1], logLight[2], 1.0);
    triScaled(14.5, 5, 15.5, 5, 14.5, 19);
    triScaled(21.5, 5, 22.5, 5, 21.5, 19);
}
