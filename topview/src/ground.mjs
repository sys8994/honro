// Material compositor inherited from the original asset lab.
export function buildGround(map, sourceFor) {
    const ground = document.createElement('canvas'); ground.width = map.width*map.tileWidth; ground.height=map.height*map.tileHeight;
    const g = ground.getContext('2d'); g.imageSmoothingEnabled = true;
    // The reusable source material is sampled in world coordinates. The same
    // semantic cell map still owns geography; masks only soften material joins.
    const materialIds = [...new Set(map.terrain)];

    if (materialIds.every(id => sourceFor(id))) {
      const resolution = 32;
      const makePlane = () => { const c = document.createElement('canvas'); c.width = map.width * resolution; c.height = map.height * resolution; return c; };
      const plane = makePlane(), pc = plane.getContext('2d');
      const patterns = new Map();
      for (const id of materialIds) {
        const patternTile = document.createElement('canvas');
        patternTile.width = patternTile.height = resolution * 8;
        patternTile.getContext('2d').drawImage(sourceFor(id), 0, 0, patternTile.width, patternTile.height);
        patterns.set(id, pc.createPattern(patternTile, 'repeat'));
      }
      const baseId = patterns.has('dirt') ? 'dirt' : materialIds.find(id => id !== 'water');
      pc.fillStyle = patterns.get(baseId); pc.fillRect(0, 0, plane.width, plane.height);
      for (const id of materialIds.filter(item => item !== baseId && item !== 'water')) {
        const mask = makePlane(), mc = mask.getContext('2d'); mc.fillStyle = '#fff';
        for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (map.terrain[y * map.width + x] === id) mc.fillRect(x * resolution, y * resolution, resolution, resolution);
        const layer = makePlane(), lc = layer.getContext('2d');
        lc.filter = `blur(${resolution * .15}px)`; lc.drawImage(mask, 0, 0); lc.filter = 'none';
        lc.globalCompositeOperation = 'source-in'; lc.fillStyle = patterns.get(id); lc.fillRect(0, 0, layer.width, layer.height);
        pc.drawImage(layer, 0, 0);
      }
      if (patterns.has('water')) {
        const waterMask = makePlane(), wc = waterMask.getContext('2d');
        const isWater = (x, y) => x >= 0 && y >= 0 && x < map.width && y < map.height && map.terrain[y * map.width + x] === 'water';
        const edges = new Map();
        const key = (x, y) => `${x},${y}`;
        const add = (ax, ay, bx, by) => { const k = key(ax, ay); if (!edges.has(k)) edges.set(k, []); edges.get(k).push({ x: bx, y: by }); };
        for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (isWater(x, y)) {
          if (!isWater(x, y - 1)) add(x, y, x + 1, y);
          if (!isWater(x + 1, y)) add(x + 1, y, x + 1, y + 1);
          if (!isWater(x, y + 1)) add(x + 1, y + 1, x, y + 1);
          if (!isWater(x - 1, y)) add(x, y + 1, x, y);
        }
        wc.beginPath();
        while (edges.size) {
          const firstKey = edges.keys().next().value, [x, y] = firstKey.split(',').map(Number);
          const loop = [{ x, y }]; let at = firstKey, guard = map.width * map.height * 4 + 1;
          do {
            const outgoing = edges.get(at); if (!outgoing?.length) break;
            const next = outgoing.pop(); if (!outgoing.length) edges.delete(at);
            at = key(next.x, next.y); if (at !== firstKey) loop.push(next);
          } while (at !== firstKey && guard-- > 0);
          if (loop.length < 3) continue;
          // Round only local corners, by less than a fifth of one semantic cell.
          // Collision remains the authoritative tile map and is inspectable.
          const r = .18;
          loop.forEach((point, i) => {
            const previous = loop[(i + loop.length - 1) % loop.length], next = loop[(i + 1) % loop.length];
            const before = { x: point.x + (previous.x - point.x) * r, y: point.y + (previous.y - point.y) * r };
            const after = { x: point.x + (next.x - point.x) * r, y: point.y + (next.y - point.y) * r };
            if (i === 0) wc.moveTo(before.x * resolution, before.y * resolution); else wc.lineTo(before.x * resolution, before.y * resolution);
            wc.quadraticCurveTo(point.x * resolution, point.y * resolution, after.x * resolution, after.y * resolution);
          });
          wc.closePath();
        }
        wc.fillStyle = '#fff'; wc.fill('nonzero');
        const bank = makePlane(), bc = bank.getContext('2d');
        bc.filter = `blur(${resolution * .17}px)`; bc.drawImage(waterMask, 0, 0); bc.filter = 'none';
        bc.globalCompositeOperation = 'source-in'; bc.fillStyle = patterns.get('rock') || patterns.get(baseId); bc.fillRect(0, 0, bank.width, bank.height);
        pc.save(); pc.globalAlpha = .88; pc.drawImage(bank, 0, 0); pc.restore();
        const water = makePlane(), waterContext = water.getContext('2d');
        waterContext.filter = 'blur(1px)'; waterContext.drawImage(waterMask, 0, 0); waterContext.filter = 'none';
        waterContext.globalCompositeOperation = 'source-in'; waterContext.fillStyle = patterns.get('water'); waterContext.fillRect(0, 0, water.width, water.height);
        pc.drawImage(water, 0, 0);
      }
      g.drawImage(plane,0,0,ground.width,ground.height);
      return ground;
    }
    throw Error('지형 재질을 불러오지 못했습니다');
}
