import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import logoPng from '@/assets/logo-prisma-pdf.png';
import { STATUS_ITEM_LABELS, PRIORIDADE_LABELS } from '@/hooks/useProducaoData';
import { parseDateOnly } from '@/lib/dateOnly';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidoData {
  id: string;
  numero_pedido: string;
  data_entrada: string;
  previsao_entrega: string | null;
  prioridade: string;
  status_producao: string;
  observacoes_producao: string | null;
  orcamento: {
    codigo: string;
    cliente_nome: string;
    cliente_telefone: string;
    endereco: string;
    cidade: string | null;
    observacoes: string | null;
  };
  itens_pedido: Array<{
    id: string;
    status_item: string;
    responsavel: string | null;
    cortina_item: {
      nome_identificacao: string;
      tipo_cortina: string;
      tipo_produto: string | null;
      largura: number;
      altura: number;
      quantidade: number;
      ambiente: string | null;
      tecido_id: string | null;
      forro_id: string | null;
      trilho_id: string | null;
      motor_id: string | null;
      barra_cm: number | null;
      observacoes_internas: string | null;
      motorizada: boolean | null;
    };
  }>;
}

function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  return telefone;
}

function formatarData(dataStr: string): string {
  // Usar parseDateOnly para campos DATE-only (evita bug de timezone)
  const date = parseDateOnly(dataStr);
  if (date) {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  }
  return '-';
}

