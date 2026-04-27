"use strict";

let g_cubeBuffer = null;
let front = 0;
let back = 6;
let left = 12;
let right = 18;
let cubetop = 24;
let bottom = 30;

function initCubeBuffer() {
  g_cubeBuffer = gl.createBuffer();
  if (!g_cubeBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // front
      0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0,
      // back
      0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1,
      // left
      0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1,
      // right
      1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1,
      // top
      0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0,
      // bottom
      0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    ]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
}

function setColor(x, color) {
  const [r, g, b, a] = color;
  gl.uniform4f(u_FragColor, r * x, g * x, b * x, a);
}

function drawCube(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);

  setColor(1, color);
  gl.drawArrays(gl.TRIANGLES, front, 6);

  setColor(0.5, color);
  gl.drawArrays(gl.TRIANGLES, back, 6);

  setColor(0.7, color);
  gl.drawArrays(gl.TRIANGLES, left, 6);

  setColor(0.6, color);
  gl.drawArrays(gl.TRIANGLES, right, 6);

  setColor(0.9, color);
  gl.drawArrays(gl.TRIANGLES, cubetop, 6);

  setColor(0.4, color);
  gl.drawArrays(gl.TRIANGLES, bottom, 6);
}
