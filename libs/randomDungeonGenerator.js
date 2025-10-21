/**
 * Генератор подземелья: случайное размещение комнат + MST коридоры + тупики.
 * @param {number} width
 * @param {number} height
 * @param {object} param - {
 *   roomWidth, roomHeight,
 *   biasExponent = 2,        // >1 — тянет к 3; 2 по умолчанию
 *   deadEndChance = 0.6,    // вероятность создания ветви для каждой комнаты (0..1)
 *   maxDeadEndLength = 6    // макс длина тупика
 *   doors = false           // нужны двери
 * }
 * @returns {{map: Array<Array<*>>, rooms: Array<Room>}}
 */
Dungeon.prototype.GENDUN = function(width, height, param) {
  const roomW = Math.max(3, Math.floor(param.roomWidth));
  const roomH = Math.max(3, Math.floor(param.roomHeight));
  const generateDoors = param.doors || false
  const biasExponent = (param.biasExponent && param.biasExponent > 0) ? param.biasExponent : 2;
  const deadEndChance = (typeof param.deadEndChance === 'number') ? Math.max(0, Math.min(1, param.deadEndChance)) : 0.6;
  const maxDeadEndLength = Math.max(1, Math.floor(param.maxDeadEndLength || 6));

  const availW = width - 2;
  const availH = height - 2;
  if (availW < roomW || availH < roomH) {
    throw new Error('Map too small for any room of given size.');
  }

  const gridCols = Math.floor(availW / roomW);
  const gridRows = Math.floor(availH / roomH);
  const maxRooms = Math.max(1, gridCols * gridRows);

  // Выбор N в диапазоне [3, maxRooms], с тяжестью к 3 (через степенную трансформацию)
  let N;
  if (maxRooms <= 3) N = maxRooms;
  else {
    const maxExtra = maxRooms - 3;
    const t = MYRANDOM.random(0,1);
    const k = Math.floor(Math.pow(t, biasExponent) * (maxExtra + 1)); // k in [0..maxExtra], biased to 0
    N = 3 + k;
  }

  // создать пустую карту
  const map = new Array(height);
  for (let y = 0; y < height; y++) {
    map[y] = new Array(width);
    for (let x = 0; x < width; x++) map[y][x] = TILES.empty;
  }

  const inBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;
  function fillRect(x, y, w, h, tile) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        if (inBounds(xx, yy)) map[yy][xx] = tile;
  }

  // рамка внешних стен
  for (let x = 0; x < width; x++) {
    map[0][x] = TILES.wall;
    map[height - 1][x] = TILES.wall;
  }
  for (let y = 0; y < height; y++) {
    map[y][0] = TILES.wall;
    map[y][width - 1] = TILES.wall;
  }

  // Вспомогательные функции для комнат и пересечений
  function rectsIntersect(a, b, padding = 0) {
    return !(a.x + a.w - 1 + padding < b.x ||
             b.x + b.w - 1 + padding < a.x ||
             a.y + a.h - 1 + padding < b.y ||
             b.y + b.h - 1 + padding < a.y);
  }
  function pointInRect(px, py, r) {
    return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
  }
  function roomCenter(r) {
    return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
  }

  const rooms = new Array(0);

  // -----------------------
  // Случайное размещение комнат (без слот-метода)
  // -----------------------
  let attempts = 0;
  const maxAttempts = Math.max(1000, N * 300); // если не получается — закончим
  while (rooms.length < N && attempts < maxAttempts) {
    attempts++;
    const rx = 1 + Math.floor(MYRANDOM.random() * (availW - roomW + 1));
    const ry = 1 + Math.floor(MYRANDOM.random() * (availH - roomH + 1));
        const r = { x: rx, y: ry, w: roomW, h: roomH };
    // не пересекаться с существующими (оставляем отступ padding = 1)
    let ok = true;
    for (const other of rooms) {
      if (rectsIntersect(r, other, 1)) { ok = false; break; }
    }
    if (!ok) continue;

    // разместить: периметр — стены, внутри — пол
    for (let yy = r.y; yy < r.y + r.h; yy++) {
      for (let xx = r.x; xx < r.x + r.w; xx++) {
        if (yy === r.y || yy === r.y + r.h - 1 || xx === r.x || xx === r.x + r.w - 1) {
          map[yy][xx] = TILES.wall;
        } else {
          map[yy][xx] = TILES.floor;
        }
      }
    }
    rooms.push(new Room(r.x, r.y, r.w, r.h));
  }

  // скорректируем N если не удалось разместить все
  if (rooms.length < N) N = rooms.length;

  // -----------------------
  // Коридоры: MST по центрам (ширина 1), двери на стенах
  // -----------------------
  if (rooms.length > 1) {
    const centers = rooms.map(r => roomCenter(r));
    const n = centers.length;
    const used = new Array(n).fill(false);
    const dist = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    used[0] = true;
    for (let i = 1; i < n; i++) {
      const dx = centers[i].x - centers[0].x;
      const dy = centers[i].y - centers[0].y;
      dist[i] = Math.hypot(dx, dy);
      parent[i] = 0;
    }
    const edges = [];
    for (let iter = 1; iter < n; iter++) {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < n; i++) if (!used[i] && dist[i] < bestD) { bestD = dist[i]; best = i; }
      if (best === -1) break;
      used[best] = true;
      edges.push([best, parent[best]]);
      for (let j = 0; j < n; j++) if (!used[j]) {
        const dx = centers[j].x - centers[best].x;
        const dy = centers[j].y - centers[best].y;
        const d = Math.hypot(dx, dy);
        if (d < dist[j]) { dist[j] = d; parent[j] = best; }
      }
    }

    function pickDoorOnWall(room, targetCenter) {
      const rc = roomCenter(room);
      const dx = targetCenter.x - rc.x;
      const dy = targetCenter.y - rc.y;
      let wall;
      if (Math.abs(dx) > Math.abs(dy)) {
        wall = dx > 0 ? 'right' : 'left';
      } else {
        wall = dy > 0 ? 'bottom' : 'top';
      }
      const candidates = [];
      if (wall === 'left') {
        const x = room.x;
        for (let yy = room.y + 1; yy < room.y + room.h - 1; yy++) candidates.push([x, yy]);
      } else if (wall === 'right') {
        const x = room.x + room.w - 1;
        for (let yy = room.y + 1; yy < room.y + room.h - 1; yy++) candidates.push([x, yy]);
      } else if (wall === 'top') {
        const y = room.y;
        for (let xx = room.x + 1; xx < room.x + room.w - 1; xx++) candidates.push([xx, y]);
      } else {
        const y = room.y + room.h - 1;
        for (let xx = room.x + 1; xx < room.x + room.w - 1; xx++) candidates.push([xx, y]);
      }
      if (candidates.length === 0) {
        for (let xx = room.x + 1; xx < room.x + room.w - 1; xx++) {
          candidates.push([xx, room.y]); candidates.push([xx, room.y + room.h - 1]);
        }
        for (let yy = room.y + 1; yy < room.y + room.h - 1; yy++) {
          candidates.push([room.x, yy]); candidates.push([room.x + room.w - 1, yy]);
        }
      }
      return candidates[Math.floor(MYRANDOM.random() * candidates.length)];
    }

    function carveDoor(room, wallX, wallY) {
      if (!generateDoors) {return}
      if (inBounds(wallX, wallY)) {
        map[wallY][wallX] = TILES.door_closed;
      }
      const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const d of neighbors) {
        const nx = wallX + d[0], ny = wallY + d[1];
        if (pointInRect(nx, ny, {x: room.x, y: room.y, w: room.w, h: room.h})) {
          if (inBounds(nx, ny)) map[ny][nx] = TILES.floor;
          break;
        }
      }
    }

    function carveCorridorPath(pathPoints) {
      for (const [x,y] of pathPoints) {
        if (!inBounds(x,y)) continue;
        // don't overwrite room interior or doors
        if (map[y][x] === TILES.floor || map[y][x] === TILES.door_closed) {
          // leave existing floor/door
        } else {          map[y][x] = TILES.floor;
        }
        // set walls in empty neighbors
        const adj = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const a of adj) {
          const nx = x + a[0], ny = y + a[1];
          if (!inBounds(nx,ny)) continue;
          if (map[ny][nx] === TILES.empty) {
            map[ny][nx] = TILES.wall;
          }
        }
      }
    }

    function buildLPath(x1, y1, x2, y2, option = 0) {
      const path = [];
      if (option === 0) {
        // horizontal then vertical
        const sx = Math.min(x1, x2), ex = Math.max(x1, x2);
        for (let x = sx; x <= ex; x++) path.push([x, y1]);
        for (let yy = Math.min(y1, y2); yy <= Math.max(y1, y2); yy++) path.push([x2, yy]);
      } else {
        // vertical then horizontal
        for (let yy = Math.min(y1,y2); yy <= Math.max(y1,y2); yy++) path.push([x1, yy]);
        for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++) path.push([x, y2]);
      }
      const seen = new Set();
      const res = [];
      for (const p of path) {
        const key = p[0] + ',' + p[1];
        if (!seen.has(key)) { seen.add(key); res.push(p); }
      }
      return res;
    }

    function pathIntersectsRoomInterior(path, roomA, roomB) {
      for (const [x,y] of path) {
        // allow wall cells of endpoints (doors), but not interior
        if (pointInRect(x,y, {x: roomA.x, y: roomA.y, w: roomA.w, h: roomA.h}) &&
            !(x === roomA.x || x === roomA.x + roomA.w - 1 || y === roomA.y || y === roomA.y + roomA.h - 1)) {
          return true;
        }
        if (pointInRect(x,y, {x: roomB.x, y: roomB.y, w: roomB.w, h: roomB.h}) &&
            !(x === roomB.x || x === roomB.x + roomB.w - 1 || y === roomB.y || y === roomB.y + roomB.h - 1)) {
          return true;
        }
        for (const other of rooms) {
          if (other === roomA || other === roomB) continue;
          if (pointInRect(x,y, other)) return true; // intersects other room (including walls) - avoid
        }
      }
      return false;
    }

    // соединяем ребра MST
    const corridorCells = []; // соберём координаты пола коридоров (для возможных ответвлений)
    for (const [u, v] of edges) {
      if (u < 0 || v < 0) continue;
      const A = rooms[u], B = rooms[v];
      const cA = roomCenter(A), cB = roomCenter(B);
      const doorA = pickDoorOnWall(A, cB);
      const doorB = pickDoorOnWall(B, cA);
      
      if (generateDoors) {
      carveDoor(A, doorA[0], doorA[1]);
      carveDoor(B, doorB[0], doorB[1]);
      }

      let path = buildLPath(doorA[0], doorA[1], doorB[0], doorB[1], 0);
      if (pathIntersectsRoomInterior(path, A, B)) {
        path = buildLPath(doorA[0], doorA[1], doorB[0], doorB[1], 1);
        if (pathIntersectsRoomInterior(path, A, B)) {
          let found = false;
          const rangeX = [Math.min(doorA[0], doorB[0]), Math.max(doorA[0], doorB[0])];
          const rangeY = [Math.min(doorA[1], doorB[1]), Math.max(doorA[1], doorB[1])];
          for (let attempt = 0; attempt < 12 && !found; attempt++) {
            const px = rangeX[0] + Math.floor(MYRANDOM.random() * (rangeX[1] - rangeX[0] + 1));
            const py = rangeY[0] + Math.floor(MYRANDOM.random() * (rangeY[1] - rangeY[0] + 1));
            const p1 = buildLPath(doorA[0], doorA[1], px, py, 0);
            const p2 = buildLPath(px, py, doorB[0], doorB[1], 0);
            const combined = p1.concat(p2);
            if (!pathIntersectsRoomInterior(combined, A, B)) {
              path = combined;
              found = true;
            }
          }
          if (!found) {
            path = buildLPath(doorA[0], doorA[1], doorB[0], doorB[1], 0);
          }
        }
      }
      carveCorridorPath(path);
      for (const p of path) corridorCells.push(p);
    }

    // -----------------------
    // Добавление тупиковых коридоров (ответвления от стен комнат)
    // -----------------------
    for (const room of rooms) {
      if (MYRANDOM.random() > deadEndChance) continue;
      // выбрать стену и позицию на ней
      const sides = ['left','right','top','bottom'];
            const side = sides[Math.floor(MYRANDOM.random() * sides.length)];
      let candidates = [];
      if (side === 'left') {
        const x = room.x;
        for (let yy = room.y + 1; yy < room.y + room.h - 1; yy++) candidates.push([x, yy, -1, 0]);
      } else if (side === 'right') {
        const x = room.x + room.w - 1;
        for (let yy = room.y + 1; yy < room.y + room.h - 1; yy++) candidates.push([x, yy, 1, 0]);
      } else if (side === 'top') {
        const y = room.y;
        for (let xx = room.x + 1; xx < room.x + room.w - 1; xx++) candidates.push([xx, y, 0, -1]);
      } else {
        const y = room.y + room.h - 1;
        for (let xx = room.x + 1; xx < room.x + room.w - 1; xx++) candidates.push([xx, y, 0, 1]);
      }
      if (candidates.length === 0) continue;
      const idx = Math.floor(MYRANDOM.random() * candidates.length);
      const [wx, wy, dx, dy] = candidates[idx];
      // создать дверь
      if (carveDoor) {
      carveDoor(room, wx, wy);
      }

      // расширять коридор прямо наружу от стены, длина случайная
      const length = 1 + Math.floor(MYRANDOM.random() * maxDeadEndLength);
      let path = [];
      let cx = wx + dx, cy = wy + dy; // первый клетка за дверью
      let ok = true;
      for (let l = 0; l < length; l++) {
        if (!inBounds(cx, cy)) { ok = false; break; }
        // если в клетке уже что-то непустое (например, комната/коридор) — прекращаем (не соединяем чтобы сохранить тупик)
        if (map[cy][cx] === TILES.floor || pointInRect(cx, cy, room) || map[cy][cx] === TILES.door_closed) {
          ok = false; break;
        }
        path.push([cx, cy]);
        cx += dx; cy += dy;
      }
      if (path.length > 0) {
        carveCorridorPath(path);
      }
    }

    // Также можно добавить случайные короткие ответвления от самих коридорных клеток (необязательно).
    // Пример: для части corridorCells с небольшой вероятностью сделать боковой тупик.
    const extraBranchProb = 0.08; // вероятность на каждую коридорную клетку
    for (const [cx, cy] of corridorCells) {
      if (MYRANDOM.random() > extraBranchProb) continue;
      // выбрать направление, но избежать направления, где уже пол/комната
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      // перемешаем
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(MYRANDOM.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
      for (const [dx,dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (!inBounds(nx,ny)) continue;
        if (map[ny][nx] !== TILES.empty) continue; // не начинать там, где что-то уже есть
        // длина тупика маленькая
        const len = 1 + Math.floor(MYRANDOM.random() * Math.min(4, maxDeadEndLength));
        let path = [];
        let tx = nx, ty = ny;
        let collision = false;
        for (let l = 0; l < len; l++) {
          if (!inBounds(tx,ty)) { collision = true; break; }
          if (map[ty][tx] !== TILES.empty) { collision = true; break; }
          path.push([tx, ty]);
          tx += dx; ty += dy;
        }
        if (!collision && path.length > 0) {
          carveCorridorPath(path);
        }
        break; // для данной коридорной клетки только одно ответвление
      }
    }
  }

  /**
   * Test Tiles
   
   
  let room = new Room(5,5,5,5)
  console.log("Room Class Test", room.getCenter())
  
  console.log("Map Array Test", map[0][0].ch)
  console.log("Rooms Array Test", rooms[0].x)
  
  
  console.log("Отпраляем ",map[0])
  */
  
  this.map = map
  this.rooms = rooms
}

