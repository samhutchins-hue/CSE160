"use strict";

let g_cubeBuffer = null;
let g_uvBuffer = null;
let front = 0;
let back = 6;
let left = 12;
let right = 18;
let cubetop = 24;
let bottom = 30;

// TODO: interleave buffers later
function initCubeBuffers() {
    // cube buffer
    if (g_cubeBuffer == null) {
        g_cubeBuffer = gl.createBuffer();
        if (!g_cubeBuffer) {
            console.log("Failed to create the buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // FRONT
            0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1,
            // LEFT
            0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1,
            // RIGHT
            1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0,
            // TOP
            0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0,
            // BACK
            1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0,
            // BOTTOM
            0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1,
        ]),
        gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // UV buffer
    if (g_uvBuffer == null) {
        g_uvBuffer = gl.createBuffer();
        if (!g_uvBuffer) {
            console.log("Failed to create the buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // FRONT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // LEFT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // RIGHT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // TOP
            1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0,
            // BACK
            0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0,
            // BOTTOM
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
        ]),
        gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
}

function setColor(x, color) {
    const [r, g, b, a] = color;
    gl.uniform4f(u_FragColor, r * x, g * x, b * x, a);
}

function drawCube(matrix, color, textureNum = -1) {
    gl.uniform1i(u_whichTexture, textureNum);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);

    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 32);
}
