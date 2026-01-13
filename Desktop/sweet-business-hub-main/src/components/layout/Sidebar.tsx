import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Truck,
  Package,
  Tags,
  Users,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Store,
  Wrench,
  FolderTree,
  Award,
  Ruler,
  ClipboardList,
  Clock,
  PlayCircle,
  CheckCircle2,
  UserCog,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Painel',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Vendas',
    icon: ShoppingCart,
    items: [
      { name: 'PDV', href: '/pos', icon: ShoppingCart },
      { name: 'Vendas', href: '/sales', icon: FileText },
    ],
  },
  {
    label: 'Ordens de Serviço',
    icon: Wrench,
    items: [
      { name: 'Todas as OS', href: '/service-orders', icon: ClipboardList },
      { name: 'Abertas', href: '/service-orders?status=open', icon: Clock },
      { name: 'Em Andamento', href: '/service-orders?status=in_progress', icon: PlayCircle },
      { name: 'Concluídas', href: '/service-orders?status=completed', icon: CheckCircle2 },
      { name: 'Técnicos', href: '/technicians', icon: UserCog },
      { name: 'Tipos de Serviço', href: '/service-types', icon: ListChecks },
    ],
  },
  {
    label: 'Compras',
    icon: Truck,
    items: [
      { name: 'Compras', href: '/purchases', icon: Truck },
    ],
  },
  {
    label: 'Produtos',
    icon: Tags,
    items: [
      { name: 'Produtos', href: '/products', icon: Tags },
      { name: 'Categorias', href: '/categories', icon: FolderTree },
      { name: 'Marcas', href: '/brands', icon: Award },
      { name: 'Unidades', href: '/units', icon: Ruler },
      { name: 'Estoque', href: '/inventory', icon: Package },
    ],
  },
  {
    label: 'Pessoas',
    icon: Users,
    items: [
      { name: 'Clientes', href: '/customers', icon: Users },
      { name: 'Fornecedores', href: '/suppliers', icon: Building2 },
    ],
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    items: [
      { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    icon: Settings,
    items: [
      { name: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];

const SIDEBAR_STORAGE_KEY = 'sweet-erp-sidebar-state';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).collapsed ?? false;
      } catch {
        return false;
      }
    }
    return false;
  });
  const location = useLocation();
  
  // Track which groups are open - load from localStorage or default to active group
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.openGroups)) {
          return parsed.openGroups;
        }
      } catch {
        // Fall through to default
      }
    }
    const activeGroup = navigationGroups.find(group =>
      group.items.some(item => 
        location.pathname === item.href || 
        (item.href !== '/' && location.pathname.startsWith(item.href))
      )
    );
    return activeGroup ? [activeGroup.label] : ['Painel'];
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({
      collapsed,
      openGroups,
    }));
  }, [collapsed, openGroups]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item =>
      location.pathname === item.href ||
      (item.href !== '/' && location.pathname.startsWith(item.href))
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-sidebar',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <Store className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              Sweet ERP
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          const isActive = isGroupActive(group);
          const GroupIcon = group.icon;

          // For single-item groups, render as direct link when collapsed
          if (group.items.length === 1 && collapsed) {
            const item = group.items[0];
            const itemIsActive = location.pathname === item.href;
            
            return (
              <Tooltip key={group.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    className={cn(
                      'sidebar-nav-item justify-center px-2 mb-1',
                      itemIsActive && 'active'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          // Collapsed state - show icon with tooltip
          if (collapsed) {
            return (
              <Tooltip key={group.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCollapsed(false)}
                    className={cn(
                      'sidebar-nav-item justify-center px-2 mb-1 w-full',
                      isActive && 'active'
                    )}
                  >
                    <GroupIcon className="w-5 h-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {group.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          // Expanded state with collapsible groups
          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.label)}
              className="mb-1"
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive 
                      ? 'text-sidebar-primary bg-sidebar-accent/50' 
                      : 'text-sidebar-foreground'
                  )}
                >
                  <GroupIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <div className="pl-4 mt-1 space-y-1">
                  {group.items.map((item) => {
                    const itemIsActive = location.pathname === item.href ||
                      (item.href !== '/' && location.pathname.startsWith(item.href));

                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          itemIsActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                            : 'text-sidebar-muted'
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
