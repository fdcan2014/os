import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stockItems = [
  {
    id: '1',
    sku: 'FO-001',
    name: 'Fone de Ouvido Bluetooth',
    warehouse: 124,
    store: 12,
    total: 136,
    reorderPoint: 20,
  },
  {
    id: '2',
    sku: 'CB-003',
    name: 'Cabo USB-C (Pacote)',
    warehouse: 3,
    store: 2,
    total: 5,
    reorderPoint: 25,
  },
  {
    id: '3',
    sku: 'SN-007',
    name: 'Suporte para Notebook',
    warehouse: 35,
    store: 8,
    total: 43,
    reorderPoint: 15,
  },
  {
    id: '4',
    sku: 'TM-012',
    name: 'Teclado Mecânico',
    warehouse: 20,
    store: 8,
    total: 28,
    reorderPoint: 10,
  },
  {
    id: '5',
    sku: 'MP-021',
    name: 'Mouse Pad XL',
    warehouse: 50,
    store: 17,
    total: 67,
    reorderPoint: 30,
  },
];

const movements = [
  {
    id: '1',
    date: '2024-01-15 14:32',
    type: 'sale',
    product: 'Fone de Ouvido Bluetooth',
    quantity: -2,
    location: 'Loja',
    reference: 'FAT-2024-001',
  },
  {
    id: '2',
    date: '2024-01-15 10:15',
    type: 'receipt',
    product: 'Cabo USB-C (Pacote)',
    quantity: 50,
    location: 'Depósito Principal',
    reference: 'OC-2024-002',
  },
  {
    id: '3',
    date: '2024-01-14 16:45',
    type: 'transfer',
    product: 'Suporte para Notebook',
    quantity: 10,
    location: 'Depósito → Loja',
    reference: 'TRF-001',
  },
  {
    id: '4',
    date: '2024-01-14 09:00',
    type: 'adjustment',
    product: 'Teclado Mecânico',
    quantity: -1,
    location: 'Depósito Principal',
    reference: 'AJU-001',
  },
];

const movementStyles = {
  sale: 'text-destructive',
  receipt: 'text-success',
  transfer: 'text-primary',
  adjustment: 'text-warning',
};

const movementLabels: Record<string, string> = {
  sale: 'Venda',
  receipt: 'Recebimento',
  transfer: 'Transferência',
  adjustment: 'Ajuste',
};

export default function Inventory() {
  const [search, setSearch] = useState('');

  const filteredStock = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = stockItems.filter((s) => s.total <= s.reorderPoint).length;

  return (
    <MainLayout title="Estoque" subtitle="Acompanhar níveis de estoque e movimentações">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{stockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entrada (Hoje)</p>
                <p className="text-2xl font-bold">+50</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saída (Hoje)</p>
                <p className="text-2xl font-bold">-3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="stock">Níveis de Estoque</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transferir
            </Button>
            <Button variant="outline">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Contagem
            </Button>
          </div>
        </div>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Locais</SelectItem>
                <SelectItem value="warehouse">Depósito Principal</SelectItem>
                <SelectItem value="store">Loja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Depósito</TableHead>
                  <TableHead className="text-right">Loja</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => {
                  const isLow = item.total <= item.reorderPoint;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.warehouse}</TableCell>
                      <TableCell className="text-right">{item.store}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold',
                          isLow && 'text-destructive'
                        )}
                      >
                        {item.total}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge className="status-badge-danger">Estoque Baixo</Badge>
                        ) : (
                          <Badge className="status-badge-success">Em Estoque</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((mov) => (
                  <TableRow key={mov.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground text-sm">
                      {mov.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {movementLabels[mov.type] || mov.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mov.product}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-medium',
                        movementStyles[mov.type as keyof typeof movementStyles]
                      )}
                    >
                      {mov.quantity > 0 ? '+' : ''}
                      {mov.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mov.location}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{mov.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
