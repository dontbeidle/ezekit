import { useState } from "react";

export default function CharsetPanel({ charsets, onInsertChar }) {
  const [activeCharsetIdx, setActiveCharsetIdx] = useState(0);
  const activeCharset = charsets[activeCharsetIdx] || null;

  if (!activeCharset) return null;

  return (
    <div className="p-3 border-t border-zinc-800">
      {/* Charset tabs */}
      {charsets.length > 1 && (
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {charsets.map((cs, idx) => (
            <button
              key={cs.id}
              onClick={() => setActiveCharsetIdx(idx)}
              className={`text-xs px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                idx === activeCharsetIdx
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cs.name}
            </button>
          ))}
        </div>
      )}

      {/* Character grid */}
      <div className="flex flex-wrap gap-1">
        {(activeCharset.chars || []).map((ch) => (
          <button
            key={ch.id}
            onClick={() => onInsertChar(ch.char)}
            title={ch.label || ch.char}
            className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-zinc-200 transition-colors"
          >
            {ch.char}
          </button>
        ))}
      </div>

      {activeCharset.chars?.length === 0 && (
        <p className="text-xs text-zinc-600 text-center py-2">
          No characters in this charset. Add them in Settings.
        </p>
      )}
    </div>
  );
}
