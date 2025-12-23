import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import logoPng from '@/assets/logo-prisma-pdf.png';

interface OrcamentoData {
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  cidade?: string;
  endereco: string;
  observacoes?: string;
  created_at: string;
  total_geral: number;
  validade_dias?: number;
  desconto_tipo?: string | null;
  desconto_valor?: number | null;
  total_com_desconto?: number | null;
}

interface CortinaItemData {
  nome_identificacao: string;
  quantidade: number;
  largura: number;
  altura: number;
  barra_cm?: number;
  tipo_cortina: string;
  tecido_id?: string;
  forro_id?: string;
  trilho_id?: string;
  custo_instalacao?: number;
  preco_venda?: number;
  ambiente?: string;
}

interface MaterialData {
  id: string;
  nome: string;
}

// Função auxiliar para formatar valores em BRL
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

// Função auxiliar para formatar telefone
function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  return telefone; // Retorna original se não tiver 11 dígitos
}

export async function gerarPdfOrcamento(orcamentoId: string): Promise<void> {
  try {
    // Buscar dados do orçamento
    const { data: orcamento, error: orcError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcamentoId)
      .single();

    if (orcError) throw orcError;

    // Buscar itens do orçamento
    const { data: cortinas, error: cortinasError } = await supabase
      .from('cortina_items')
      .select('*')
      .eq('orcamento_id', orcamentoId);

    if (cortinasError) throw cortinasError;

    // Buscar materiais para nome dos tecidos, forros e trilhos (com paginação)
    const { fetchMateriaisPaginados } = await import('@/lib/fetchMateriaisPaginados');
    const materiais = await fetchMateriaisPaginados(undefined, true);

    // Criar PDF
    const doc = new jsPDF();
    let yPos = 0;

    // ============================================================
    // 1. CABEÇALHO COM FUNDO PRETO E LOGO
    // ============================================================
    
    // Fundo preto no topo
    doc.setFillColor(17, 17, 17); // Preto #111111
    doc.rect(0, 0, 210, 35, 'F'); // Largura A4 = 210mm
    
    // Logo PRISMA Interiores
    yPos = 12;
    
    try {
      // Adicionar logo PNG ao lado esquerdo
      doc.addImage(logoPng, 'PNG', 15, yPos, 12, 12);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
    
    // Texto PRISMA e Interiores ao lado da logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Branco
    doc.text('PRISMA', 30, yPos + 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200); // Cinza claro
    doc.text('Interiores', 30, yPos + 10);
    
    // Informações de contato no lado direito do cabeçalho
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 220); // Cinza claro
    const contactInfo = [
      'www.prismadecorlab.com',
      'somosprismainteiores@gmail.com',
      'WhatsApp: (47) 99262-4706'
    ];
    let contactY = 12;
    contactInfo.forEach(info => {
      doc.text(info, 195, contactY, { align: 'right' });
      contactY += 4;
    });
    
    // Reset cor do texto para preto
    doc.setTextColor(0, 0, 0);
    
    yPos = 45; // Começar conteúdo após o cabeçalho
    
    // ============================================================
    // 2. CORPO EM "CARD" CENTRALIZADO
    // ============================================================
    
    const cardMargin = 12;
    const cardWidth = 186; // 210 - (2 * 12)
    const cardX = cardMargin;
    
    // ============================================================
    // 3. SEÇÃO "ORÇAMENTO" (NÚMERO, DATA, VALIDADE)
    // ============================================================
    
    yPos += 5;
    
    // Título "ORÇAMENTO"
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('ORÇAMENTO', cardX, yPos);
    
    // Linha decorativa abaixo do título
    yPos += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(cardX, yPos, cardX + 60, yPos);
    
    yPos += 8;
    
    // Informações do orçamento em linha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const dataEmissao = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
    const validadeDias = orcamento.validade_dias || 7;
    
    const orcInfo = `Nº ${orcamento.codigo}   |   Data: ${dataEmissao}   |   Validade: ${validadeDias} dias`;
    doc.text(orcInfo, cardX, yPos);
    
    yPos += 12;
    
    // ============================================================
    // 4. DADOS DO CLIENTE EM BLOCO ORGANIZADO
    // ============================================================
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('Dados do Cliente', cardX, yPos);
    
    // Linha decorativa
    yPos += 2;
    doc.line(cardX, yPos, cardX + 50, yPos);
    
    yPos += 8;
    
    // Box com fundo claro para dados do cliente
    const clientBoxHeight = orcamento.cidade || orcamento.endereco ? 34 : 20;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(cardX, yPos - 5, cardWidth, clientBoxHeight, 3, 3, 'F');
    
    // Dados do cliente
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    
    let clientY = yPos;
    
    doc.text('Nome:', cardX + 3, clientY);
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.cliente_nome, cardX + 35, clientY);
    
    clientY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone/WhatsApp:', cardX + 3, clientY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatarTelefone(orcamento.cliente_telefone), cardX + 35, clientY);
    
    if (orcamento.cidade) {
      clientY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Cidade:', cardX + 3, clientY);
      doc.setFont('helvetica', 'normal');
      doc.text(orcamento.cidade, cardX + 35, clientY);
    }
    
    if (orcamento.endereco) {
      clientY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Endereço:', cardX + 3, clientY);
      doc.setFont('helvetica', 'normal');
      const enderecoLines = doc.splitTextToSize(orcamento.endereco, cardWidth - 40);
      doc.text(enderecoLines, cardX + 35, clientY);
      clientY += (enderecoLines.length - 1) * 4;
    }
    
    yPos = clientY + 15;
    
    // ============================================================
    // 5. TABELA DE ITENS (MELHOR TIPOGRAFIA)
    // ============================================================
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('Itens do Orçamento', cardX, yPos);
    
    yPos += 2;
    doc.line(cardX, yPos, cardX + 50, yPos);
    
    yPos += 5;

    // Preparar dados da tabela
    const tableData = cortinas.map((cortina: any) => {
      // Nome do item é o nome_identificacao
      let descricao = cortina.nome_identificacao || 'Item';
      
      // Adicionar tamanho (exceto para itens "outro" sem dimensões)
      const tipoProduto = cortina.tipo_produto || 'cortina';
      if (tipoProduto !== 'outro' && (cortina.largura > 0 || cortina.altura > 0)) {
        descricao += ` - ${cortina.largura}m x ${cortina.altura}m`;
      }
      
      // Adicionar ambiente
      if (cortina.ambiente) {
        descricao += ` - ${cortina.ambiente}`;
      }

      const precoUnitario = (cortina.preco_venda || 0) / cortina.quantidade;
      const total = cortina.preco_venda || 0;

      return [
        descricao,
        cortina.quantidade.toString(),
        `R$ ${formatarValor(precoUnitario)}`,
        `R$ ${formatarValor(total)}`
      ];
    });

    // Tabela com estilo premium
    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Qtd.', 'Valor Unitário', 'Total']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [242, 242, 242],
        textColor: [34, 34, 34],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 100, halign: 'left' },
        1: { cellWidth: 18, halign: 'right' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 32, halign: 'right' },
      },
      margin: { left: cardX, right: cardX },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252],
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ============================================================
    // 6. VALOR TOTAL E DESCONTO (SE HOUVER)
    // ============================================================
    
    const temDesconto = orcamento.desconto_tipo && orcamento.desconto_valor && orcamento.desconto_valor > 0;
    
    if (temDesconto) {
      // Calcular valor do desconto
      const valorDesconto = orcamento.desconto_tipo === 'percentual'
        ? (orcamento.total_geral * orcamento.desconto_valor) / 100
        : Math.min(orcamento.desconto_valor, orcamento.total_geral);
      
      const totalComDesconto = orcamento.total_com_desconto || (orcamento.total_geral - valorDesconto);
      
      // Box maior para mostrar subtotal, desconto e total
      const totalBoxWidth = 90;
      const totalBoxX = 210 - cardX - totalBoxWidth;
      const totalBoxHeight = 30;
      
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(totalBoxX, yPos - 3, totalBoxWidth, totalBoxHeight, 2, 2, 'F');
      
      // Subtotal (riscado)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('Subtotal:', totalBoxX + 3, yPos + 3);
      doc.text(`R$ ${formatarValor(orcamento.total_geral)}`, totalBoxX + totalBoxWidth - 3, yPos + 3, { align: 'right' });
      
      // Linha de risco no subtotal
      const subtotalTextWidth = doc.getTextWidth(`R$ ${formatarValor(orcamento.total_geral)}`);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.line(totalBoxX + totalBoxWidth - 3 - subtotalTextWidth, yPos + 2, totalBoxX + totalBoxWidth - 3, yPos + 2);
      
      // Desconto
      doc.setTextColor(0, 153, 51); // Verde
      doc.text(`Desconto (${orcamento.desconto_tipo === 'percentual' ? orcamento.desconto_valor + '%' : 'fixo'}):`, totalBoxX + 3, yPos + 11);
      doc.text(`- R$ ${formatarValor(valorDesconto)}`, totalBoxX + totalBoxWidth - 3, yPos + 11, { align: 'right' });
      
      // Total final
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 34, 34);
      doc.text('TOTAL FINAL:', totalBoxX + 3, yPos + 21);
      
      doc.setFontSize(13);
      doc.setTextColor(0, 102, 51); // Verde escuro
      doc.text(`R$ ${formatarValor(totalComDesconto)}`, totalBoxX + totalBoxWidth - 3, yPos + 21, { align: 'right' });
      
      yPos += totalBoxHeight + 10;
    } else {
      // Box simples sem desconto
      const totalBoxWidth = 70;
      const totalBoxX = 210 - cardX - totalBoxWidth;
      
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(totalBoxX, yPos - 3, totalBoxWidth, 12, 2, 2, 'F');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 34, 34);
      doc.text('VALOR TOTAL:', totalBoxX + 3, yPos + 4);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 51); // Verde escuro para valor
      doc.text(`R$ ${formatarValor(orcamento.total_geral)}`, totalBoxX + totalBoxWidth - 3, yPos + 4, { align: 'right' });
      
      yPos += 20;
    }
    
    doc.setTextColor(0, 0, 0); // Reset cor
    
    // ============================================================
    // 7. FORMAS DE PAGAMENTO (MAIS PROFISSIONAL)
    // ============================================================
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('Formas de Pagamento', cardX, yPos);
    
    yPos += 2;
    doc.line(cardX, yPos, cardX + 50, yPos);
    
    yPos += 8;
    
    // Box com fundo claro para formas de pagamento
    const paymentBoxHeight = 17;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(cardX, yPos - 5, cardWidth, paymentBoxHeight, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('PIX:', cardX + 3, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('50% na confirmação do pedido e 50% na entrega.', cardX + 12, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Cartão de crédito (link de pagamento): ', cardX + 3, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('parcelamento em até 12x.', cardX + 68, yPos);
    
    yPos += 15;
    
    // ============================================================
    // 8. OBSERVAÇÕES
    // ============================================================
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 34, 34);
    doc.text('Observações', cardX, yPos);
    
    yPos += 2;
    doc.line(cardX, yPos, cardX + 50, yPos);
    
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    if (orcamento.observacoes) {
      const obsLines = doc.splitTextToSize(orcamento.observacoes, cardWidth - 6);
      doc.text(obsLines, cardX, yPos);
      yPos += obsLines.length * 4 + 5;
    }
    
    doc.setTextColor(100, 100, 100);
    doc.text('• Valor inclui instalação.', cardX, yPos);
    
    yPos += 4;
    doc.text('• Prazo de entrega estimado: 15 a 25 dias úteis após confirmação do pedido.', cardX, yPos);
    
    yPos += 4;
    doc.text('• Valores sujeitos a alteração em caso de mudanças de projeto ou medidas.', cardX, yPos);

    // ============================================================
    // 9. RODAPÉ INSTITUCIONAL
    // ============================================================
    
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, 275, 195, 275);
      
      // Textos do rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      doc.text('Prisma Interiores - Transformando ambientes com qualidade e profissionalismo.', 105, 280, { align: 'center' });
      doc.text('WhatsApp: (47) 99262-4706 | Email: somosprismainteiores@gmail.com | Website: www.prismadecorlab.com', 105, 285, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.text('CNPJ: 44.840.624/0001-92', 105, 290, { align: 'center' });
    }

    // Salvar PDF
    doc.save(`Orcamento_${orcamento.codigo}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}
