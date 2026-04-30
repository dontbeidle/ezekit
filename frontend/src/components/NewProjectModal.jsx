import { useState, useRef } from "react";
import { createProject } from "../api/client";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function validateFile(f) {
    if (!f) return null;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      return "Please select a PDF file";
    }
    if (f.size > 500 * 1024 * 1024) {
      return "File is too large (max 500 MB)";
    }
    return null;
  }

  function handleFileSelect(f) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !file) return;

    setLoading(true);
    setError("");
    try {
      await createProject({ name: name.trim(), pdfFile: file });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          New project
        </h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-zinc-400 block mb-1.5">
            Project name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arabic manuscripts vol. 1"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            autoFocus
          />
        </label>

        {/* PDF file upload */}
        <div className="mb-4">
          <span className="text-sm font-medium text-zinc-400 block mb-1.5">
            PDF file
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
              }`}
            >
              <svg
                className="w-8 h-8 mx-auto mb-2 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm text-zinc-400">
                Drag a PDF here or{" "}
                <span className="text-indigo-400">click to browse</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">Max 500 MB</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5">
              <svg
                className="w-5 h-5 text-indigo-400 flex-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                title="Remove file"
              >
                <svg
                  className="w-4 h-4"
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
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

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
            disabled={loading || !name.trim() || !file}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {loading ? "Uploading..." : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}
