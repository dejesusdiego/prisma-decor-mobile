import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  List,
  CalendarDays,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { CalendarioVisitas } from "./CalendarioVisitas";

interface SolicitacaoVisita {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  endereco: string | null;
  complemento: string | null;
  mensagem: string | null;
  data_agendada: string;
  horario_agendado: string;
  status: string;
  visualizada: boolean;
  visualizada_em: string | null;
  observacoes_internas: string | null;
  created_at: string;
  updated_at: string;
}

interface SolicitacoesVisitaProps {
  onNavigate: (view: string) => void;
  onCreateOrcamento?: (clienteData: { nome: string; telefone: string; endereco: string; cidade: string }) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: <AlertCircle className="h-3 w-3" /> },
  confirmada: { label: "Confirmada", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  sem_resposta: { label: "Sem Resposta", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", icon: <Clock className="h-3 w-3" /> },
  realizada: { label: "Realizada", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  cancelada: { label: "Cancelada", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
};

export function SolicitacoesVisita({ onNavigate, onCreateOrcamento }: SolicitacoesVisitaProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos");
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoVisita | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [solicitacaoToDelete, setSolicitacaoToDelete] = useState<SolicitacaoVisita | null>(null);
  
  // Estado para criação/edição manual
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [cidadeOutra, setCidadeOutra] = useState("");
  const [newVisit, setNewVisit] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "Balneário Camboriú",
    endereco: "",
    complemento: "",
    mensagem: "",
    data_agendada: "",
    horario_agendado: "",
  });

  const cidadesPreDefinidas = [
    "Balneário Camboriú",
    "Itajaí",
    "Camboriú",
    "Itapema",
    "Navegantes",
    "Blumenau",
    "Florianópolis",
  ];

  const isCidadeCustom = !cidadesPreDefinidas.includes(newVisit.cidade) && newVisit.cidade !== "Outra";

  const resetForm = () => {
    setNewVisit({
      nome: "",
      email: "",
      telefone: "",
      cidade: "Balneário Camboriú",
      endereco: "",
      complemento: "",
      mensagem: "",
      data_agendada: "",
      horario_agendado: "",
    });
    setCidadeOutra("");
    setEditingVisitId(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditVisit = (solicitacao: SolicitacaoVisita) => {
    const cidadeValue = cidadesPreDefinidas.includes(solicitacao.cidade) 
      ? solicitacao.cidade 
      : "Outra";
    
    setNewVisit({
      nome: solicitacao.nome,
      email: solicitacao.email.includes("@whatsapp.manual") ? "" : solicitacao.email,
      telefone: solicitacao.telefone,
      cidade: cidadeValue,
      endereco: solicitacao.endereco || "",
      complemento: solicitacao.complemento || "",
      mensagem: solicitacao.mensagem || "",
      data_agendada: solicitacao.data_agendada,
      horario_agendado: solicitacao.horario_agendado,
    });
    
    if (cidadeValue === "Outra") {
      setCidadeOutra(solicitacao.cidade);
    } else {
      setCidadeOutra("");
    }
    
    setEditingVisitId(solicitacao.id);
    setCreateDialogOpen(true);
  };

  const fetchSolicitacoes = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("solicitacoes_visita")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setSolicitacoes((data as unknown as SolicitacaoVisita[]) || []);
      
      // Marcar como visualizadas
      const naoVisualizadas = data?.filter(s => !s.visualizada).map(s => s.id) || [];
      if (naoVisualizadas.length > 0 && user) {
        await supabase
          .from("solicitacoes_visita")
          .update({ 
            visualizada: true, 
            visualizada_em: new Date().toISOString(),
            visualizada_por: user.id
          })
          .in("id", naoVisualizadas)
          .eq("organization_id", organizationId);
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchSolicitacoes();
    }
  }, [organizationId]);

  const formatWhatsAppLink = (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, "");
    const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    return `https://wa.me/${withCountry}`;
  };

  const formatWhatsAppConfirmationMessage = (solicitacao: SolicitacaoVisita) => {
    const dataFormatada = format(parseISO(solicitacao.data_agendada), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    // Montar endereço completo
    let enderecoCompleto = solicitacao.endereco || "";
    if (solicitacao.complemento) {
      enderecoCompleto += `, ${solicitacao.complemento}`;
    }
    if (solicitacao.cidade) {
      enderecoCompleto += enderecoCompleto ? ` - ${solicitacao.cidade}` : solicitacao.cidade;
    }

    const message = `Olá *${solicitacao.nome}*! 👋

Somos da *Prisma Interiores* e recebemos sua solicitação de visita técnica. 🏠

Por favor, *confirme se as informações abaixo estão corretas*:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${solicitacao.horario_agendado}
📍 *Endereço:* ${enderecoCompleto}
📱 *Telefone:* ${solicitacao.telefone}${solicitacao.mensagem ? `

💬 *Sua mensagem:* "${solicitacao.mensagem}"` : ""}

━━━━━━━━━━━━━━━━━━━━━

✅ *Responda com "CONFIRMO"* se tudo estiver correto.

❌ Se precisar alterar algo, nos informe qual informação deve ser corrigida.

Aguardamos sua confirmação para finalizar o agendamento!

_Prisma Interiores - Transformando ambientes_ ✨`;
    return message;
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!organizationId) return;
    try {
      const { error } = await supabase
        .from("solicitacoes_visita")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) throw error;
      
      const solicitacao = solicitacoes.find(s => s.id === id);
      
      setSolicitacoes(prev => 
        prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
      );
      
      // Se status mudou para "confirmada", abrir WhatsApp
      // O trigger do banco cuida da criação de contato e atividade CRM automaticamente
      if (newStatus === "confirmada" && solicitacao) {
        const message = formatWhatsAppConfirmationMessage(solicitacao);
        const whatsappUrl = `${formatWhatsAppLink(solicitacao.telefone)}?text=${encodeURIComponent(message)}`;
        
        toast.success("Status atualizado! Abrindo WhatsApp...");
        
        // Pequeno delay para o usuário ver o toast
        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
        }, 500);
      } else {
        toast.success("Status atualizado");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSaveObservacoes = async () => {
    if (!selectedSolicitacao || !organizationId) return;
    
    try {
      const { error } = await supabase
        .from("solicitacoes_visita")
        .update({ observacoes_internas: observacoes })
        .eq("id", selectedSolicitacao.id)
        .eq("organization_id", organizationId);

      if (error) throw error;
      
      setSolicitacoes(prev => 
        prev.map(s => s.id === selectedSolicitacao.id ? { ...s, observacoes_internas: observacoes } : s)
      );
      toast.success("Observações salvas");
    } catch (error) {
      console.error("Erro ao salvar observações:", error);
      toast.error("Erro ao salvar observações");
    }
  };

  const handleCreateOrcamento = (solicitacao: SolicitacaoVisita) => {
    if (onCreateOrcamento) {
      onCreateOrcamento({
        nome: solicitacao.nome,
        telefone: solicitacao.telefone,
        endereco: solicitacao.endereco || "",
        cidade: solicitacao.cidade
      });
    }
  };

  const openDetails = (solicitacao: SolicitacaoVisita) => {
    setSelectedSolicitacao(solicitacao);
    setObservacoes(solicitacao.observacoes_internas || "");
    setDialogOpen(true);
  };

  const handleDeleteClick = (solicitacao: SolicitacaoVisita) => {
    setSolicitacaoToDelete(solicitacao);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!solicitacaoToDelete || !organizationId) return;
    
    try {
      const { error } = await supabase
        .from("solicitacoes_visita")
        .delete()
        .eq("id", solicitacaoToDelete.id)
        .eq("organization_id", organizationId);

      if (error) throw error;
      
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitacaoToDelete.id));
      toast.success("Solicitação excluída com sucesso");
    } catch (error) {
      console.error("Erro ao excluir solicitação:", error);
      toast.error("Erro ao excluir solicitação");
    } finally {
      setDeleteDialogOpen(false);
      setSolicitacaoToDelete(null);
    }
  };

  // Filtros
  const filteredSolicitacoes = solicitacoes.filter(s => {
    // Filtro de busca
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      s.nome.toLowerCase().includes(searchLower) ||
      s.telefone.includes(searchTerm) ||
      s.cidade.toLowerCase().includes(searchLower);
    
    // Filtro de status
    const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
    
    // Filtro de período
    let matchesPeriodo = true;
    if (periodoFilter !== "todos") {
      const dataAgendada = parseISO(s.data_agendada);
      if (periodoFilter === "hoje") matchesPeriodo = isToday(dataAgendada);
      else if (periodoFilter === "semana") matchesPeriodo = isThisWeek(dataAgendada);
      else if (periodoFilter === "mes") matchesPeriodo = isThisMonth(dataAgendada);
    }
    
    return matchesSearch && matchesStatus && matchesPeriodo;
  });

  // Estatísticas
  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === "pendente").length,
    confirmadas: solicitacoes.filter(s => s.status === "confirmada").length,
    hoje: solicitacoes.filter(s => isToday(parseISO(s.data_agendada))).length,
  };

  // Função para selecionar uma visita do calendário
  const handleSelectVisitaCalendario = (visita: { id: string }) => {
    const solicitacao = solicitacoes.find(s => s.id === visita.id);
    if (solicitacao) {
      openDetails(solicitacao);
    }
  };

  // Criar ou editar visita
  const handleCreateVisit = async () => {
    const cidadeFinal = newVisit.cidade === "Outra" ? cidadeOutra : newVisit.cidade;
    
    if (!newVisit.nome || !newVisit.telefone || !newVisit.data_agendada || !newVisit.horario_agendado || !cidadeFinal) {
      toast.error("Preencha os campos obrigatórios: Nome, Telefone, Cidade, Data e Horário");
      return;
    }

    setCreatingVisit(true);
    try {
      const visitData = {
        nome: newVisit.nome,
        email: newVisit.email || `${newVisit.telefone.replace(/\D/g, "")}@whatsapp.manual`,
        telefone: newVisit.telefone,
        cidade: cidadeFinal,
        endereco: newVisit.endereco || null,
        complemento: newVisit.complemento || null,
        mensagem: newVisit.mensagem || null,
        data_agendada: newVisit.data_agendada,
        horario_agendado: newVisit.horario_agendado,
      };

      if (editingVisitId) {
        // Atualizar visita existente
        const { data, error } = await supabase
          .from("solicitacoes_visita")
          .update(visitData)
          .eq("id", editingVisitId)
          .eq("organization_id", organizationId)
          .select()
          .single();

        if (error) throw error;

        setSolicitacoes(prev => 
          prev.map(s => s.id === editingVisitId ? (data as unknown as SolicitacaoVisita) : s)
        );
        toast.success("Visita atualizada com sucesso!");
      } else {
        // Criar nova visita
        const { data, error } = await supabase
          .from("solicitacoes_visita")
          .insert({
            ...visitData,
            status: "pendente",
            visualizada: true,
            visualizada_em: new Date().toISOString(),
            visualizada_por: user?.id,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (error) throw error;

        setSolicitacoes(prev => [data as unknown as SolicitacaoVisita, ...prev]);
        toast.success("Visita criada com sucesso!");
      }

      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar visita:", error);
      toast.error(editingVisitId ? "Erro ao atualizar visita" : "Erro ao criar visita");
    } finally {
      setCreatingVisit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solicitações de Visita</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de visita do site</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Visita
          </Button>
          <Button onClick={fetchSolicitacoes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.hoje}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para alternar entre lista e calendário */}
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="mt-4">
          <CalendarioVisitas
            visitas={solicitacoes.map(s => ({
              id: s.id,
              nome: s.nome,
              telefone: s.telefone,
              cidade: s.cidade,
              data_agendada: s.data_agendada,
              horario_agendado: s.horario_agendado,
              status: s.status,
            }))}
            onSelectVisita={handleSelectVisitaCalendario}
          />
        </TabsContent>

        <TabsContent value="lista" className="mt-4 space-y-4">

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="sem_resposta">Sem Resposta</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Esta semana</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Data/Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredSolicitacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredSolicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!solicitacao.visualizada && (
                          <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium">{solicitacao.nome}</div>
                          {!solicitacao.email.includes("@whatsapp.manual") && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {solicitacao.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={formatWhatsAppLink(solicitacao.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {solicitacao.telefone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {solicitacao.cidade}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(parseISO(solicitacao.data_agendada), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {solicitacao.horario_agendado}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={solicitacao.status}
                        onValueChange={(value) => handleStatusChange(solicitacao.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig[solicitacao.status]?.color} flex items-center gap-1`}
                            >
                              {statusConfig[solicitacao.status]?.icon}
                              {statusConfig[solicitacao.status]?.label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(solicitacao)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVisit(solicitacao)}
                          title="Editar visita"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCreateOrcamento(solicitacao)}
                          title="Criar orçamento"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(solicitacao)}
                          title="Excluir solicitação"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Detalhes da Solicitação
            </DialogTitle>
          </DialogHeader>
          
          {selectedSolicitacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nome</label>
                  <p className="font-medium">{selectedSolicitacao.nome}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Telefone</label>
                  <a 
                    href={formatWhatsAppLink(selectedSolicitacao.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-600 hover:underline block"
                  >
                    {selectedSolicitacao.telefone}
                  </a>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedSolicitacao.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cidade</label>
                  <p className="font-medium">{selectedSolicitacao.cidade}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground">Endereço</label>
                  <p className="font-medium">
                    {selectedSolicitacao.endereco || "-"}
                    {selectedSolicitacao.complemento && ` - ${selectedSolicitacao.complemento}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Data Agendada</label>
                  <p className="font-medium">
                    {format(parseISO(selectedSolicitacao.data_agendada), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Horário</label>
                  <p className="font-medium">{selectedSolicitacao.horario_agendado}</p>
                </div>
              </div>

              {selectedSolicitacao.mensagem && (
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Mensagem do Cliente
                  </label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedSolicitacao.mensagem}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Observações Internas</label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações internas sobre esta visita..."
                  className="mt-1"
                  rows={3}
                />
                <Button 
                  onClick={handleSaveObservacoes} 
                  size="sm" 
                  className="mt-2"
                >
                  Salvar Observações
                </Button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleCreateOrcamento(selectedSolicitacao);
                    setDialogOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Orçamento
                </Button>
                <Button
                  className="flex-1"
                  asChild
                >
                  <a 
                    href={formatWhatsAppLink(selectedSolicitacao.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a solicitação de visita de{" "}
              <strong>{solicitacaoToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Criação/Edição de Visita */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setCreateDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingVisitId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingVisitId ? "Editar Visita" : "Nova Visita Manual"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente *</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={newVisit.nome}
                onChange={(e) => setNewVisit(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  placeholder="(47) 99999-9999"
                  value={newVisit.telefone}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newVisit.email}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Select 
                value={cidadesPreDefinidas.includes(newVisit.cidade) ? newVisit.cidade : "Outra"} 
                onValueChange={(value) => {
                  setNewVisit(prev => ({ ...prev, cidade: value }));
                  if (value !== "Outra") {
                    setCidadeOutra("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidadesPreDefinidas.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newVisit.cidade === "Outra" || isCidadeCustom) && (
              <div className="space-y-2">
                <Label htmlFor="cidadeOutra">Nome da Cidade *</Label>
                <Input
                  id="cidadeOutra"
                  placeholder="Digite o nome da cidade"
                  value={cidadeOutra}
                  onChange={(e) => setCidadeOutra(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, número"
                value={newVisit.endereco}
                onChange={(e) => setNewVisit(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                placeholder="Apartamento, bloco..."
                value={newVisit.complemento}
                onChange={(e) => setNewVisit(prev => ({ ...prev, complemento: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={newVisit.data_agendada}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, data_agendada: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario">Horário *</Label>
                <Select 
                  value={newVisit.horario_agendado} 
                  onValueChange={(value) => setNewVisit(prev => ({ ...prev, horario_agendado: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00 - 10:00">09:00 - 10:00</SelectItem>
                    <SelectItem value="10:00 - 11:00">10:00 - 11:00</SelectItem>
                    <SelectItem value="11:00 - 12:00">11:00 - 12:00</SelectItem>
                    <SelectItem value="13:00 - 14:00">13:00 - 14:00</SelectItem>
                    <SelectItem value="14:00 - 15:00">14:00 - 15:00</SelectItem>
                    <SelectItem value="15:00 - 16:00">15:00 - 16:00</SelectItem>
                    <SelectItem value="16:00 - 17:00">16:00 - 17:00</SelectItem>
                    <SelectItem value="17:00 - 18:00">17:00 - 18:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Observações</Label>
              <Textarea
                id="mensagem"
                placeholder="Informações adicionais sobre a visita..."
                value={newVisit.mensagem}
                onChange={(e) => setNewVisit(prev => ({ ...prev, mensagem: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateVisit}
                disabled={creatingVisit}
              >
                {creatingVisit ? "Salvando..." : editingVisitId ? "Salvar Alterações" : "Criar Visita"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