Dungeon.prototype.GENCAVE = // Пример метода класса Dungeon
// Использование: this.generateCave(width, height, { spagetti: 1.2, fat: 1.0, seed: 12345 })
Dungeon.prototype.generateCave = function(width, height, param = {}) {
  width = Math.max(5, Math.floor(width));
  height = Math.max(5, Math.floor(height));

  // Параметры и тайлы (подставьте ваши значения, если нужно)
  const TILE_WALL  = (param.tiles && param.tiles.wall  !== undefined) ? param.tiles.wall  : 1;
  const TILE_FLOOR = (param.tiles && param.tiles.floor !== undefined) ? param.tiles.floor : 0;

  const fat = Math.max(0.5, (param.fat !== undefined) ? param.fat : 1.0);      // толщина проходов базовая
  const spagetti = Math.max(0.0, (param.spagetti !== undefined) ? param.spagetti : 1.0); // количество ветвей
  const seed = (param.seed !== undefined) ? (param.seed|0) : null;

  // RNG (seeded если задан seed)
  function makeSeededRNG(s) {
    let st = (s >>> 0) || 1;
    return function() { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967295; };
  }
  const RNG = seed !== null ? makeSeededRNG(seed) : MYRANDOM.random;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inside = (x, y) => x >= 1 && x < width - 1 && y >= 1 && y < height - 1;

  // Инициализация карты (в стенах)
  const map = Array.from({length: height}, () => Array.from({length: width}, () => TILE_WALL));

  // Value-noise + fBM (для плавных поворотов)
  function intHash(i, j, seedOffset = 0) {
    let n = (i + seedOffset) * 374761393 + (j + seedOffset) * 668265263;
    n = (n ^ (n >>> 13)) >>> 0;
    n = (n * 1274126177) >>> 0;
    return n / 4294967295;
  }
  function smoothstep(t){ return t * t * (3 - 2 * t); }
  function lerp(a,b,t){ return a + (b-a) * t; }

  function valueNoise2(x, y, scale = 1.0) {
    const sx = Math.floor(x * scale);
    const sy = Math.floor(y * scale);
    const fx = x * scale - sx;
    const fy = y * scale - sy;
    const a = intHash(sx,   sy,   1009);
    const b = intHash(sx+1, sy,   1009);
    const c = intHash(sx,   sy+1, 1009);
    const d = intHash(sx+1, sy+1, 1009);
    const ux = smoothstep(fx);
    const uy = smoothstep(fy);
    const ab = lerp(a,b,ux);
    const cd = lerp(c,d,ux);
    return lerp(ab,cd,uy) * 2 - 1; // [-1,1]
  }
  function fbm2(x, y, oct = 3, lac = 2.0, gain = 0.5, baseScale = 0.05) {
    let amp = 1, freq = baseScale, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * valueNoise2(x * freq, y * freq, 1.0);
      norm += amp;
      amp *= gain;
      freq *= lac;
    }
    return sum / Math.max(1e-9, norm);
  }

  // Параметры «червячков/ветвей»
  const baseRadius = clamp(1.6 * fat, 1.6, Math.max(1.6, Math.min(8, fat * 3))); // радиус в клетках (float)
  const minRadius = Math.max(1.6, baseRadius * 0.9);
  const maxRadius = Math.max(minRadius, baseRadius * 1.6);

  // Целевая заполняемость: зависит от spagetti (чем больше spagetti — тем плотнее)
  const targetCoverage = clamp(0.7 + 0.18 * clamp(spagetti, 0, 3), 0.55, 0.95);

  // Функция вырезания круга (использует float-координаты, избегая округлений)
  function carveCircle(cx, cy, radius) {
    const r = Math.ceil(radius);
    const x0 = Math.max(1, Math.floor(cx - r));
    const x1 = Math.min(width - 2, Math.ceil(cx + r));
    const y0 = Math.max(1, Math.floor(cy - r));
    const y1 = Math.min(height - 2, Math.ceil(cy + r));
    const rr = radius * radius;
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const dx = (xx + 0.5) - cx;
                const dy = (yy + 0.5) - cy;
        if (dx*dx + dy*dy <= rr) {
          map[yy][xx] = TILE_FLOOR;
        }
      }
    }
  }

  // Подсчёт покрытия (внутренняя область без рамки)
  function computeCoverage() {
    let floor = 0;
    for (let y = 1; y < height-1; y++) {
      for (let x = 1; x < width-1; x++) {
        if (map[y][x] === TILE_FLOOR) floor++;
      }
    }
    const total = (width - 2) * (height - 2);
    return floor / Math.max(1, total);
  }

  // Начнём с центрального ствола
  const seeds = [];
  // центр с небольшим рандомом
  seeds.push({
    x: width / 2 + (RNG() - 0.5) * Math.max(2, Math.min(width*0.1, 6)),
    y: height / 2 + (RNG() - 0.5) * Math.max(2, Math.min(height*0.1, 6)),
    ang: RNG() * Math.PI * 2,
    length: Math.round((Math.max(width, height) * (0.9 + 0.4 * spagetti))),
    radius: baseRadius
  });

  // Контроль итераций, чтобы не зависнуть
  const maxTotalSteps = Math.max(500, width * height * 2);
  let totalSteps = 0;
  let attemptsWithoutGrowth = 0;

  // Очередь ветвей (breadth-first-ish, чтобы охватить пространство)
  while ((computeCoverage() < targetCoverage && totalSteps < maxTotalSteps) || seeds.length > 0 && totalSteps < maxTotalSteps) {
    if (seeds.length === 0) break;
    const w = seeds.shift();
    let steps = 0;
    const maxStepsForThis = Math.max(10, Math.round(w.length));
    let lastCarveCount = 0;

    while (steps < maxStepsForThis && totalSteps < maxTotalSteps) {
      totalSteps++;
      steps++;

      // плавный шум для поворота и радиуса
      const nAng = fbm2(w.x * 0.06, w.y * 0.06, 3, 2.0, 0.55, 0.05); // [-1,1]
      const nRad = fbm2((w.x + 999.1) * 0.08, (w.y + 999.1) * 0.08, 2, 2.0, 0.6, 0.07);

      // поворот — небольшая дельта, управляемая spagetti
      const turn = (0.6 + 0.6 * clamp(spagetti, 0, 3));
      w.ang += nAng * 0.9 * (1 / (1 + steps * 0.003)) * turn;

      // радиус плавно меняется, но не меньше minRadius
      const radius = clamp(w.radius * (1 + 0.45 * nRad), minRadius, maxRadius);

      // карвим круг
      carveCircle(w.x, w.y, radius);

      // шаг вперёд — небольшой, чтобы не оставалось дыр
      const stepLen = clamp(radius * (0.55 + 0.25 * Math.abs(nAng)), 0.8, Math.max(1.0, radius * 0.9));
      w.x += Math.cos(w.ang) * stepLen;
      w.y += Math.sin(w.ang) * stepLen;

      // удержание в пределах карты (немного внутри границы)
      w.x = clamp(w.x, 1 + 0.6, width - 2 - 0.6);
      w.y = clamp(w.y, 1 + 0.6, height - 2 - 0.6);

      // иногда создаём дочерние ветви (зависят от spagetti)
      const branchBase = clamp(0.02 + 0.02 * spagetti, 0.01, 0.3);
      if (RNG() < branchBase) {
        const branchAng = w.ang + (RNG() - 0.5) * Math.PI * (0.6 + 0.6 * spagetti);
        const branchLen = Math.round(Math.max(6, w.length * (0.15 + 0.7 * RNG())));
        const branchRadius = clamp(radius * (0.7 + 0.6 * (RNG() - 0.5)), minRadius, maxRadius);
        seeds.push({
          x: w.x,
          y: w.y,
          ang: branchAng,
          length: branchLen,
          radius: branchRadius
        });
      }

      // небольшая вероятность «разветвления» более крупного размера, если покрытие мало
      if (computeCoverage() < targetCoverage && RNG() < 0.015 * (1 + spagetti)) {
        seeds.push({
          x: w.x + (RNG() - 0.5) * 2,
          y: w.y + (RNG() - 0.5) * 2,
          ang: RNG() * Math.PI * 2,
          length: Math.round((Math.max(width, height) * (0.2 + 0.6 * spagetti)) * (0.5 + RNG())),
          radius: clamp(radius * (0.9 + 0.6 * RNG()), minRadius, maxRadius)
        });
      }

      // если слишком много шагов без реального расширения — выйдем из цикла этой ветви
      steps++;
      // safety: если шаги > huge -> break
      if (steps > maxStepsForThis * 3) break;
    }

    // safety: предохранитель против бесконечного расширения
    attemptsWithoutGrowth++;
    if (attemptsWithoutGrowth > maxTotalSteps) break;
  }

  // Гарантируем рамку стен
  for (let x = 0; x < width; x++) { map[0][x] = TILE_WALL; map[height-1][x] = TILE_WALL; }
    for (let y = 0; y < height; y++) { map[y][0] = TILE_WALL; map[y][width-1] = TILE_WALL; }

  // При желании можно выполнить постобработку (убрать "одиночные" стены в середине пещеры),
  // но по умолчанию возвращаем как есть — плотно заполненную сеть туннелей.
  this.map = map;
  //return map;
};

