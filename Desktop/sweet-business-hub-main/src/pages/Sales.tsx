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
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const invoices = [
  {
    id: '1',
    number: 'FAT-2024-001',
    customer: 'João Silva',
    date: '2024-01-15',
    total: 245.0,
    paid: 245.0,
    status: 'paid',
  },
  {
    id: '2',
    number: 'FAT-2024-002',
    customer: 'Maria Santos',
    date: '2024-01-15',
    total: 89.0,
    paid: 0,
    status: 'confirmed',
  },
  {
    id: '3',
    number: 'FAT-2024-003',
    customer: 'Cliente Balcão',
    date: '2024-01-14',
    total: 599.99,
    paid: 599.99,
    status: 'paid',
  },
  {
    id: '4',
    number: 'FAT-2024-004',
    customer: 'Carlos Oliveira',
    date: '2024-01-14',
    total: 150.0,
    paid: 75.0,
    status: 'partial',
  },
  {
    id: '5',
    number: 'FAT-2024-005',
    customer: 'Ana Pereira',
    date: '2024-01-13',
    total: 320.0,
    paid: 0,
    status: 'draft',
  },
];

const statusStyles = {
  draft: 'bg-secondary text-secondary-foreground',
  confirmed: 'status-badge-warning',
  paid: 'status-badge-success',
  partial: 'status-badge-warning',
  cancelled: 'status-badge-danger',
  refunded: 'status-badge-danger',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  confirmed: 'Confirmada',
  paid: 'Paga',
  partial: 'Parcial',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

export default function Sales() {
  const [search, setSearch] = useState('');

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Vendas" subtitle="Gerenciar faturas e pedidos">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar faturas..."
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
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nº Fatura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Pago</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/30">
                <TableCell className="font-mono font-medium">
                  {invoice.number}
                </TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.date}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  R$ {invoice.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  R$ {invoice.paid.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      statusStyles[invoice.status as keyof typeof statusStyles]
                    )}
                  >
                    {statusLabels[invoice.status] || invoice.status}
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
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reembolsar
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
          Exibindo {filteredInvoices.length} de {invoices.length} faturas
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
