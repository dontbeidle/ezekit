import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchProjects,
  fetchCharsets,
  createCharset,
  updateCharset,
  deleteCharset,
} from "../api/client";
import CharsetEditor from "../components/CharsetEditor";

export default function SettingsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [charsets, setCharsets] = useState([]);
  const [editingCharset, setEditingCharset] = useState(null); // null or charset object
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setSelectedProjectId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchCharsets(selectedProjectId).then(setCharsets);
    }
  }, [selectedProjectId]);

  async function handleSave(data) {
    if (editingCharset) {
      await updateCharset(editingCharset.id, data);
    } else {
      await createCharset(selectedProjectId, data);
    }
    setEditingCharset(null);
    setShowNew(false);
    // Reload
    const cs = await fetchCharsets(selectedProjectId);
    setCharsets(cs);
  }

  async function handleDelete(charsetId) {
    if (!confirm("Delete this charset?")) return;
    await deleteCharset(charsetId);
    const cs = await fetchCharsets(selectedProjectId);
    setCharsets(cs);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <span className="text-lg font-semibold text-zinc-100">
              Settings
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Project selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Project
          </label>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Charsets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-zinc-200">
              Character sets
            </h2>
            <button
              onClick={() => {
                setEditingCharset(null);
                setShowNew(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              New charset
            </button>
          </div>

          {charsets.length === 0 && !showNew && (
            <p className="text-sm text-zinc-500">
              No character sets yet. Create one to add special character buttons
              to the annotation view.
            </p>
          )}

          <div className="space-y-3">
            {charsets.map((cs) => (
              <div
                key={cs.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    {cs.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNew(false);
                        setEditingCharset(cs);
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cs.id)}
                      className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(cs.chars || []).map((ch) => (
                    <span
                      key={ch.id}
                      className="w-7 h-7 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300"
                    >
                      {ch.char}
                    </span>
                  ))}
                  {(!cs.chars || cs.chars.length === 0) && (
                    <span className="text-xs text-zinc-600">
                      No characters added
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Charset editor modal */}
      {(showNew || editingCharset) && (
        <CharsetEditor
          charset={editingCharset}
          onSave={handleSave}
          onClose={() => {
            setShowNew(false);
            setEditingCharset(null);
          }}
        />
      )}
    </div>
  );
}
