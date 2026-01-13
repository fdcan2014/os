import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function usePOSKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow some shortcuts even when in input
      const allowInInput = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      
      if (isInput && !allowInInput.includes(event.key)) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                        event.code.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const altMatch = !!shortcut.alt === event.altKey;
        const shiftMatch = !!shortcut.shift === event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Helper to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}
