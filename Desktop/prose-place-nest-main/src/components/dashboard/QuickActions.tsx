import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  ShoppingCart,
  Package,
  Truck,
  Users,
  FileText,
} from 'lucide-react';

const actions = [
  { name: 'Nova Venda', href: '/pos', icon: ShoppingCart, color: 'text-success' },
  { name: 'Novo Produto', href: '/products/new', icon: Plus, color: 'text-primary' },
  { name: 'Contagem', href: '/inventory/count', icon: Package, color: 'text-warning' },
  { name: 'Nova Compra', href: '/purchases/new', icon: Truck, color: 'text-accent-foreground' },
  { name: 'Novo Cliente', href: '/customers/new', icon: Users, color: 'text-primary' },
  { name: 'Ver Relatórios', href: '/reports', icon: FileText, color: 'text-muted-foreground' },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.name} to={action.href} className="quick-action">
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-sm font-medium text-foreground">
                {action.name}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
