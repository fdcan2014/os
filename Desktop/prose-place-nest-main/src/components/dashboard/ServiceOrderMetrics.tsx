import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useServiceOrderMetrics, 
  useTechnicianMetrics, 
  useServiceTypeMetrics 
} from '@/hooks/useServiceOrderMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wrench, 
  Clock, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ServiceOrderMetrics() {
  const { data: metrics, isLoading: metricsLoading } = useServiceOrderMetrics();
  const { data: technicianMetrics, isLoading: techLoading } = useTechnicianMetrics();
  const { data: serviceTypeMetrics, isLoading: typeLoading } = useServiceTypeMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (metricsLoading || techLoading || typeLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de OS</p>
                <p className="text-2xl font-bold">{metrics?.totalOrders || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abertas</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics?.openOrders || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.completedOrders || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{metrics?.avgCompletionDays || 0}d</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Desempenho por Técnico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!technicianMetrics || technicianMetrics.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Nenhum técnico com ordens de serviço.
              </p>
            ) : (
              <div className="space-y-4">
                {technicianMetrics.slice(0, 5).map((tech) => (
                  <div key={tech.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate max-w-[150px]">{tech.name}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {tech.completedOrders}/{tech.totalOrders} OS
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(tech.totalRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={tech.totalOrders > 0 ? (tech.completedOrders / tech.totalOrders) * 100 : 0} 
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {tech.avgCompletionHours > 0 ? `${tech.avgCompletionHours}h média` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Types Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Tipos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!serviceTypeMetrics || serviceTypeMetrics.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Nenhuma ordem de serviço registrada.
              </p>
            ) : (
              <div className="space-y-4">
                {serviceTypeMetrics.slice(0, 5).map((type) => (
                  <div key={type.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate max-w-[150px]">{type.name}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {type.totalOrders} OS ({type.percentage}%)
                        </span>
                        <span className="font-medium text-primary">
                          {formatCurrency(type.totalRevenue)}
                        </span>
                      </div>
                    </div>
                    <Progress value={type.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Receita Total de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(metrics?.totalRevenue || 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Baseado em {metrics?.totalOrders || 0} ordens de serviço
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
