"use strict";

let g_cubeBuffer = null;
let g_uvBuffer = null;
let g_normalBuffer = null;
let g_indexBuffer = null;
// let front = 0;
// let back = 6;
// let left = 12;
// let right = 18;
// let cubetop = 24;
// let bottom = 30;

// TODO: interleave buffers later
function initCubeBuffers() {
    // cube buffer
    if (g_cubeBuffer == null) {
        g_cubeBuffer = gl.createBuffer();
        if (!g_cubeBuffer) {
            console.log("Failed to create the cube vertex buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // FRONT (v0, v1, v2, v3)
            0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1,
            // LEFT (v4, v5, v6, v7)
            0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1,
            // RIGHT (v8, v9, v10, v11)
            1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0,
            // TOP (v12, v13, v14, v15)
            0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
            // BACK (v16, v17, v18, v19)
            1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
            // BOTTOM (v20, v21, v22, v23)
            0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1,
        ]),
        gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // UV buffer
    if (g_uvBuffer == null) {
        g_uvBuffer = gl.createBuffer();
        if (!g_uvBuffer) {
            console.log("Failed to create the cube uv buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // FRONT
            0, 1, 0, 0, 1, 0, 1, 1,
            // LEFT
            0, 1, 0, 0, 1, 0, 1, 1,
            // RIGHT
            0, 1, 0, 0, 1, 0, 1, 1,
            // TOP
            1, 0, 1, 1, 0, 1, 0, 0,
            // BACK
            0, 1, 0, 0, 1, 0, 1, 1,
            // BOTTOM
            0, 1, 0, 0, 1, 0, 1, 1,
        ]),
        gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);

    if (g_normalBuffer == null) {
        g_normalBuffer = gl.createBuffer();
        if (!g_normalBuffer) {
            console.log("Failed to create the cube normal buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // FRONT (+Z)
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // LEFT (-X)
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            // RIGHT (+X)
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // TOP (+Y)
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // BACK (-Z)
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // BOTTOM (-Y)
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        ]),
        gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_Normal);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

    if (g_indexBuffer == null) {
        g_indexBuffer = gl.createBuffer();
        if (!g_indexBuffer) {
            console.log("Failed to create the cube index buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint8Array([
            0,
            1,
            2,
            0,
            2,
            3, // Front face
            4,
            5,
            6,
            4,
            6,
            7, // Left face
            8,
            9,
            10,
            8,
            10,
            11, // Right face
            12,
            13,
            14,
            12,
            14,
            15, // Top face
            16,
            17,
            18,
            16,
            18,
            19, // Back face
            20,
            21,
            22,
            20,
            22,
            23, // Bottom face
        ]),
        gl.STATIC_DRAW,
    );
}

function drawCube(matrix, color, textureNum = -1) {
    gl.uniform1i(u_whichTexture, textureNum);

    // Bind all the attribute buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_indexBuffer);

    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
    g_normalScratchM.setInverseOf(matrix).transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalScratchM.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    // draw elements instead of drawArrays
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}
