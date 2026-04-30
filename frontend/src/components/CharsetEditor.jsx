import { useState } from "react";

export default function CharsetEditor({ charset, onSave, onClose }) {
  const [name, setName] = useState(charset?.name || "");
  const [charsText, setCharsText] = useState(
    charset?.chars
      ? charset.chars.map((c) => `${c.char}\t${c.label || ""}`).join("\n")
      : ""
  );
  const [loading, setLoading] = useState(false);

  function parseChars() {
    return charsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const parts = line.split("\t");
        return {
          char: parts[0] || line.charAt(0),
          label: parts[1] || "",
          order_index: idx,
        };
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), chars: parseChars() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          {charset ? "Edit charset" : "New charset"}
        </h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-zinc-400 block mb-1.5">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arabic diacritics"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            autoFocus
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-zinc-400 block mb-1.5">
            Characters (one per line, optionally: char TAB label)
          </span>
          <textarea
            value={charsText}
            onChange={(e) => setCharsText(e.target.value)}
            rows={8}
            placeholder={"a\nalif\nb\tba\nt\tta"}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono resize-none"
            dir="auto"
          />
          <span className="text-xs text-zinc-500 mt-1 block">
            {parseChars().length} characters
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
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
