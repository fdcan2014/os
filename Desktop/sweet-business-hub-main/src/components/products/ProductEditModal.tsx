import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProductSchema, type ProductInput } from '@/lib/validations';
import { useCategories, useBrands, useUnits, useUpdateProduct, type Product } from '@/hooks/useProducts';
import { generateSKU, checkSKUExists } from '@/lib/sku-generator';
import { toast } from 'sonner';

interface ProductEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductEditModal({ open, onOpenChange, product }: ProductEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSKU, setIsGeneratingSKU] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [isValidatingSKU, setIsValidatingSKU] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: units = [] } = useUnits();
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: null,
      brand_id: null,
      unit_id: null,
      cost_price: 0,
      sell_price: 0,
      min_stock: 0,
      max_stock: null,
      reorder_point: 0,
      has_variants: false,
      is_active: true,
    },
  });

  const watchedSKU = form.watch('sku');

  // Validate SKU uniqueness with debounce (excluding current product)
  useEffect(() => {
    if (!watchedSKU || watchedSKU.trim().length < 3 || !product) {
      setSkuError(null);
      return;
    }

    // Don't validate if SKU hasn't changed
    if (watchedSKU === product.sku) {
      setSkuError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingSKU(true);
      try {
        const exists = await checkSKUExists(watchedSKU, product.id);
        if (exists) {
          setSkuError('Este SKU já existe. Use um SKU diferente.');
        } else {
          setSkuError(null);
        }
      } catch (error) {
        console.error('Error validating SKU:', error);
      } finally {
        setIsValidatingSKU(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedSKU, product]);

  const handleGenerateSKU = useCallback(async () => {
    const name = form.getValues('name');
    const categoryId = form.getValues('category_id');

    if (!name || name.trim().length < 2) {
      toast.error('Digite o nome do produto primeiro');
      return;
    }

    setIsGeneratingSKU(true);
    setSkuError(null);
    try {
      const generatedSKU = await generateSKU(categoryId, name, categories);
      
      const exists = await checkSKUExists(generatedSKU, product?.id);
      if (exists) {
        const uniqueSKU = `${generatedSKU.slice(0, -4)}${Date.now().toString().slice(-4)}`;
        form.setValue('sku', uniqueSKU);
      } else {
        form.setValue('sku', generatedSKU);
      }
      
      toast.success('SKU regenerado!');
    } catch (error) {
      console.error('Error generating SKU:', error);
      toast.error('Erro ao gerar SKU');
    } finally {
      setIsGeneratingSKU(false);
    }
  }, [categories, form, product?.id]);

  // Reset form when product changes
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id,
        brand_id: product.brand_id,
        unit_id: product.unit_id,
        cost_price: Number(product.cost_price) || 0,
        sell_price: Number(product.sell_price) || 0,
        min_stock: Number(product.min_stock) || 0,
        max_stock: product.max_stock ? Number(product.max_stock) : null,
        reorder_point: Number(product.reorder_point) || 0,
        has_variants: product.has_variants || false,
        is_active: product.is_active ?? true,
      });
      setSkuError(null);
    }
  }, [product, open, form]);

  const onSubmit = async (data: ProductInput) => {
    if (!product) return;

    // Validate SKU before submitting
    if (skuError) {
      toast.error('Corrija o SKU antes de salvar');
      return;
    }

    // Final uniqueness check if SKU changed
    if (data.sku !== product.sku) {
      const exists = await checkSKUExists(data.sku, product.id);
      if (exists) {
        setSkuError('Este SKU já existe. Use um SKU diferente.');
        toast.error('SKU já existe. Use um SKU diferente.');
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await updateProduct.mutateAsync({ id: product.id, ...data });
      toast.success('Produto atualizado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      if (error?.code === '23505') {
        setSkuError('SKU já existe. Use um SKU diferente.');
        toast.error('SKU já existe. Use um SKU diferente.');
      } else {
        toast.error('Erro ao atualizar produto. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSkuError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Produto
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="PRD-001" 
                              {...field}
                              className={`font-mono pr-8 ${skuError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                            {isValidatingSKU && (
                              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                            {!isValidatingSKU && field.value && !skuError && (
                              <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                            {!isValidatingSKU && skuError && (
                              <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateSKU}
                          disabled={isGeneratingSKU}
                          title="Regenerar SKU"
                        >
                          {isGeneratingSKU ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {skuError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {skuError}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="7891234567890" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto..." 
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categorização */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Categorização</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name} {cat.code && <span className="text-muted-foreground">({cat.code})</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preços */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Preços</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sell_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('sell_price') < form.watch('cost_price') && form.watch('cost_price') > 0 && (
                <p className="text-sm text-warning">
                  ⚠️ O preço de venda está menor que o preço de custo
                </p>
              )}
            </div>

            {/* Estoque */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Controle de Estoque</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Máximo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="Sem limite"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reorder_point"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Reposição</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Configurações</h3>
              
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        Produto Ativo
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_variants"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        Possui Variantes
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
