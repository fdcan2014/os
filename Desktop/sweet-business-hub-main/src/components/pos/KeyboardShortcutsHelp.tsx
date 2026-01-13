import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { type KeyboardShortcut, formatShortcut } from '@/hooks/usePOSKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsHelp({ open, onOpenChange, shortcuts }: KeyboardShortcutsHelpProps) {
  const groupedShortcuts = {
    'Vendas': shortcuts.filter(s => 
      ['F1', 'F2', 'F3', 'F4'].includes(s.key) || 
      s.key === 'Enter' ||
      s.key === 'Escape'
    ),
    'Carrinho': shortcuts.filter(s => 
      s.key === 'Delete' || 
      (s.ctrl && (s.key === 'Backspace' || s.key === 'd'))
    ),
    'Navegação': shortcuts.filter(s => 
      s.key === 'F12' || 
      s.key === '/' ||
      s.key === 'b'
    ),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([group, items]) => (
            items.length > 0 && (
              <div key={group}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{group}</h3>
                <div className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-background border rounded shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Pressione <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">F1</kbd> a qualquer momento para ver esta ajuda
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
