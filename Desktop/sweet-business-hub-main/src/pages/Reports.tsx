import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Truck,
  DollarSign,
  Download,
  Calendar,
} from 'lucide-react';

const reports = [
  {
    id: 'daily-sales',
    name: 'Resumo Diário de Vendas',
    description: 'Visão geral de vendas, receita e transações por dia',
    icon: DollarSign,
    category: 'Vendas',
  },
  {
    id: 'sales-by-product',
    name: 'Vendas por Produto',
    description: 'Detalhamento de receita e quantidade por produto',
    icon: BarChart3,
    category: 'Vendas',
  },
  {
    id: 'sales-by-category',
    name: 'Vendas por Categoria',
    description: 'Análise de desempenho por categoria de produto',
    icon: TrendingUp,
    category: 'Vendas',
  },
  {
    id: 'gross-margin',
    name: 'Relatório de Margem Bruta',
    description: 'Margens de lucro e análise de custos',
    icon: TrendingUp,
    category: 'Financeiro',
  },
  {
    id: 'stock-on-hand',
    name: 'Estoque Disponível',
    description: 'Níveis atuais de inventário por local',
    icon: Package,
    category: 'Estoque',
  },
  {
    id: 'inventory-valuation',
    name: 'Valorização de Estoque',
    description: 'Valor total do estoque a custo e preço de venda',
    icon: Package,
    category: 'Estoque',
  },
  {
    id: 'purchases-by-supplier',
    name: 'Compras por Fornecedor',
    description: 'Totais e tendências de pedidos de compra por fornecedor',
    icon: Truck,
    category: 'Compras',
  },
  {
    id: 'top-customers',
    name: 'Principais Clientes',
    description: 'Clientes com maior receita e histórico de compras',
    icon: Users,
    category: 'Clientes',
  },
];

export default function Reports() {
  return (
    <MainLayout title="Relatórios" subtitle="Gerar e exportar relatórios do negócio">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="inventory">Estoque</SelectItem>
            <SelectItem value="finance">Financeiro</SelectItem>
            <SelectItem value="purchasing">Compras</SelectItem>
            <SelectItem value="customers">Clientes</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Período
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="hover:border-primary hover:shadow-card-hover transition-all cursor-pointer"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <report.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {report.category}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{report.description}</CardDescription>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Ver Relatório
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
