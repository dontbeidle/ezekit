import { useState, useEffect } from "react";
import {
  exportProject,
  getExportDownloadUrl,
  getExportCount,
} from "../api/client";

const FORMATS = [
  { id: "parquet", label: "HuggingFace Parquet" },
  { id: "imagestext", label: "Images + Text (ZIP)" },
];

export default function ExportModal({ projectId, onClose }) {
  const [format, setFormat] = useState("parquet");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [count, setCount] = useState(null);

  useEffect(() => {
    getExportCount(projectId)
      .then((data) => setCount(data.count))
      .catch(() => setCount(null));
  }, [projectId]);

  async function handleExport() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await exportProject(projectId, format);
      setResult(res);
    } catch (e) {
      setError(e.message);
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
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Export dataset
        </h2>

        {/* Annotation count */}
        {count !== null && (
          <p className="text-sm text-zinc-400 mb-4">
            {count > 0 ? (
              <>
                <span className="text-zinc-200 font-medium">{count}</span>{" "}
                annotation{count !== 1 ? "s" : ""} will be exported.
              </>
            ) : (
              "No annotations to export."
            )}
          </p>
        )}

        {/* Format selector */}
        <div className="mb-4">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">
            Format
          </span>
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="export-format"
                  value={f.id}
                  checked={format === f.id}
                  onChange={() => setFormat(f.id)}
                  className="w-4 h-4 border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500/30"
                />
                <span className="text-sm text-zinc-300">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {result && (
          <div className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md px-3 py-2 mb-4">
            <p className="mb-1">Export successful.</p>
            <p className="text-xs text-emerald-300/70 font-mono break-all">
              {result.path}
            </p>
            <a
              href={getExportDownloadUrl(projectId, format)}
              download
              className="inline-block mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Download file
            </a>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleExport}
            disabled={loading || count === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {loading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
