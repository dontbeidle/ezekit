export default function CropList({ crops, selectedCropId, onSelect, onDelete }) {
  if (crops.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">
        Draw a rectangle on the page to create a crop.
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 py-1.5">
        Crops ({crops.length})
      </div>
      <div className="space-y-0.5">
        {crops.map((crop, idx) => (
          <div
            key={crop.id}
            onClick={() => onSelect(crop.id)}
            className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
              crop.id === selectedCropId
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
            }`}
          >
            <span className="text-xs font-mono w-5 text-center flex-none opacity-60">
              {idx + 1}
            </span>
            <span className="text-sm truncate flex-1">
              {crop.text || (
                <span className="italic text-zinc-600">no text</span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(crop.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-0.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
