import { useRef, useState, useCallback, useEffect } from "react";
import { normalizeRect, pointInRect, getResizeHandle, applyResize } from "../utils/crop";

/**
 * Canvas-based crop overlay for drawing, moving, and resizing crop rectangles.
 */
export default function CropOverlay({
  imageRef,
  crops,
  selectedCropId,
  onCropCreated,
  onCropUpdated,
  onCropSelect,
}) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(null); // { startX, startY, currentX, currentY }
  const [dragging, setDragging] = useState(null); // { cropId, startX, startY, origCrop }
  const [resizing, setResizing] = useState(null); // { cropId, handle, startX, startY, origCrop }

  // Get the image's natural dimensions (original pixel size)
  function getImageNaturalSize() {
    const img = imageRef.current;
    if (!img) return { width: 1, height: 1 };
    return { width: img.naturalWidth, height: img.naturalHeight };
  }

  // Draw crops on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync canvas internal resolution with image natural size
    const { width: natW, height: natH } = getImageNaturalSize();
    if (canvas.width !== natW) canvas.width = natW;
    if (canvas.height !== natH) canvas.height = natH;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing crops
    for (const crop of crops) {
      const isSelected = crop.id === selectedCropId;
      const hasText = crop.text && crop.text.trim();

      // Unannotated crops (empty text) get orange dashed style
      if (!hasText && !isSelected) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(245, 158, 11, 0.06)";
        ctx.setLineDash([4, 3]);
      } else {
        ctx.strokeStyle = isSelected ? "#818cf8" : "#6366f1";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.fillStyle = isSelected
          ? "rgba(129, 140, 248, 0.12)"
          : "rgba(99, 102, 241, 0.08)";
        ctx.setLineDash([]);
      }

      ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
      ctx.setLineDash([]);

      // Draw order label
      const idx = crops.indexOf(crop);
      ctx.fillStyle = !hasText && !isSelected ? "#f59e0b" : (isSelected ? "#818cf8" : "#6366f1");
      ctx.font = "bold 11px system-ui";
      ctx.fillText(`${idx + 1}`, crop.x + 4, crop.y + 13);

      // Draw resize handles for selected crop
      if (isSelected) {
        const hs = 6;
        ctx.fillStyle = "#818cf8";
        const corners = [
          [crop.x, crop.y],
          [crop.x + crop.width, crop.y],
          [crop.x, crop.y + crop.height],
          [crop.x + crop.width, crop.y + crop.height],
        ];
        for (const [cx, cy] of corners) {
          ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
        }
      }
    }

    // Draw current drawing rectangle
    if (drawing) {
      const rect = normalizeRect(
        drawing.startX,
        drawing.startY,
        drawing.currentX - drawing.startX,
        drawing.currentY - drawing.startY
      );
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.setLineDash([]);
    }
  }, [crops, selectedCropId, drawing]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Convert mouse event to original image pixel coordinates
  function getPos(e) {
    const img = imageRef.current;
    if (!img) return { x: 0, y: 0 };
    const imgRect = img.getBoundingClientRect();
    // Scale from CSS display pixels to original image pixels
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    return {
      x: (e.clientX - imgRect.left) * scaleX,
      y: (e.clientY - imgRect.top) * scaleY,
    };
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    const pos = getPos(e);

    // Check if clicking on a resize handle of the selected crop
    if (selectedCropId) {
      const sel = crops.find((c) => c.id === selectedCropId);
      if (sel) {
        const handle = getResizeHandle(pos.x, pos.y, sel);
        if (handle) {
          setResizing({
            cropId: sel.id,
            handle,
            startX: pos.x,
            startY: pos.y,
            origCrop: { ...sel },
          });
          return;
        }
      }
    }

    // Check if clicking on an existing crop (to select/move)
    for (let i = crops.length - 1; i >= 0; i--) {
      if (pointInRect(pos.x, pos.y, crops[i])) {
        onCropSelect(crops[i].id);
        setDragging({
          cropId: crops[i].id,
          startX: pos.x,
          startY: pos.y,
          origCrop: { ...crops[i] },
        });
        return;
      }
    }

    // Start drawing a new crop
    onCropSelect(null);
    setDrawing({
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  }

  function handleMouseMove(e) {
    const pos = getPos(e);
    const { width: natW, height: natH } = getImageNaturalSize();

    if (drawing) {
      setDrawing((prev) => ({
        ...prev,
        currentX: Math.max(0, Math.min(natW, pos.x)),
        currentY: Math.max(0, Math.min(natH, pos.y)),
      }));
    } else if (dragging) {
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;
      const newX = Math.max(
        0,
        Math.min(natW - dragging.origCrop.width, dragging.origCrop.x + dx)
      );
      const newY = Math.max(
        0,
        Math.min(
          natH - dragging.origCrop.height,
          dragging.origCrop.y + dy
        )
      );
      onCropUpdated(dragging.cropId, { x: newX, y: newY });
    } else if (resizing) {
      const dx = pos.x - resizing.startX;
      const dy = pos.y - resizing.startY;
      const updated = applyResize(resizing.origCrop, resizing.handle, dx, dy);
      onCropUpdated(resizing.cropId, {
        x: updated.x,
        y: updated.y,
        width: updated.width,
        height: updated.height,
      });
    } else {
      // Update cursor based on what's under the mouse
      const canvas = canvasRef.current;
      if (selectedCropId) {
        const sel = crops.find((c) => c.id === selectedCropId);
        if (sel) {
          const handle = getResizeHandle(pos.x, pos.y, sel);
          if (handle) {
            canvas.style.cursor =
              handle === "nw" || handle === "se"
                ? "nwse-resize"
                : "nesw-resize";
            return;
          }
        }
      }
      for (const crop of crops) {
        if (pointInRect(pos.x, pos.y, crop)) {
          canvas.style.cursor = "move";
          return;
        }
      }
      canvas.style.cursor = "crosshair";
    }
  }

  function handleMouseUp() {
    if (drawing) {
      const rect = normalizeRect(
        drawing.startX,
        drawing.startY,
        drawing.currentX - drawing.startX,
        drawing.currentY - drawing.startY
      );
      // Only create if the crop is large enough
      if (rect.width > 5 && rect.height > 5) {
        onCropCreated(rect);
      }
      setDrawing(null);
    }
    if (dragging) setDragging(null);
    if (resizing) setResizing(null);
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
