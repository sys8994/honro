// Combat coordinates have the same isotropic unit on both ground axes.
// The camera alone foreshortens the ground. A sprite's height is presentation.
export function groundProjection(cell, tileWidth, tileHeight) {
  if (![cell, tileWidth, tileHeight].every(n => Number.isFinite(n) && n > 0)) {
    throw new RangeError('Invalid ground projection');
  }
  const horizontal = tileWidth / cell, vertical = tileHeight / cell;
  return {
    forward(x, y) { return {x:x*horizontal,y:y*vertical}; },
    inverse(x, y) { return {x:x/horizontal,y:y/vertical}; }
  };
}

// The center is in projected map units. Wide/tall screens increase the minimum
// zoom until their entire CSS viewport fits inside the authored rectangle.
export const defaultZoom = 1.70;
export const preciseTurnRate = Math.PI * .22;
export function cameraView(mapWidth,mapHeight,width,height,wanted,x,y){
  const min=Math.max(defaultZoom*.70,width/mapWidth,height/mapHeight),max=Math.max(defaultZoom*1.50,min);
  const zoom=Math.min(max,Math.max(min,wanted)),halfX=width/(2*zoom),halfY=height/(2*zoom);
  return {zoom,min,max,x:Math.max(halfX,Math.min(mapWidth-halfX,x)),y:Math.max(halfY,Math.min(mapHeight-halfY,y))};
}

export function direction(dx, dy) {
  const length = Math.hypot(dx, dy);
  return length > 0 ? {x: dx / length, y: dy / length} : {x: 0, y: 0};
}

// Time and normal of first entry by a swept disc. Origins on an edge may leave it.
export function sweepDisc(a, z, center, radius) {
  const dx = z.x - a.x, dy = z.y - a.y;
  const ox = a.x - center.x, oy = a.y - center.y;
  const length2 = dx * dx + dy * dy, dot = ox * dx + oy * dy;
  if (!length2 || dot >= 0) return null;
  const c = ox * ox + oy * oy - radius * radius;
  const determinant = dot * dot - length2 * c;
  if (determinant < 0) return null;
  const t = c <= 0 ? 0 : (-dot - Math.sqrt(determinant)) / length2;
  if (t < 0 || t > 1) return null;
  const x = a.x + t * dx, y = a.y + t * dy;
  return {x, y, t, n: direction(x - center.x, y - center.y)};
}

// Sweep a disc against a tile or a box. Corners are rounded by the disc radius.
export function sweepBox(a, z, box, radius) {
  const dx = z.x - a.x, dy = z.y - a.y, x1 = box.x, y1 = box.y;
  const x2 = x1 + box.w, y2 = y1 + box.h;
  let best = null;
  const add = hit => { if (hit && (!best || hit.t < best.t)) best = hit; };
  function face(t, normalX, normalY, horizontal) {
    if (t < 0 || t > 1) return;
    const x = a.x + dx * t, y = a.y + dy * t;
    if (horizontal ? x >= x1 && x <= x2 : y >= y1 && y <= y2) add({x, y, t, n: {x: normalX, y: normalY}});
  }
  if (dx > 0) face((x1 - radius - a.x) / dx, -1, 0, false);
  if (dx < 0) face((x2 + radius - a.x) / dx, 1, 0, false);
  if (dy > 0) face((y1 - radius - a.y) / dy, 0, -1, true);
  if (dy < 0) face((y2 + radius - a.y) / dy, 0, 1, true);
  for (const x of [x1, x2]) for (const y of [y1, y2]) add(sweepDisc(a, z, {x, y}, radius));
  return best;
}

export function slide(start, dx, dy, contact) {
  let {x, y} = start;
  for (let i = 0; i < 3 && Math.hypot(dx, dy) > .001; i++) {
    const target = {x: x + dx, y: y + dy}, hit = contact({x, y}, target);
    if (!hit) return target;
    x = hit.x + hit.n.x * .015; y = hit.y + hit.n.y * .015;
    const left = 1 - hit.t, inward = Math.min(0, dx * hit.n.x + dy * hit.n.y);
    dx = (dx - inward * hit.n.x) * left;
    dy = (dy - inward * hit.n.y) * left;
  }
  return {x, y};
}

// Rotate in the view the player sees; projection foreshortens the ground axes.
export function steerHeading(current, desired, projection, limit) {
  const a=projection.forward(current.x,current.y), b=projection.forward(desired.x,desired.y);
  const from=Math.atan2(a.y,a.x), to=Math.atan2(b.y,b.x);
  const diff=Math.atan2(Math.sin(to-from),Math.cos(to-from));
  const angle=from+Math.max(-limit,Math.min(limit,diff));
  const v=projection.inverse(Math.cos(angle),Math.sin(angle));
  return direction(v.x,v.y);
}
