import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Building2, Receipt, CreditCard, MapPin, User, Database, Save } from 'lucide-react';

export default function Settings() {
  return (
    <MainLayout title="Configurações" subtitle="Configure seu sistema ERP">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2">
          <TabsTrigger value="company" className="flex gap-2"><Building2 className="w-4 h-4" />Empresa</TabsTrigger>
          <TabsTrigger value="taxes" className="flex gap-2"><Receipt className="w-4 h-4" />Impostos</TabsTrigger>
          <TabsTrigger value="payments" className="flex gap-2"><CreditCard className="w-4 h-4" />Pagamentos</TabsTrigger>
          <TabsTrigger value="locations" className="flex gap-2"><MapPin className="w-4 h-4" />Locais</TabsTrigger>
          <TabsTrigger value="users" className="flex gap-2"><User className="w-4 h-4" />Conta</TabsTrigger>
          <TabsTrigger value="backup" className="flex gap-2"><Database className="w-4 h-4" />Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>Perfil da Empresa</CardTitle><CardDescription>Informações básicas do seu negócio</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="companyName">Nome da Empresa</Label><Input id="companyName" defaultValue="Sweet ERP" /></div>
                <div className="space-y-2"><Label htmlFor="taxId">CNPJ</Label><Input id="taxId" placeholder="Digite o CNPJ" /></div>
                <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" placeholder="contato@empresa.com" /></div>
                <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" placeholder="(11) 99999-9999" /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="address">Endereço</Label><Input id="address" placeholder="Rua, cidade, estado" /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="currency">Moeda Padrão</Label><Input id="currency" defaultValue="BRL" /></div>
                <div className="space-y-2"><Label htmlFor="taxRate">Taxa de Imposto Padrão (%)</Label><Input id="taxRate" type="number" defaultValue="10" /></div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Modelo de Recibo</h4>
                <div className="space-y-2"><Label htmlFor="receiptHeader">Texto do Cabeçalho</Label><Input id="receiptHeader" placeholder="Obrigado por comprar conosco!" /></div>
                <div className="space-y-2"><Label htmlFor="receiptFooter">Texto do Rodapé</Label><Input id="receiptFooter" placeholder="Volte sempre!" /></div>
              </div>
              <div className="flex justify-end"><Button><Save className="w-4 h-4 mr-2" />Salvar Alterações</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <Card>
            <CardHeader><CardTitle>Taxas de Impostos</CardTitle><CardDescription>Configure as taxas para seus produtos</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[{ name: 'Taxa Padrão', rate: 10, isDefault: true }, { name: 'Taxa Reduzida', rate: 5, isDefault: false }, { name: 'Isento', rate: 0, isDefault: false }].map((tax, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div><p className="font-medium">{tax.name}</p><p className="text-sm text-muted-foreground">{tax.rate}%</p></div>
                  <div className="flex items-center gap-4">{tax.isDefault && <span className="text-xs text-muted-foreground">Padrão</span>}<Switch checked={true} /></div>
                </div>
              ))}
              <Button variant="outline" className="w-full">Adicionar Taxa</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle>Formas de Pagamento</CardTitle><CardDescription>Configure as formas de pagamento aceitas</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[{ name: 'Dinheiro', type: 'dinheiro', enabled: true }, { name: 'Cartão Crédito/Débito', type: 'cartão', enabled: true }, { name: 'PIX', type: 'pix', enabled: true }, { name: 'Transferência', type: 'transferência', enabled: false }, { name: 'Outro', type: 'outro', enabled: true }].map((method, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div><p className="font-medium">{method.name}</p><p className="text-sm text-muted-foreground capitalize">{method.type}</p></div>
                  <Switch checked={method.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader><CardTitle>Locais</CardTitle><CardDescription>Gerencie depósitos e lojas</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[{ name: 'Depósito Principal', type: 'depósito', isDefault: true }, { name: 'Loja', type: 'loja', isDefault: false }].map((loc, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div><p className="font-medium">{loc.name}</p><p className="text-sm text-muted-foreground capitalize">{loc.type}</p></div>
                  <div className="flex items-center gap-4">{loc.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Padrão</span>}<Button variant="outline" size="sm">Editar</Button></div>
                </div>
              ))}
              <Button variant="outline" className="w-full">Adicionar Local</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Configurações da Conta</CardTitle><CardDescription>Gerencie suas credenciais</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="ownerEmail">E-mail</Label><Input id="ownerEmail" type="email" defaultValue="admin@exemplo.com" /></div>
                <div className="space-y-2"><Label htmlFor="currentPassword">Senha Atual</Label><Input id="currentPassword" type="password" /></div>
                <div className="space-y-2"><Label htmlFor="newPassword">Nova Senha</Label><Input id="newPassword" type="password" /></div>
                <div className="space-y-2"><Label htmlFor="confirmPassword">Confirmar Nova Senha</Label><Input id="confirmPassword" type="password" /></div>
              </div>
              <div className="flex justify-end"><Button>Atualizar Senha</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader><CardTitle>Backup e Restauração</CardTitle><CardDescription>Exporte ou importe seus dados</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg border border-dashed text-center">
                <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Exportar Dados</h4>
                <p className="text-sm text-muted-foreground mb-4">Baixe todos os seus dados como CSV ou JSON</p>
                <div className="flex justify-center gap-2"><Button variant="outline">Exportar CSV</Button><Button variant="outline">Exportar JSON</Button></div>
              </div>
              <Separator />
              <div className="p-6 rounded-lg border border-dashed text-center">
                <h4 className="font-medium mb-2">Importar Dados</h4>
                <p className="text-sm text-muted-foreground mb-4">Importe dados de um arquivo de backup</p>
                <Button variant="outline">Selecionar Arquivo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
