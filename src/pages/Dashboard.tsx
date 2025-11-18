import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, LogOut, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Orcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  ambiente: string;
  total_geral: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<Orcamento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchOrcamentos();
  }, []);

  useEffect(() => {
    filterOrcamentos();
  }, [searchTerm, statusFilter, orcamentos]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrcamentos(data || []);
      setFilteredOrcamentos(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível carregar a lista de orçamentos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrcamentos = () => {
    let filtered = orcamentos;

    if (searchTerm) {
      filtered = filtered.filter(
        (orc) =>
          orc.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orc.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((orc) => orc.status === statusFilter);
    }

    setFilteredOrcamentos(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "secondary",
      enviado: "default",
      aprovado: "default",
      rejeitado: "destructive",
    };

    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      enviado: "Enviado",
      aprovado: "Aprovado",
      rejeitado: "Rejeitado",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sistema de Orçamentos</h1>
            <p className="text-sm text-muted-foreground">Prisma Interiores</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Novo Orçamento</CardTitle>
              <CardDescription>
                Crie um novo orçamento para um cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/criar-orcamento")} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Criar Orçamento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Resumo dos orçamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{orcamentos.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orcamentos.filter((o) => o.status === "enviado").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orçamentos</CardTitle>
            <CardDescription>Lista de todos os orçamentos criados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        {searchTerm || statusFilter !== "all"
                          ? "Nenhum orçamento encontrado"
                          : "Nenhum orçamento criado ainda"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrcamentos.map((orcamento) => (
                      <TableRow key={orcamento.id}>
                        <TableCell className="font-medium">{orcamento.codigo}</TableCell>
                        <TableCell>{orcamento.cliente_nome}</TableCell>
                        <TableCell>{orcamento.ambiente}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(orcamento.total_geral)}
                        </TableCell>
                        <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                        <TableCell>
                          {new Date(orcamento.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/orcamento/${orcamento.id}`)}
                          >
                            Ver detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
