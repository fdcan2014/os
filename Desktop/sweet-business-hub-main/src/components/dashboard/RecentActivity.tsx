import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Truck, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRecentActivity, RecentActivityItem } from '@/hooks/useDashboardData';

const typeStyles = {
  sale: 'bg-success/10 text-success',
  stock: 'bg-primary/10 text-primary',
  alert: 'bg-warning/10 text-warning',
  purchase: 'bg-accent text-accent-foreground',
};

const typeIcons = {
  sale: ShoppingCart,
  stock: Package,
  alert: AlertTriangle,
  purchase: Truck,
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activityList = activities || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {activityList.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Sem atividade recente
          </div>
        ) : (
          <div className="space-y-4">
            {activityList.map((activity) => {
              const Icon = typeIcons[activity.type];
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                      typeStyles[activity.type]
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
