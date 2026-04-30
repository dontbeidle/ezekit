import { useRef, useState, useEffect } from "react";
import { getPageImageUrl } from "../api/client";
import CropOverlay from "./CropOverlay";

export default function PageView({
  page,
  crops,
  selectedCropId,
  onCropCreated,
  onCropUpdated,
  onCropSelect,
}) {
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = getPageImageUrl(page.id);

  // Reset loaded state when page changes
  useEffect(() => {
    setImageLoaded(false);
  }, [page.id]);

  function handleImageLoad() {
    setImageLoaded(true);
  }

  return (
    <div className="flex justify-center">
      <div className="relative inline-block select-none">
        <img
          ref={imageRef}
          src={imageUrl}
          alt={`Page ${page.page_number}`}
          className="block"
          style={{ width: page.width, height: page.height }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        {imageLoaded && (
          <CropOverlay
            imageRef={imageRef}
            crops={crops}
            selectedCropId={selectedCropId}
            onCropCreated={onCropCreated}
            onCropUpdated={onCropUpdated}
            onCropSelect={onCropSelect}
          />
        )}
      </div>
    </div>
  );
}
