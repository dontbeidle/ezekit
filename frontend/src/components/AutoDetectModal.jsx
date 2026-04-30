import { useState } from "react";

export default function AutoDetectModal({ onConfirm, onClose }) {
  const [replace, setReplace] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          Auto-detect text lines
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Automatically detect text lines on this page and create crop regions
          for each line. You can adjust them afterwards.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
            className="w-4 h-4 border-zinc-600 bg-zinc-800 text-indigo-600 rounded focus:ring-indigo-500/30"
          />
          <span className="text-sm text-zinc-300">
            Replace existing crops
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(replace)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Detect
          </button>
        </div>
      </div>
    </div>
  );
}