Dungeon.prototype.GENARENA = function(width, height, param) {
  param = (param) ? param : {}
  param.tiles = (param.tiles) ? param.tiles : {
    floor: TILES.floor,
    wall: TILES.wall,
    empty: TILES.empty
  }
  const radius = (param.radius) ? param.radius : 5
  const center = [Math.floor(this.width / 2), Math.floor(this.height / 2)]
  tiles = {}
  tiles.floor = (param.tiles.floor) ? param.tiles.floor : TILES.floor
  tiles.wall = (param.tiles.wall) ? param.tiles.wall : TILES.wall
  tiles.empty = (param.tiles.empty) ? param.tiles.empty : TILES.empty
  
  let mmap = new Array(this.height)
  let rooms = new Array(0)
  for (let y = 0; y < this.height; y++) {
    mmap[y] = new Array(this.width)
    for (let x = 0; x < this.width; x++) {
      if (Math.floor(Math.sqrt((x - center[0])**2 + (y - center[1])**2)) == radius || Math.ceil(Math.sqrt((x - center[0])**2 + (y - center[1])**2)) == radius) {
        mmap[y][x] = tiles.wall
      }else if (Math.floor(Math.sqrt((x - center[0])**2 + (y - center[1])**2)) < radius) {
        mmap[y][x] = tiles.floor
      }else {
        mmap[y][x] = tiles.empty
      }
    }
  }
  rooms.push(new Room(center[0] - radius, center[1] - radius, radius * 2 + 1, radius * 2 + 1))
  
  //console.log("Center", center[0], center[1])
  for (let y = center[1]-2; y <= center[1]+2; y++) {
    for (let x = center[0] - radius - 5; x <= center[0] - radius; x++) {
      if (x === center[0] - radius - 5 || x === center[0] - radius || y === center[1] -2 || y === center[1] + 2) {
        mmap[y][x] = tiles.wall
      } else {
        mmap[y][x] = tiles.floor
      }
    }
  }
  mmap[center[1]][center[0] - radius] = tiles.floor
  rooms.push(new Room(center[0] - radius - 5, center[1] - 2, 5, 5))
  
  for (let y = center[1]-2; y <= center[1]+2; y++) {
    for (let x = center[0] + radius; x <= center[0] + radius + 5; x++) {
      if (x === center[0] + radius + 5 || x === center[0] + radius || y === center[1] -2 || y === center[1] + 2) {
        mmap[y][x] = tiles.wall
      } else {
        mmap[y][x] = tiles.floor
      }
    }
  }
  mmap[center[1]][center[0] + radius] = tiles.floor
  rooms.push(new Room(center[0] + radius, center[1] - 2, 5, 5))
  
  
  this.map = mmap
  this.rooms = rooms
}