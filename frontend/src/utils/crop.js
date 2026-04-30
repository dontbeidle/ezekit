/**
 * Crop coordinate utilities.
 */

/**
 * Normalize a rectangle drawn in any direction to have positive width/height.
 */
export function normalizeRect(x, y, w, h) {
  return {
    x: w < 0 ? x + w : x,
    y: h < 0 ? y + h : y,
    width: Math.abs(w),
    height: Math.abs(h),
  };
}

/**
 * Check if a point (px, py) is inside a crop rect.
 */
export function pointInRect(px, py, crop) {
  return (
    px >= crop.x &&
    px <= crop.x + crop.width &&
    py >= crop.y &&
    py <= crop.y + crop.height
  );
}

/**
 * Get which resize handle (if any) is under a point.
 * Returns one of: 'nw', 'ne', 'sw', 'se', or null.
 */
export function getResizeHandle(px, py, crop, handleSize = 8) {
  const hs = handleSize;
  const corners = {
    nw: { x: crop.x, y: crop.y },
    ne: { x: crop.x + crop.width, y: crop.y },
    sw: { x: crop.x, y: crop.y + crop.height },
    se: { x: crop.x + crop.width, y: crop.y + crop.height },
  };
  for (const [key, corner] of Object.entries(corners)) {
    if (
      Math.abs(px - corner.x) <= hs &&
      Math.abs(py - corner.y) <= hs
    ) {
      return key;
    }
  }
  return null;
}

/**
 * Apply a resize handle drag to a crop rect.
 */
export function applyResize(crop, handle, dx, dy) {
  const c = { ...crop };
  switch (handle) {
    case "nw":
      c.x += dx;
      c.y += dy;
      c.width -= dx;
      c.height -= dy;
      break;
    case "ne":
      c.y += dy;
      c.width += dx;
      c.height -= dy;
      break;
    case "sw":
      c.x += dx;
      c.width -= dx;
      c.height += dy;
      break;
    case "se":
      c.width += dx;
      c.height += dy;
      break;
  }
  // Normalize if handle was dragged past the opposite edge
  if (c.width < 0) {
    c.x += c.width;
    c.width = -c.width;
  }
  if (c.height < 0) {
    c.y += c.height;
    c.height = -c.height;
  }
  // Enforce minimum size
  if (c.width < 10) c.width = 10;
  if (c.height < 10) c.height = 10;
  return c;
}
