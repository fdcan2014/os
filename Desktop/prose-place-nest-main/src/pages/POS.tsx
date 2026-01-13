import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, Barcode, ArrowLeft, Printer, Banknote, CreditCard, Keyboard, ShoppingCart, Calculator, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { CustomerSelector } from '@/components/pos/CustomerSelector';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { KeyboardShortcutsHelp } from '@/components/pos/KeyboardShortcutsHelp';
import { Numpad } from '@/components/pos/Numpad';
import {
  usePOSProducts,
  useCompanySettings,
  useDefaultLocation,
  useCreateSale,
  type CartItem,
  type Customer,
} from '@/hooks/usePOS';
import { usePOSKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/usePOSKeyboardShortcuts';
import { toast } from 'sonner';

export default function POS() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = usePOSProducts(search);
  const { data: companySettings } = useCompanySettings();
  const { data: defaultLocation } = useDefaultLocation();
  const createSale = useCreateSale();

  const currencySymbol = companySettings?.currencySymbol ?? 'R$';
  const taxRate = companySettings?.taxRate ?? 0;

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountType === 'percent' 
    ? subtotal * (discount / 100) 
    : Math.min(discount, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  // Add product to cart
  const addToCart = useCallback((product: {
    id: string;
    name: string;
    sku: string;
    sellPrice: number;
    costPrice: number;
    stock: number;
  }) => {
    const quantityToAdd = pendingQuantity || 1;
    
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantityToAdd;
        if (newQuantity > product.stock) {
          toast.warning('Estoque insuficiente');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (quantityToAdd > product.stock) {
        toast.warning('Estoque insuficiente');
        return prev;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.sellPrice,
          costPrice: product.costPrice,
          quantity: quantityToAdd,
          maxStock: product.stock,
        },
      ];
    });
    
    // Clear pending quantity after adding
    if (pendingQuantity) {
      setPendingQuantity(null);
      toast.success(`${quantityToAdd}x ${product.name} adicionado ao carrinho`);
    }
  }, [pendingQuantity]);

  // Handle numpad quantity confirm
  const handleNumpadQuantity = useCallback((quantity: number) => {
    setPendingQuantity(quantity);
    toast.info(`Quantidade ${quantity} definida. Clique em um produto para adicionar.`);
  }, []);

  // Handle numpad percent discount
  const handleNumpadDiscount = useCallback((percent: number) => {
    setDiscount(percent);
    setDiscountType('percent');
    toast.success(`Desconto de ${percent}% aplicado`);
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQuantity = item.quantity + delta;
          if (newQuantity > item.maxStock) {
            toast.warning('Estoque insuficiente');
            return item;
          }
          return { ...item, quantity: Math.max(0, newQuantity) };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer(null);
    setDiscount(0);
    setDiscountType('percent');
  }, []);

  // Apply discount
  const handleApplyDiscount = useCallback((value: number, type: 'percent' | 'fixed') => {
    setDiscount(value);
    setDiscountType(type);
  }, []);

  // Process payment
  const handlePayment = useCallback(
    async (paymentMethodId: string, amountPaid: number, change: number) => {
      if (!defaultLocation?.id) {
        toast.error('Nenhum local padrão configurado');
        return;
      }

      try {
        await createSale.mutateAsync({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            costPrice: item.costPrice,
            taxRate: taxRate,
          })),
          customerId: customer?.id ?? null,
          locationId: defaultLocation.id,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          paidAmount: Math.min(amountPaid, total),
          paymentMethodId,
        });

        // Success - clear cart and close modal
        clearCart();
        setPaymentModalOpen(false);

        if (change > 0) {
          toast.info(`Troco: ${currencySymbol} ${change.toFixed(2)}`);
        }
      } catch (error) {
        // Error is handled by mutation
      }
    },
    [cart, customer, defaultLocation, subtotal, discountAmount, taxAmount, total, taxRate, currencySymbol, createSale, clearCart]
  );

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'F1',
      action: () => setShortcutsHelpOpen(true),
      description: 'Exibir ajuda de atalhos',
    },
    {
      key: 'F2',
      action: () => cart.length > 0 && setPaymentModalOpen(true),
      description: 'Abrir pagamento',
    },
    {
      key: 'F3',
      action: () => setDiscountModalOpen(true),
      description: 'Aplicar desconto',
    },
    {
      key: 'F4',
      action: () => searchInputRef.current?.focus(),
      description: 'Focar na busca',
    },
    {
      key: 'Escape',
      action: () => {
        if (paymentModalOpen) setPaymentModalOpen(false);
        else if (discountModalOpen) setDiscountModalOpen(false);
        else if (shortcutsHelpOpen) setShortcutsHelpOpen(false);
        else if (search) setSearch('');
      },
      description: 'Fechar modal / Limpar busca',
    },
    {
      key: 'Delete',
      ctrl: true,
      action: () => {
        if (cart.length > 0 && confirm('Limpar carrinho?')) {
          clearCart();
        }
      },
      description: 'Limpar carrinho',
    },
    {
      key: 'F12',
      action: () => window.location.href = '/',
      description: 'Voltar ao Dashboard',
    },
  ], [cart.length, paymentModalOpen, discountModalOpen, shortcutsHelpOpen, search, clearCart]);

  // Enable keyboard shortcuts when no modal is open (except for Escape)
  const shortcutsEnabled = !paymentModalOpen && !discountModalOpen;
  usePOSKeyboardShortcuts(shortcuts, true);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col border-r">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-card">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Ponto de Venda</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShortcutsHelpOpen(true)}
              className="text-muted-foreground"
            >
              <Keyboard className="w-4 h-4 mr-1" />
              <span className="text-xs">F1</span>
            </Button>
            <Badge variant="outline">
              {defaultLocation?.name || 'Carregando...'}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-card">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar produto por nome, SKU ou código de barras... (F4)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Barcode className="w-5 h-5" />
            </Button>
            <div className="hidden lg:flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant={showNumpad ? 'secondary' : 'outline'}
              size="icon"
              className="hidden lg:flex"
              onClick={() => setShowNumpad(!showNumpad)}
              title={showNumpad ? 'Esconder calculadora' : 'Mostrar calculadora'}
            >
              <Calculator className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="p-4">
            <ProductGrid
              products={products}
              isLoading={productsLoading}
              onProductClick={addToCart}
              currencySymbol={currencySymbol}
              viewMode={viewMode}
            />
          </div>
        </div>

        {/* Numpad - collapsible */}
        {showNumpad && (
          <Numpad
            onQuantityConfirm={handleNumpadQuantity}
            onPercentDiscount={handleNumpadDiscount}
            selectedItemName={pendingQuantity ? `Próximo produto: x${pendingQuantity}` : undefined}
            className="hidden lg:block shrink-0"
          />
        )}

        {/* Pending quantity indicator */}
        {pendingQuantity && (
          <div className="hidden lg:flex items-center justify-between px-4 py-2 bg-primary/10 border-t">
            <span className="text-sm font-medium">
              Quantidade pendente: <strong>{pendingQuantity}</strong>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPendingQuantity(null)}
              className="text-xs h-7"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Right Panel - Cart (desktop) */}
      <div className="hidden md:flex w-[400px] flex-col bg-card">
        {/* Customer Selector */}
        <CustomerSelector
          selectedCustomer={customer}
          onSelectCustomer={setCustomer}
          currencySymbol={currencySymbol}
        />

        {/* Cart */}
        <Cart
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClear={clearCart}
          onApplyDiscount={() => setDiscountModalOpen(true)}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
          currencySymbol={currencySymbol}
        />

        {/* Payment Buttons */}
        <div className="p-4 border-t space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-14"
              disabled={cart.length === 0}
              onClick={() => setPaymentModalOpen(true)}
            >
              <Banknote className="w-5 h-5 mr-2" />
              Dinheiro
            </Button>
            <Button
              variant="outline"
              className="h-14"
              disabled={cart.length === 0}
              onClick={() => setPaymentModalOpen(true)}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Cartão
            </Button>
          </div>
          <Button
            className="w-full h-14 text-lg pos-key-success"
            disabled={cart.length === 0}
            onClick={() => setPaymentModalOpen(true)}
          >
            <Printer className="w-5 h-5 mr-2" />
            Finalizar Venda (F2)
          </Button>
        </div>
      </div>

      {/* Floating Cart Button (mobile) */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className="md:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
            size="icon"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
          {/* Customer Selector */}
          <CustomerSelector
            selectedCustomer={customer}
            onSelectCustomer={setCustomer}
            currencySymbol={currencySymbol}
          />

          {/* Cart */}
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClear={clearCart}
            onApplyDiscount={() => setDiscountModalOpen(true)}
            subtotal={subtotal}
            discount={discount}
            discountType={discountType}
            taxRate={taxRate}
            taxAmount={taxAmount}
            total={total}
            currencySymbol={currencySymbol}
          />

          {/* Payment Buttons */}
          <div className="p-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-14"
                disabled={cart.length === 0}
                onClick={() => {
                  setCartSheetOpen(false);
                  setPaymentModalOpen(true);
                }}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Dinheiro
              </Button>
              <Button
                variant="outline"
                className="h-14"
                disabled={cart.length === 0}
                onClick={() => {
                  setCartSheetOpen(false);
                  setPaymentModalOpen(true);
                }}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Cartão
              </Button>
            </div>
            <Button
              className="w-full h-14 text-lg pos-key-success"
              disabled={cart.length === 0}
              onClick={() => {
                setCartSheetOpen(false);
                setPaymentModalOpen(true);
              }}
            >
              <Printer className="w-5 h-5 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        total={total}
        currencySymbol={currencySymbol}
        onConfirm={handlePayment}
        isProcessing={createSale.isPending}
      />

      <DiscountModal
        open={discountModalOpen}
        onOpenChange={setDiscountModalOpen}
        subtotal={subtotal}
        currentDiscount={discount}
        currentDiscountType={discountType}
        currencySymbol={currencySymbol}
        onApply={handleApplyDiscount}
      />

      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
        shortcuts={shortcuts}
      />
    </div>
  );
}
