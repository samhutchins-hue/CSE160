let g_sphere = {
    buffer: null,
    uvBuffer: null,
    normalBuffer: null,
    indexBuffer: null,
    indexCount: 0,
    // vertexCount: 0,
    divisions: 16,
    indexType: 0,
};

function generateVertices(numDivs) {
    let i, ai, si, ci;
    let j, aj, sj, cj;

    let u, v;

    let positions = [];
    let uvs = [];

    // Generate coordinates
    for (j = 0; j <= numDivs; j++) {
        aj = (j * Math.PI) / numDivs;
        sj = Math.sin(aj);
        cj = Math.cos(aj);

        v = 1.0 - j / numDivs;
        uvs.push(u);

        for (i = 0; i <= numDivs; i++) {
            ai = (i * 2 * Math.PI) / numDivs;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            positions.push(si * sj); // X
            positions.push(cj); // Y
            positions.push(ci * sj); // Z

            u = i / numDivs;
            uvs.push(u);
        }
    }
    // verboseLog("positions: ", positions.length);
    return { positions, uvs };
}
function generateIndices(numDivs) {
    let p1, p2;
    let indices = [];
    // Generate indices
    for (j = 0; j < numDivs; j++) {
        for (i = 0; i < numDivs; i++) {
            p1 = j * (numDivs + 1) + i;
            p2 = p1 + (numDivs + 1);

            indices.push(p1);
            indices.push(p2);
            indices.push(p1 + 1);

            indices.push(p1 + 1);
            indices.push(p2);
            indices.push(p2 + 1);
        }
    }
    // verboseLog("indices: ", indices.length);
    return indices;
}

function initSphereBuffer() {
    // get position and indice arrays
    let { positions, uvs } = generateVertices(g_sphere.divisions);
    let indices = generateIndices(g_sphere.divisions);

    // verboseLog("positions: ", positions.length);
    // verboseLog("indices: ", indices.length);

    // set the position and indice lengths for draw calls
    // g_sphere.vertexCount = positions.length;
    g_sphere.indexCount = indices.length;
    g_sphere.indexType = gl.UNSIGNED_SHORT;

    if (g_sphere.buffer == null) {
        g_sphere.buffer = gl.createBuffer();
        if (!g_sphere.buffer) {
            console.log("Failed to create the sphere vertex buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_sphere.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // // UV buffer
    // if (g_sphere.uvBuffer == null) {
    //     g_sphere.uvBuffer = gl.createBuffer();
    //     if (!g_sphere.uvBuffer) {
    //         console.log("Failed to create the sphere uv buffer object");
    //         return -1;
    //     }
    // }

    // gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereUvBuffer);
    // gl.bufferData(
    //     gl.ARRAY_BUFFER,
    //     new Float32Array([
    //         // FRONT
    //         0, 1, 0, 0, 1, 0, 1, 1,
    //         // LEFT
    //         0, 1, 0, 0, 1, 0, 1, 1,
    //         // RIGHT
    //         0, 1, 0, 0, 1, 0, 1, 1,
    //         // TOP
    //         1, 0, 1, 1, 0, 1, 0, 0,
    //         // BACK
    //         0, 1, 0, 0, 1, 0, 1, 1,
    //         // BOTTOM
    //         0, 1, 0, 0, 1, 0, 1, 1,
    //     ]),
    //     gl.STATIC_DRAW,
    // );
    // gl.enableVertexAttribArray(a_UV);
    // gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);

    if (g_sphere.normalBuffer == null) {
        g_sphere.normalBuffer = gl.createBuffer();
        if (!g_sphere.normalBuffer) {
            console.log("Failed to create the sphere normal buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_sphere.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_Normal);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

    if (g_sphere.indexBuffer == null) {
        g_sphere.indexBuffer = gl.createBuffer();
        if (!g_sphere.indexBuffer) {
            console.log("Failed to create the sphere index buffer object");
            return -1;
        }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_sphere.indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
    );

    verboseLog("indices length= ", indices.length);
    verboseLog("type of buffer= ", indices.constructor.name);
    verboseLog("max index val= ", Math.max(...indices));
    verboseLog("number of vertices generated= ", positions.length / 3);
}

function drawSphere(matrix, color, textureNum = -1) {
    // verboseLog("positions: ", g_sphere.);
    verboseLog("indices: ", g_sphere.indexCount);

    gl.uniform1i(u_whichTexture, textureNum);

    // Bind all the attribute buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, g_sphere.buffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereUvBuffer);
    // gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_sphere.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_sphere.indexBuffer);

    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    verboseLog("count passed to drawElements= ", g_sphere.indexCount);

    // draw elements instead of drawArrays
    // NOTE: there was an error where I passed UNSIGNED_BYTE (8 bit index, sphere exceeds index 255)
    gl.drawElements(gl.TRIANGLES, g_sphere.indexCount, g_sphere.indexType, 0);
}
