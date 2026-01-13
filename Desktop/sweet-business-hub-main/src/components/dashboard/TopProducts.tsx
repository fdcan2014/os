import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopProducts } from '@/hooks/useDashboardData';

export function TopProducts() {
  const { data: topProducts, isLoading } = useTopProducts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const products = topProducts || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Sem vendas de produtos ainda
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.sku}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {product.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    R${product.revenue.toLocaleString('pt-BR')}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {product.sold} vendidos
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
