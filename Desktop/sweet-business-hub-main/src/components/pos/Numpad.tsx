import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Delete, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumpadProps {
  onQuantityConfirm: (quantity: number) => void;
  onPercentDiscount?: (percent: number) => void;
  selectedItemName?: string;
  className?: string;
}

type NumpadMode = 'quantity' | 'percent';

export function Numpad({ 
  onQuantityConfirm, 
  onPercentDiscount,
  selectedItemName,
  className 
}: NumpadProps) {
  const [display, setDisplay] = useState('');
  const [mode, setMode] = useState<NumpadMode>('quantity');

  // Clear display when mode changes
  useEffect(() => {
    setDisplay('');
  }, [mode]);

  const handleKeyPress = useCallback((key: string) => {
    switch (key) {
      case 'C':
        setDisplay('');
        break;
      case 'CE':
        setDisplay((prev) => prev.slice(0, -1));
        break;
      case '.':
        if (!display.includes('.')) {
          setDisplay((prev) => prev === '' ? '0.' : prev + '.');
        }
        break;
      case 'Qtd':
        setMode('quantity');
        setDisplay('');
        break;
      case '%':
        setMode('percent');
        setDisplay('');
        break;
      case '+/-':
        // Not applicable for quantity/percent, ignore
        break;
      case 'Enter':
        const value = parseFloat(display) || 0;
        if (value > 0) {
          if (mode === 'quantity') {
            onQuantityConfirm(Math.floor(value));
          } else if (mode === 'percent' && onPercentDiscount) {
            onPercentDiscount(Math.min(value, 100));
          }
          setDisplay('');
        }
        break;
      default:
        // Number keys
        if (/^\d$/.test(key)) {
          setDisplay((prev) => {
            // Limit decimal places to 2
            if (prev.includes('.')) {
              const [, decimal] = prev.split('.');
              if (decimal && decimal.length >= 2) return prev;
            }
            // Limit total length
            if (prev.length >= 10) return prev;
            return prev + key;
          });
        }
    }
  }, [display, mode, onQuantityConfirm, onPercentDiscount]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (/^\d$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('Enter');
      } else if (e.key === 'Escape') {
        handleKeyPress('C');
      } else if (e.key === 'Backspace') {
        handleKeyPress('CE');
      } else if (e.key === '.') {
        handleKeyPress('.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getModeLabel = () => {
    switch (mode) {
      case 'quantity':
        return 'Quantidade';
      case 'percent':
        return 'Desconto %';
      default:
        return '';
    }
  };

  const getDisplayValue = () => {
    if (!display) {
      return mode === 'percent' ? '0%' : '0';
    }
    return mode === 'percent' ? `${display}%` : display;
  };

  return (
    <div className={cn("p-4 border-t bg-card", className)}>
      {/* Display */}
      <div className="mb-3 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{getModeLabel()}</span>
          {selectedItemName && mode === 'quantity' && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {selectedItemName}
            </span>
          )}
        </div>
        <div className="text-2xl font-mono font-bold text-right">
          {getDisplayValue()}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('7')}
        >
          7
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('8')}
        >
          8
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('9')}
        >
          9
        </Button>
        <Button 
          variant={mode === 'quantity' ? 'secondary' : 'outline'}
          className="h-12 text-sm font-medium"
          onClick={() => handleKeyPress('Qtd')}
        >
          Qtd
        </Button>

        {/* Row 2 */}
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('4')}
        >
          4
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('5')}
        >
          5
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('6')}
        >
          6
        </Button>
        <Button 
          variant={mode === 'percent' ? 'secondary' : 'outline'}
          className="h-12 text-sm font-medium"
          onClick={() => handleKeyPress('%')}
          disabled={!onPercentDiscount}
        >
          %
        </Button>

        {/* Row 3 */}
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('1')}
        >
          1
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('2')}
        >
          2
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('3')}
        >
          3
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-destructive hover:text-destructive"
          onClick={() => handleKeyPress('CE')}
        >
          <Delete className="w-5 h-5" />
        </Button>

        {/* Row 4 */}
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('0')}
        >
          0
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-lg font-medium"
          onClick={() => handleKeyPress('.')}
        >
          .
        </Button>
        <Button 
          variant="outline" 
          className="h-12 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => handleKeyPress('C')}
        >
          <X className="w-5 h-5" />
        </Button>
        <Button 
          className="h-12 bg-primary hover:bg-primary/90"
          onClick={() => handleKeyPress('Enter')}
        >
          <Check className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick quantity buttons */}
      {mode === 'quantity' && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[1, 2, 3, 5, 10].map((qty) => (
            <Button
              key={qty}
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setDisplay(String(qty));
                onQuantityConfirm(qty);
                setDisplay('');
              }}
            >
              x{qty}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
