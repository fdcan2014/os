import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellPrice: number;
  costPrice: number;
  stock: number;
}

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  onProductClick: (product: Product) => void;
  currencySymbol: string;
  viewMode?: 'grid' | 'list';
}

export function ProductGrid({ products, isLoading, onProductClick, currencySymbol, viewMode = 'grid' }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          : "flex flex-col gap-2"
      )}>
        {Array.from({ length: 8 }).map((_, i) => (
          viewMode === 'grid' ? (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-8" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm">Tente buscar por outro termo</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <Card
            key={product.id}
            className={cn(
              'cursor-pointer hover:border-primary hover:shadow-card-hover transition-all',
              product.stock <= 0 && 'opacity-50 pointer-events-none'
            )}
            onClick={() => product.stock > 0 && onProductClick(product)}
          >
            <CardContent className="p-3 flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-muted-foreground">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
              </div>
              <span className="font-bold text-primary whitespace-nowrap">
                {currencySymbol} {product.sellPrice.toFixed(2)}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs shrink-0', product.stock < 10 && product.stock > 0 && 'status-badge-warning', product.stock <= 0 && 'status-badge-danger')}
              >
                {product.stock <= 0 ? 'Esgotado' : product.stock}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => (
        <Card
          key={product.id}
          className={cn(
            'cursor-pointer hover:border-primary hover:shadow-card-hover transition-all',
            product.stock <= 0 && 'opacity-50 pointer-events-none'
          )}
          onClick={() => product.stock > 0 && onProductClick(product)}
        >
          <CardContent className="p-4">
            <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="font-medium text-sm line-clamp-2">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{product.sku}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary">
                {currencySymbol} {product.sellPrice.toFixed(2)}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs', product.stock < 10 && product.stock > 0 && 'status-badge-warning', product.stock <= 0 && 'status-badge-danger')}
              >
                {product.stock <= 0 ? 'Esgotado' : product.stock}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
