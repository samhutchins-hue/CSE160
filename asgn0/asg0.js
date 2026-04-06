let ctx;
let canvas;

let centerCanvas = 200;
let scale = 20;

// draw a vector to the screen
function drawVector(v, color) {
  const x = v.elements[0];
  const y = v.elements[1];

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(centerCanvas, centerCanvas);

  const xFinal = centerCanvas + x * scale;
  const yFinal = centerCanvas - y * scale;

  ctx.lineTo(xFinal, yFinal);
  ctx.stroke();
}

function areaTriangle(v1, v2) {
  return Vector3.cross(v1, v2).magnitude() / 2;
}

function angleBetween(v1, v2) {
  const d = Vector3.dot(v1, v2);
  const angle = Math.acos(d / (v1.magnitude() * v2.magnitude()));
  return (angle * 180) / Math.PI;
}

function handleDrawOperationEvent() {
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const v1x = parseFloat(document.getElementById("v1.x").value);
  const v1y = parseFloat(document.getElementById("v1.y").value);
  const v1 = new Vector3([v1x, v1y, 0]);
  drawVector(v1, "red");

  const v2x = parseFloat(document.getElementById("v2.x").value);
  const v2y = parseFloat(document.getElementById("v2.y").value);
  const v2 = new Vector3([v2x, v2y, 0]);
  drawVector(v2, "blue");

  const operation = document.getElementById("operation-select").value;
  const scalar = parseFloat(document.getElementById("scalar").value);

  if (operation === "add") {
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (operation === "sub") {
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (operation === "mul") {
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.mul(scalar);
    drawVector(v3, "green");
    const v4 = new Vector3([v2x, v2y, 0]);
    v4.mul(scalar);
    drawVector(v4, "green");
  } else if (operation === "div") {
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.div(scalar);
    drawVector(v3, "green");
    const v4 = new Vector3([v2x, v2y, 0]);
    v4.div(scalar);
    drawVector(v4, "green");
  } else if (operation === "magnitude") {
    console.log("v1 magnitude:", v1.magnitude());
    console.log("v2 magnitude:", v2.magnitude());
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.normalize();
    drawVector(v3, "green");
    const v4 = new Vector3([v2x, v2y, 0]);
    v4.normalize();
    drawVector(v4, "green");
  } else if (operation === "normalize") {
    console.log("v1 magnitude:", v1.magnitude());
    console.log("v2 magnitude:", v2.magnitude());
    const v3 = new Vector3([v1x, v1y, 0]);
    v3.normalize();
    drawVector(v3, "green");
    const v4 = new Vector3([v2x, v2y, 0]);
    v4.normalize();
    drawVector(v4, "green");
  } else if (operation === "angleBetween") {
    console.log("angle:", angleBetween(v1, v2));
  } else if (operation === "area") {
    console.log("area:", areaTriangle(v1, v2));
  }
}

function handleDrawEvent() {
  // clear canvas by drawing black rectangle with canvas dimensions
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const v1x = parseFloat(document.getElementById("v1.x").value);
  const v1y = parseFloat(document.getElementById("v1.y").value);
  const v1 = new Vector3([v1x, v1y, 0]);
  drawVector(v1, "red");

  const v2x = parseFloat(document.getElementById("v2.x").value);
  const v2y = parseFloat(document.getElementById("v2.y").value);
  const v2 = new Vector3([v2x, v2y, 0]);
  drawVector(v2, "blue");
}

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return false;
  }

  ctx = canvas.getContext("2d");

  // draw the black canvas
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
