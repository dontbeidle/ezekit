import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchProject,
  fetchPages,
  fetchCrops,
  fetchCharsets,
  createCrop,
  updateCrop,
  deleteCrop,
  autoDetectLines,
} from "../api/client";
import PageView from "../components/PageView";
import CropList from "../components/CropList";
import CropEditor from "../components/CropEditor";
import CharsetPanel from "../components/CharsetPanel";
import ExportModal from "../components/ExportModal";
import AutoDetectModal from "../components/AutoDetectModal";
import useAutoSave from "../hooks/useAutoSave";
import useShortcuts from "../hooks/useShortcuts";

export default function AnnotationPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [charsets, setCharsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showAutoDetect, setShowAutoDetect] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const textInputRef = useRef(null);

  const currentPage = pages[currentPageIdx] || null;

  // Load project + pages + charsets
  useEffect(() => {
    async function load() {
      try {
        const [proj, pgs, cs] = await Promise.all([
          fetchProject(id),
          fetchPages(id),
          fetchCharsets(id),
        ]);
        setProject(proj);
        setPages(pgs);
        setCharsets(cs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Load crops when page changes
  useEffect(() => {
    if (!currentPage) return;
    fetchCrops(currentPage.id).then(setCrops).catch(console.error);
    setSelectedCropId(null);
  }, [currentPage?.id]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || null;

  // Auto-save for text changes
  const { schedule: scheduleTextSave, saveNow: saveTextNow } = useAutoSave(
    async (cropId, text) => {
      await updateCrop(cropId, { text });
    },
    500
  );

  // Handle new crop drawn on canvas
  const handleCropCreated = useCallback(
    async (rect) => {
      if (!currentPage) return;
      const newCrop = await createCrop(currentPage.id, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        order_index: crops.length,
      });
      setCrops((prev) => [...prev, newCrop]);
      setSelectedCropId(newCrop.id);
      // Focus text input after creating
      setTimeout(() => textInputRef.current?.focus(), 50);
    },
    [currentPage, crops.length]
  );

  // Handle crop moved/resized
  const handleCropUpdated = useCallback(
    async (cropId, updates) => {
      await updateCrop(cropId, updates);
      setCrops((prev) =>
        prev.map((c) => (c.id === cropId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  // Handle text change (debounced)
  const handleTextChange = useCallback(
    (cropId, text) => {
      setCrops((prev) =>
        prev.map((c) => (c.id === cropId ? { ...c, text } : c))
      );
      scheduleTextSave(cropId, text);
    },
    [scheduleTextSave]
  );

  // Handle crop delete
  const handleCropDelete = useCallback(
    async (cropId) => {
      await deleteCrop(cropId);
      setCrops((prev) => prev.filter((c) => c.id !== cropId));
      if (selectedCropId === cropId) setSelectedCropId(null);
    },
    [selectedCropId]
  );

  // Insert character at cursor in text input
  const handleInsertChar = useCallback(
    (char) => {
      if (!selectedCrop || !textInputRef.current) return;
      const input = textInputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const current = selectedCrop.text || "";
      const newText = current.slice(0, start) + char + current.slice(end);
      handleTextChange(selectedCrop.id, newText);
      // Restore cursor position after React re-render
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + char.length;
        input.focus();
      }, 0);
    },
    [selectedCrop, handleTextChange]
  );

  // Navigate crops
  const selectNextCrop = useCallback(() => {
    if (crops.length === 0) return;
    const idx = crops.findIndex((c) => c.id === selectedCropId);
    const nextIdx = idx < crops.length - 1 ? idx + 1 : 0;
    setSelectedCropId(crops[nextIdx].id);
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, [crops, selectedCropId]);

  const selectPrevCrop = useCallback(() => {
    if (crops.length === 0) return;
    const idx = crops.findIndex((c) => c.id === selectedCropId);
    const prevIdx = idx > 0 ? idx - 1 : crops.length - 1;
    setSelectedCropId(crops[prevIdx].id);
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, [crops, selectedCropId]);

  // Keyboard shortcuts
  useShortcuts({
    "ctrl+s": () => {
      if (selectedCrop) saveTextNow(selectedCrop.id, selectedCrop.text);
    },
    Tab: selectNextCrop,
    "shift+Tab": selectPrevCrop,
    Escape: () => setSelectedCropId(null),
  });

  // Handle auto-detect
  const handleAutoDetect = useCallback(
    async (replace) => {
      if (!currentPage) return;
      setShowAutoDetect(false);
      setDetecting(true);
      try {
        const newCrops = await autoDetectLines(currentPage.id, replace);
        if (replace) {
          setCrops(newCrops);
        } else {
          setCrops((prev) => [...prev, ...newCrops]);
        }
        setSelectedCropId(null);
      } catch (e) {
        alert(e.message);
      } finally {
        setDetecting(false);
      }
    },
    [currentPage]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Project not found.{" "}
        <Link to="/" className="text-indigo-400 ml-1">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex-none">
        <div className="px-4 h-12 flex items-center justify-between">
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
            <span className="text-sm font-medium text-zinc-200 truncate max-w-xs">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Page navigation */}
            <button
              onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
              disabled={currentPageIdx === 0}
              className="text-zinc-400 hover:text-zinc-200 disabled:opacity-30 p-1 transition-colors"
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <span className="text-xs text-zinc-400 tabular-nums min-w-[4rem] text-center">
              Page {currentPageIdx + 1} / {pages.length}
            </span>
            <button
              onClick={() =>
                setCurrentPageIdx((i) => Math.min(pages.length - 1, i + 1))
              }
              disabled={currentPageIdx === pages.length - 1}
              className="text-zinc-400 hover:text-zinc-200 disabled:opacity-30 p-1 transition-colors"
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
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>

            {/* Auto-detect */}
            <button
              onClick={() => setShowAutoDetect(true)}
              disabled={detecting}
              className="ml-2 text-xs font-medium px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {detecting ? (
                <>
                  <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Auto-detect
                </>
              )}
            </button>

            {/* Export */}
            <button
              onClick={() => setShowExport(true)}
              className="text-xs font-medium px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Page image + crop overlay */}
        <div className="flex-1 overflow-auto bg-zinc-900/50 p-4">
          {currentPage && (
            <PageView
              page={currentPage}
              crops={crops}
              selectedCropId={selectedCropId}
              onCropCreated={handleCropCreated}
              onCropUpdated={handleCropUpdated}
              onCropSelect={setSelectedCropId}
            />
          )}
        </div>

        {/* Right: Crop list + editor + charset */}
        <div className="w-80 flex-none border-l border-zinc-800 flex flex-col overflow-hidden bg-zinc-950">
          <div className="flex-1 overflow-y-auto">
            <CropList
              crops={crops}
              selectedCropId={selectedCropId}
              onSelect={setSelectedCropId}
              onDelete={handleCropDelete}
            />
          </div>

          {selectedCrop && (
            <div className="border-t border-zinc-800">
              <CropEditor
                crop={selectedCrop}
                onTextChange={(text) =>
                  handleTextChange(selectedCrop.id, text)
                }
                textInputRef={textInputRef}
              />
              {charsets.length > 0 && (
                <CharsetPanel
                  charsets={charsets}
                  onInsertChar={handleInsertChar}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <footer className="border-t border-zinc-800 bg-zinc-950/80 flex-none">
        <div className="px-4 h-7 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {crops.length} crop{crops.length !== 1 ? "s" : ""} on this page
          </span>
          <span className="flex items-center gap-3">
            <span>Tab/Shift+Tab: navigate</span>
            <span>Ctrl+S: save</span>
            <span>Esc: deselect</span>
          </span>
        </div>
      </footer>

      {showExport && (
        <ExportModal
          projectId={project.id}
          onClose={() => setShowExport(false)}
        />
      )}

      {showAutoDetect && (
        <AutoDetectModal
          onConfirm={handleAutoDetect}
          onClose={() => setShowAutoDetect(false)}
        />
      )}
    </div>
  );
}
