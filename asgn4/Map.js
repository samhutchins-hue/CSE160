let g_map = [];
for (let i = 0; i < 32; ++i) {
    g_map[i] = [];
    for (let j = 0; j < 32; ++j) {
        g_map[i][j] = 0;
    }
}

function generateMaze() {
    for (let i = 0; i < 32; ++i) {
        for (let j = 0; j < 32; ++j) {
            g_map[i][j] = 1 + Math.floor(Math.random() * 4);
        }
    }

    let visited = [];
    for (let i = 0; i < 32; ++i) {
        visited[i] = [];
        for (let j = 0; j < 32; ++j) {
            visited[i][j] = false;
        }
    }

    let dirs = [
        [0, 2],
        [2, 0],
        [0, -2],
        [-2, 0],
    ];

    g_map[1][1] = 0;
    visited[1][1] = true;

    let stack = [];
    stack.push([1, 1]);
    while (stack.length) {
        let top = stack[stack.length - 1];
        let x = top[0];
        let z = top[1];

        let cand = [];
        for (let d = 0; d < dirs.length; ++d) {
            let dx = dirs[d][0];
            let dz = dirs[d][1];
            let nx = x + dx;
            let nz = z + dz;
            if (
                nx >= 1 &&
                nx <= 30 &&
                nz >= 1 &&
                nz <= 30 &&
                !visited[nx][nz]
            ) {
                cand.push([dx, dz, nx, nz]);
            }
        }

        if (cand.length === 0) {
            stack.pop();
            continue;
        }

        let pick = cand[Math.floor(Math.random() * cand.length)];
        let dx = pick[0];
        let dz = pick[1];
        let nx = pick[2];
        let nz = pick[3];

        g_map[x + dx / 2][z + dz / 2] = 0;
        g_map[nx][nz] = 0;
        visited[nx][nz] = true;
        stack.push([nx, nz]);
    }

    for (let i = 0; i < 32; ++i) {
        g_map[i][0] = 4;
        g_map[i][30] = 4;
        g_map[i][31] = 4;
        g_map[0][i] = 4;
        g_map[30][i] = 4;
        g_map[31][i] = 4;
    }
}

let g_walls = [];
function initWalls() {
    for (let i = 0; i < 32; ++i) {
        for (let j = 0; j < 32; ++j) {
            const height = g_map[i][j];
            let texture;
            if (height === 1) {
                // cobblestone
                texture = 1;
            } else if (height === 4) {
                // mossy bricks
                texture = 3;
            } else {
                // bricks
                texture = 2;
            }
            for (let h = 0; h < height; ++h) {
                const w = new Matrix4().translate(i, h, j);
                g_walls.push({ matrix: w, texture: texture });
            }
        }
    }
}

function drawMap() {
    for (let i = 0; i < g_walls.length; ++i) {
        drawCube(g_walls[i].matrix, [1.0, 1.0, 1.0, 1.0], g_walls[i].texture);
    }
}
