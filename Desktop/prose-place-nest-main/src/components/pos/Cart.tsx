import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, X, Percent } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { CartItem } from '@/hooks/usePOS';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onApplyDiscount: () => void;
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  taxRate: number;
  taxAmount: number;
  total: number;
  currencySymbol: string;
}

interface SwipeableCartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  currencySymbol: string;
}

function SwipeableCartItem({ item, onUpdateQuantity, onRemoveItem, currencySymbol }: SwipeableCartItemProps) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0],
    ['hsl(var(--destructive))', 'transparent']
  );
  const opacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      onRemoveItem(item.id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-lg"
        style={{ background }}
      >
        <motion.div style={{ opacity }}>
          <Trash2 className="w-5 h-5 text-destructive-foreground" />
        </motion.div>
      </motion.div>
      
      {/* Swipeable item */}
      <motion.div
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 relative touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        style={{ x }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {currencySymbol} {item.price.toFixed(2)} × {item.quantity}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, -1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, 1)}
            disabled={item.quantity >= item.maxStock}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hidden md:flex"
            onClick={() => onRemoveItem(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <p className="font-bold w-24 text-right">
          {currencySymbol} {(item.price * item.quantity).toFixed(2)}
        </p>
      </motion.div>
    </div>
  );
}

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onApplyDiscount,
  subtotal,
  discount,
  discountType,
  taxRate,
  taxAmount,
  total,
  currencySymbol,
}: CartProps) {
  const discountAmount = discountType === 'percent' 
    ? subtotal * (discount / 100) 
    : discount;

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">Carrinho vazio</p>
            <p className="text-sm">Adicione produtos para começar</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                layout
              >
                <SwipeableCartItem
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClear} disabled={items.length === 0}>
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button variant="outline" className="flex-1" onClick={onApplyDiscount} disabled={items.length === 0}>
            <Percent className="w-4 h-4 mr-2" />
            Desconto
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="p-4 border-t bg-muted/30">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{currencySymbol} {subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto {discountType === 'percent' ? `(${discount}%)` : ''}</span>
              <span>-{currencySymbol} {discountAmount.toFixed(2)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impostos ({taxRate}%)</span>
              <span className="font-medium">{currencySymbol} {taxAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{currencySymbol} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
