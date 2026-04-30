export default function CropEditor({ crop, onTextChange, textInputRef }) {
  return (
    <div className="p-3">
      <label className="block">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
          Text annotation
        </span>
        <textarea
          ref={textInputRef}
          value={crop.text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type the text visible in this crop..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none font-mono"
          dir="auto"
        />
      </label>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600">
        <span>{(crop.text || "").length} chars</span>
        <span>
          {Math.round(crop.width)}x{Math.round(crop.height)}px
        </span>
      </div>
    </div>
  );
}
