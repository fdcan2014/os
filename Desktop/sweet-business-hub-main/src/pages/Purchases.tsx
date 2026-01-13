import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, MoreVertical, Eye, Package, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const purchaseOrders = [
  {
    id: '1',
    number: 'OC-2024-001',
    supplier: 'TechSupply Ltda',
    date: '2024-01-15',
    expectedDate: '2024-01-20',
    total: 2450.0,
    status: 'approved',
  },
  {
    id: '2',
    number: 'OC-2024-002',
    supplier: 'GadgetWorld Inc.',
    date: '2024-01-14',
    expectedDate: '2024-01-18',
    total: 890.0,
    status: 'received',
  },
  {
    id: '3',
    number: 'OC-2024-003',
    supplier: 'AcessóriosHub',
    date: '2024-01-13',
    expectedDate: '2024-01-22',
    total: 1200.0,
    status: 'partial',
  },
  {
    id: '4',
    number: 'OC-2024-004',
    supplier: 'ElectroMart',
    date: '2024-01-12',
    expectedDate: '2024-01-19',
    total: 3500.0,
    status: 'draft',
  },
];

const statusStyles = {
  draft: 'bg-secondary text-secondary-foreground',
  approved: 'status-badge-warning',
  partial: 'status-badge-warning',
  received: 'status-badge-success',
  cancelled: 'status-badge-danger',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  approved: 'Aprovado',
  partial: 'Parcial',
  received: 'Recebido',
  cancelled: 'Cancelado',
};

export default function Purchases() {
  const [search, setSearch] = useState('');

  const filteredOrders = purchaseOrders.filter(
    (po) =>
      po.number.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Compras" subtitle="Gerenciar pedidos de compra e faturas de fornecedores">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos de compra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Compra
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data Pedido</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30">
                <TableCell className="font-mono font-medium">
                  {order.number}
                </TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell className="text-muted-foreground">{order.date}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.expectedDate}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  R$ {order.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      statusStyles[order.status as keyof typeof statusStyles]
                    )}
                  >
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Package className="w-4 h-4 mr-2" />
                        Receber
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredOrders.length} de {purchaseOrders.length} pedidos
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Próximo
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
