let g_cubeBuffer = null;

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
      0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1,
      0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1,
      0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 1,
    ]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
}

function drawCube(matrix, color) {
  gl.uniform4fv(u_FragColor, color);
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}
