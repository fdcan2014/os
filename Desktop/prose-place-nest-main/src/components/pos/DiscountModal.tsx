import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Percent, DollarSign } from 'lucide-react';

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  currentDiscount: number;
  currentDiscountType: 'percent' | 'fixed';
  currencySymbol: string;
  onApply: (discount: number, type: 'percent' | 'fixed') => void;
}

export function DiscountModal({
  open,
  onOpenChange,
  subtotal,
  currentDiscount,
  currentDiscountType,
  currencySymbol,
  onApply,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(currentDiscountType);
  const [discountValue, setDiscountValue] = useState(currentDiscount.toString());

  const numericValue = parseFloat(discountValue) || 0;
  const calculatedDiscount = discountType === 'percent' 
    ? subtotal * (Math.min(numericValue, 100) / 100)
    : Math.min(numericValue, subtotal);
  const finalTotal = subtotal - calculatedDiscount;

  const handleApply = () => {
    onApply(numericValue, discountType);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDiscountValue('0');
    onApply(0, 'percent');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Desconto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'percent' | 'fixed')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="percent" className="gap-2">
                <Percent className="w-4 h-4" />
                Porcentagem
              </TabsTrigger>
              <TabsTrigger value="fixed" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Fixo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="percent" className="space-y-4">
              <div>
                <Label>Porcentagem de Desconto</Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="pr-10 text-lg"
                    min={0}
                    max={100}
                    step={1}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25, 30].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscountValue(percent.toString())}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="fixed" className="space-y-4">
              <div>
                <Label>Valor do Desconto</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="pl-10 text-lg"
                    min={0}
                    max={subtotal}
                    step={0.01}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>Desconto</span>
              <span>-{currencySymbol} {calculatedDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Novo Total</span>
              <span className="text-primary">{currencySymbol} {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear}>
            Remover Desconto
          </Button>
          <Button onClick={handleApply}>
            Aplicar Desconto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
