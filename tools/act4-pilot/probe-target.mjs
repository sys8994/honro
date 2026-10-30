/** Keep a walk-through seam destination inside the receiving support.
 * A microprobe's first-contact X may be <1px beyond the seam; replaying it with
 * a movement deadband can stop a continuous body just before that seam.
 * This changes movement input only, never actor coordinates or colliders.
 */
export function transitionAim(surface, action, contactX) {
  if (action !== 'walk') return contactX;
  const lo=surface.top[0][0],hi=surface.top.at(-1)[0],inset=Math.min(35,(hi-lo)/3);
  return Math.max(lo+inset,Math.min(hi-inset,contactX));
}
