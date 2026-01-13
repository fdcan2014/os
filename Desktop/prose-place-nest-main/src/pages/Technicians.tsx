import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserCog } from 'lucide-react';
import {
  useTechnicians,
  useCreateTechnician,
  useUpdateTechnician,
  useDeleteTechnician,
  Technician,
  TechnicianInput,
} from '@/hooks/useTechnicians';
import { TechnicianFormModal } from '@/components/technicians/TechnicianFormModal';

export default function Technicians() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null);

  const { data: technicians, isLoading } = useTechnicians();
  const createMutation = useCreateTechnician();
  const updateMutation = useUpdateTechnician();
  const deleteMutation = useDeleteTechnician();

  const filteredTechnicians = technicians?.filter((tech) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedTechnician(null);
    setIsFormOpen(true);
  };

  const handleEdit = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: TechnicianInput) => {
    if (selectedTechnician) {
      updateMutation.mutate(
        { id: selectedTechnician.id, ...data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (technicianToDelete) {
      deleteMutation.mutate(technicianToDelete.id, {
        onSuccess: () => setTechnicianToDelete(null),
      });
    }
  };

  return (
    <MainLayout title="Técnicos" subtitle="Gerencie os técnicos responsáveis pelas ordens de serviço">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Técnicos</h1>
            <p className="text-muted-foreground">
              Gerencie os técnicos responsáveis pelas ordens de serviço
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Técnico
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Lista de Técnicos
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar técnico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredTechnicians?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <UserCog className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">Nenhum técnico encontrado</p>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Tente buscar com outros termos'
                    : 'Cadastre o primeiro técnico para começar'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians?.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell className="font-medium">
                        {technician.name}
                      </TableCell>
                      <TableCell>{technician.email || '-'}</TableCell>
                      <TableCell>{technician.phone || '-'}</TableCell>
                      <TableCell>{technician.specialty || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={technician.is_active ? 'default' : 'secondary'}
                        >
                          {technician.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(technician)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTechnicianToDelete(technician)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <TechnicianFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        technician={selectedTechnician}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!technicianToDelete}
        onOpenChange={(open) => !open && setTechnicianToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o técnico "{technicianToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
