import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Search, X, Check } from 'lucide-react';
import { usePOSCustomers, type Customer } from '@/hooks/usePOS';
import { cn } from '@/lib/utils';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  currencySymbol: string;
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer, currencySymbol }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = usePOSCustomers(search);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelectCustomer(null);
  };

  return (
    <div className="p-4 border-b">
      {selectedCustomer ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedCustomer.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedCustomer.code && `${selectedCustomer.code} • `}
              {selectedCustomer.phone || selectedCustomer.email || 'Sem contato'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <User className="w-4 h-4" />
              <span>Adicionar Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              
              <div className="max-h-[300px] overflow-auto space-y-2">
                {search.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Digite para buscar clientes
                  </p>
                ) : isLoading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Buscando...
                  </p>
                ) : !customers?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado
                  </p>
                ) : (
                  customers.map((customer) => (
                    <button
                      key={customer.id}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left',
                        selectedCustomer?.id === customer.id && 'border-primary bg-primary/5'
                      )}
                      onClick={() => handleSelect(customer as Customer)}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="font-medium text-muted-foreground">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.code && `${customer.code} • `}
                          {customer.phone || customer.email || 'Sem contato'}
                        </p>
                        {customer.credit_limit && (
                          <p className="text-xs text-muted-foreground">
                            Limite: {currencySymbol} {customer.credit_limit.toFixed(2)}
                          </p>
                        )}
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
