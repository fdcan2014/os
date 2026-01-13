import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ServiceOrderMetrics } from '@/components/dashboard/ServiceOrderMetrics';
import { useDashboardMetrics } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/animations/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  const calculateTrend = (today: number, yesterday: number) => {
    if (yesterday === 0) return { value: 0, isPositive: true };
    const change = ((today - yesterday) / yesterday) * 100;
    return { value: Math.abs(Math.round(change * 10) / 10), isPositive: change >= 0 };
  };

  return (
    <MainLayout title="Painel" subtitle="Bem-vindo de volta! Veja o que está acontecendo hoje.">
      {/* Metrics Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <StaggerItem key={i}>
                <div className="metric-card">
                  <Skeleton className="h-20 w-full" />
                </div>
              </StaggerItem>
            ))}
          </>
        ) : (
          <>
            <StaggerItem>
              <MetricCard
                title="Vendas de Hoje"
                value={`R$${(metrics?.todaySales || 0).toLocaleString('pt-BR')}`}
                icon={<DollarSign className="w-6 h-6" />}
                trend={calculateTrend(metrics?.todaySales || 0, metrics?.yesterdaySales || 0)}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Pedidos"
                value={metrics?.todayOrders || 0}
                icon={<ShoppingCart className="w-6 h-6" />}
                trend={calculateTrend(metrics?.todayOrders || 0, metrics?.yesterdayOrders || 0)}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Lucro Bruto"
                value={`R$${(metrics?.grossProfit || 0).toLocaleString('pt-BR')}`}
                icon={<TrendingUp className="w-6 h-6" />}
                trend={calculateTrend(metrics?.grossProfit || 0, metrics?.yesterdayProfit || 0)}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Estoque Baixo"
                value={metrics?.lowStockCount || 0}
                icon={<AlertTriangle className="w-6 h-6" />}
                subtitle={metrics?.lowStockCount ? "Requer atenção" : "Tudo abastecido"}
              />
            </StaggerItem>
          </>
        )}
      </StaggerContainer>

      {/* Tabs for Sales and Service Orders */}
      <Tabs defaultValue="sales" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="sales" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Ordens de Serviço
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FadeIn delay={0.3} className="lg:col-span-2">
              <SalesChart />
            </FadeIn>
            <FadeIn delay={0.4}>
              <QuickActions />
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FadeIn delay={0.5}>
              <TopProducts />
            </FadeIn>
            <FadeIn delay={0.6}>
              <RecentActivity />
            </FadeIn>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <FadeIn delay={0.3}>
            <ServiceOrderMetrics />
          </FadeIn>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