// Gera QR Code simples como texto base64 (usando um serviço de QR code)
function getQRCodeUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(data)}`;
}

export async function gerarPdfProducao(pedidoId: string): Promise<void> {
  try {
    // Buscar dados do pedido com itens
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        orcamento:orcamentos(
          codigo,
          cliente_nome,
          cliente_telefone,
          endereco,
          cidade,
          observacoes
        ),
        itens_pedido(
          id,
          status_item,
          responsavel,
          cortina_item:cortina_items(
            nome_identificacao,
            tipo_cortina,
            tipo_produto,
            largura,
            altura,
            quantidade,
            ambiente,
            tecido_id,
            forro_id,
            trilho_id,
            motor_id,
            barra_cm,
            observacoes_internas,
            motorizada
          )
        )
      `)
      .eq('id', pedidoId)
      .maybeSingle();

    if (error) throw error;
    
    if (!pedido) {
      throw new Error('Pedido não encontrado');
    }

    // Buscar materiais para nomes
    const materialIds = new Set<string>();
    pedido.itens_pedido.forEach((item: any) => {
      if (item.cortina_item?.tecido_id) materialIds.add(item.cortina_item.tecido_id);
      if (item.cortina_item?.forro_id) materialIds.add(item.cortina_item.forro_id);
      if (item.cortina_item?.trilho_id) materialIds.add(item.cortina_item.trilho_id);
      if (item.cortina_item?.motor_id) materialIds.add(item.cortina_item.motor_id);
    });

    const { data: materiais } = await supabase
      .from('materiais')
      .select('id, nome, categoria, cor, fornecedor')
      .in('id', Array.from(materialIds));

    const materiaisMap = new Map(materiais?.map(m => [m.id, m]) || []);

    // Criar PDF
    const doc = new jsPDF();
    let yPos = 0;

    // ============================================================
    // 1. CABEÇALHO
    // ============================================================
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 210, 30, 'F');
    
    yPos = 10;
    try {
      doc.addImage(logoPng, 'PNG', 15, yPos, 10, 10);
    } catch (e) {
      console.error('Erro ao adicionar logo:', e);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FICHA DE PRODUÇÃO', 28, yPos + 7);

    // Código do pedido em destaque
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(pedido.numero_pedido, 195, yPos + 4, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Orçamento: ${pedido.orcamento?.codigo}`, 195, yPos + 10, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    yPos = 38;

    // ============================================================
    // 2. INFORMAÇÕES DO PEDIDO + QR CODE
    // ============================================================
    
    const cardX = 12;
    const cardWidth = 186;

    // Row com informações e prioridade
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    
    const prioridadeInfo = PRIORIDADE_LABELS[pedido.prioridade];
    const prioridadeLabel = prioridadeInfo?.label || pedido.prioridade;
    
    // Badge de prioridade
    const prioridadeWidth = doc.getTextWidth(`PRIORIDADE: ${prioridadeLabel}`) + 8;
    let badgeColor = [150, 150, 150]; // cinza padrão
    if (pedido.prioridade === 'urgente') badgeColor = [220, 38, 38];
    else if (pedido.prioridade === 'alta') badgeColor = [234, 88, 12];
    else if (pedido.prioridade === 'normal') badgeColor = [59, 130, 246];
    else if (pedido.prioridade === 'baixa') badgeColor = [107, 114, 128];
    
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(cardX, yPos - 4, prioridadeWidth, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`PRIORIDADE: ${prioridadeLabel.toUpperCase()}`, cardX + 4, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // Datas
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const dataEntrada = formatarData(pedido.data_entrada);
    const previsaoEntrega = pedido.previsao_entrega ? formatarData(pedido.previsao_entrega) : 'Não definida';
    
    doc.text(`Data de Entrada: ${dataEntrada}`, cardX, yPos);
    doc.text(`Previsão de Entrega: ${previsaoEntrega}`, cardX + 70, yPos);
    doc.text(`Qtd. Itens: ${pedido.itens_pedido?.length || 0}`, cardX + 145, yPos);

    yPos += 10;

    // ============================================================
    // 3. DADOS DO CLIENTE
    // ============================================================
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('CLIENTE', cardX, yPos);
    
    yPos += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(cardX, yPos, cardX + 30, yPos);
    
    yPos += 6;
    
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(cardX, yPos - 3, cardWidth, 22, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Nome:', cardX + 3, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(pedido.orcamento?.cliente_nome || '-', cardX + 20, yPos + 2);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone:', cardX + 100, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(formatarTelefone(pedido.orcamento?.cliente_telefone || ''), cardX + 120, yPos + 2);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', cardX + 3, yPos + 2);
    doc.setFont('helvetica', 'normal');
    const endereco = `${pedido.orcamento?.endereco || '-'}${pedido.orcamento?.cidade ? ' - ' + pedido.orcamento.cidade : ''}`;
    const enderecoLines = doc.splitTextToSize(endereco, 155);
    doc.text(enderecoLines[0], cardX + 25, yPos + 2);

    yPos += 20;

    // ============================================================
    // 4. TABELA DE ITENS COM ESPECIFICAÇÕES TÉCNICAS
    // ============================================================
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('ITENS PARA PRODUÇÃO', cardX, yPos);
    
    yPos += 2;
    doc.line(cardX, yPos, cardX + 50, yPos);
    yPos += 5;

    const tableData = pedido.itens_pedido?.map((item: any, index: number) => {
      const cortina = item.cortina_item || {};
      const statusInfo = STATUS_ITEM_LABELS[item.status_item] || { label: item.status_item };
      
      // Buscar nomes dos materiais
      const tecido = materiaisMap.get(cortina.tecido_id);
      const forro = materiaisMap.get(cortina.forro_id);
      const trilho = materiaisMap.get(cortina.trilho_id);
      const motor = materiaisMap.get(cortina.motor_id);

      // Especificações técnicas
      let specs: string[] = [];
      specs.push(`${cortina.largura || 0}m × ${cortina.altura || 0}m`);
      if (cortina.barra_cm) specs.push(`Barra: ${cortina.barra_cm}cm`);
      if (cortina.motorizada) {
        specs.push(motor ? `Motor: ${motor.nome}` : 'MOTORIZADA');
      }
      
      let materiais: string[] = [];
      if (tecido) materiais.push(`Tec: ${tecido.nome}${tecido.cor ? ` (${tecido.cor})` : ''}`);
      if (forro) materiais.push(`For: ${forro.nome}`);
      if (trilho) materiais.push(`Tri: ${trilho.nome}`);

      return [
        `#${index + 1}`,
        `${cortina.nome_identificacao || 'Item'}\n${cortina.ambiente ? `Amb: ${cortina.ambiente}` : ''}`,
        `${cortina.tipo_cortina || '-'}\n${cortina.tipo_produto || '-'}`,
        specs.join('\n'),
        materiais.join('\n') || '-',
        `${cortina.quantidade || 1}`,
        statusInfo.label
      ];
    }) || [];

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Identificação', 'Tipo', 'Dimensões', 'Materiais', 'Qtd', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [50, 50, 50],
        cellPadding: 3,
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 45 },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: cardX, right: cardX },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ============================================================
    // 5. CHECKLIST POR ETAPA
    // ============================================================
    
    // Verificar se precisa de nova página
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('CHECKLIST DE PRODUÇÃO', cardX, yPos);
    
    yPos += 2;
    doc.line(cardX, yPos, cardX + 55, yPos);
    yPos += 8;

    const etapas = [
      { nome: 'CORTE', desc: 'Verificar medidas antes de cortar' },
      { nome: 'COSTURA', desc: 'Conferir barra e acabamento' },
      { nome: 'ACABAMENTO', desc: 'Revisar costuras e arremates' },
      { nome: 'QUALIDADE', desc: 'Inspeção final antes da entrega' },
    ];

    const checkboxSize = 4;
    const colWidth = 45;

    etapas.forEach((etapa, i) => {
      const xOffset = cardX + (i * colWidth);
      
      // Checkbox
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.rect(xOffset, yPos - 3, checkboxSize, checkboxSize);
      
      // Nome da etapa
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 34, 34);
      doc.text(etapa.nome, xOffset + checkboxSize + 2, yPos);
      
      // Descrição
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(etapa.desc, xOffset + checkboxSize + 2, yPos + 4);
    });

    yPos += 15;

    // ============================================================
    // 6. OBSERVAÇÕES
    // ============================================================
    
    const observacoes = pedido.observacoes_producao || pedido.orcamento?.observacoes;
    
    if (observacoes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 34, 34);
      doc.text('OBSERVAÇÕES', cardX, yPos);
      
      yPos += 2;
      doc.line(cardX, yPos, cardX + 40, yPos);
      yPos += 6;
      
      doc.setFillColor(255, 250, 230);
      const obsLines = doc.splitTextToSize(observacoes, cardWidth - 10);
      const obsBoxHeight = Math.max(15, obsLines.length * 4 + 8);
      doc.roundedRect(cardX, yPos - 3, cardWidth, obsBoxHeight, 2, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 60, 0);
      doc.text(obsLines, cardX + 5, yPos + 2);
      
      yPos += obsBoxHeight + 5;
    }

    // ============================================================
    // 7. ÁREA PARA ANOTAÇÕES
    // ============================================================
    
    if (yPos < 240) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Anotações:', cardX, yPos);
      
      yPos += 3;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      for (let i = 0; i < 4; i++) {
        yPos += 6;
        doc.line(cardX, yPos, cardX + cardWidth, yPos);
      }
    }

    // ============================================================
    // 8. RODAPÉ COM QR CODE
    // ============================================================
    
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, 275, 195, 275);
      
      // Informações
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Ficha de Produção - ${pedido.numero_pedido} - Gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 15, 280);
      doc.text(`Página ${i} de ${pageCount}`, 195, 280, { align: 'right' });
      
      // QR Code placeholder (texto com link)
      doc.setFontSize(6);
      doc.text(`Acesso rápido: /producao/ficha/${pedido.id}`, 15, 285);
    }

    // Salvar PDF
    doc.save(`Ficha_Producao_${pedido.numero_pedido}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF de produção:', error);
    throw error;
  }
}