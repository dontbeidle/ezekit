import { useEffect } from "react";

/**
 * Keyboard shortcut handler.
 * `shortcuts` is an object like { "ctrl+s": handler, "Tab": handler, ... }
 */
export default function useShortcuts(shortcuts) {
  useEffect(() => {
    function handleKeyDown(e) {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");

      let key = e.key;
      // Normalize some key names
      if (key === "Escape") key = "Escape";
      if (key === " ") key = "Space";
      parts.push(key);

      const combo = parts.join("+");

      // Try matching with modifiers first, then just the key
      const handler = shortcuts[combo] || shortcuts[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
