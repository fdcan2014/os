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
import { Banknote, CreditCard, Smartphone, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaymentMethods } from '@/hooks/usePOS';

type PaymentType = 'cash' | 'card' | 'pix';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  currencySymbol: string;
  onConfirm: (paymentMethodId: string, amountPaid: number, change: number) => void;
  isProcessing: boolean;
}

const paymentIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-6 h-6" />,
  card: <CreditCard className="w-6 h-6" />,
  pix: <Smartphone className="w-6 h-6" />,
};

const quickAmounts = [5, 10, 20, 50, 100, 200];

export function PaymentModal({
  open,
  onOpenChange,
  total,
  currencySymbol,
  onConfirm,
  isProcessing,
}: PaymentModalProps) {
  const { data: paymentMethods } = usePaymentMethods();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState(total.toString());

  const selectedMethodData = paymentMethods?.find((m) => m.id === selectedMethod);
  const isCash = selectedMethodData?.type === 'cash';
  const numericAmount = parseFloat(amountPaid) || 0;
  const change = Math.max(0, numericAmount - total);
  const canConfirm = selectedMethod && numericAmount >= total;

  const handleQuickAmount = (amount: number) => {
    setAmountPaid((parseFloat(amountPaid) || 0 + amount).toString());
  };

  const handleExactAmount = () => {
    setAmountPaid(total.toFixed(2));
  };

  const handleConfirm = () => {
    if (canConfirm && selectedMethod) {
      onConfirm(selectedMethod, numericAmount, change);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMethod(null);
      setAmountPaid(total.toString());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total a pagar</p>
            <p className="text-4xl font-bold text-primary">
              {currencySymbol} {total.toFixed(2)}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods?.map((method) => (
                <button
                  key={method.id}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    if (method.type !== 'cash') {
                      setAmountPaid(total.toFixed(2));
                    }
                  }}
                >
                  {paymentIcons[method.type || 'cash'] || <CreditCard className="w-6 h-6" />}
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input (for cash) */}
          {selectedMethod && isCash && (
            <div className="space-y-3">
              <Label>Valor Recebido</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="text-2xl font-bold text-center h-14"
                min={0}
                step={0.01}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExactAmount}
                  className="flex-1"
                >
                  Valor Exato
                </Button>
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                  >
                    +{currencySymbol}{amount}
                  </Button>
                ))}
              </div>
              
              {change > 0 && (
                <div className="p-4 bg-success/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Troco</p>
                  <p className="text-2xl font-bold text-success">
                    {currencySymbol} {change.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
