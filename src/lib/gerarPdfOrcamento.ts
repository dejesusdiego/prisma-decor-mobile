import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

interface OrcamentoData {
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  observacoes?: string;
  created_at: string;
  total_geral: number;
  validade_dias?: number;
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
}

interface MaterialData {
  id: string;
  nome: string;
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

    // Buscar materiais para nome dos tecidos, forros e trilhos
    const { data: materiais, error: materiaisError } = await supabase
      .from('materiais')
      .select('id, nome');

    if (materiaisError) throw materiaisError;

    // Criar PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Prisma Interiores', 105, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Refletindo estilo, projetando vidas', 105, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('www.prismadecorlab.com | somosprisma@gmail.com | WhatsApp: (47) 99262-4706', 105, yPos, { align: 'center' });
    
    yPos += 10;

    // Box Orçamento
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos, 180, 25, 'F');
    
    yPos += 7;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', 20, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${orcamento.codigo}`, 20, yPos);
    
    yPos += 5;
    const dataEmissao = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
    doc.text(`Data de Emissão: ${dataEmissao}`, 20, yPos);
    
    yPos += 5;
    const validadeDias = orcamento.validade_dias || 7;
    doc.text(`Validade: ${validadeDias} dias`, 20, yPos);
    
    yPos += 10;

    // Dados do Cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Cliente', 15, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${orcamento.cliente_nome}`, 15, yPos);
    
    yPos += 5;
    doc.text(`Telefone/WhatsApp: ${orcamento.cliente_telefone}`, 15, yPos);
    
    if (orcamento.endereco) {
      yPos += 5;
      doc.text(`Endereço: ${orcamento.endereco}`, 15, yPos);
    }
    
    yPos += 10;

    // Tabela de Itens
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Itens do Orçamento', 15, yPos);
    
    yPos += 5;

    const tableData = cortinas.map((cortina: CortinaItemData) => {
      // Montar descrição
      let descricao = `Cortina ${cortina.tipo_cortina}`;
      
      // Adicionar tecido
      if (cortina.tecido_id) {
        const tecido = materiais.find((m: MaterialData) => m.id === cortina.tecido_id);
        if (tecido) descricao += ` em ${tecido.nome}`;
      }
      
      // Adicionar forro
      if (cortina.forro_id) {
        const forro = materiais.find((m: MaterialData) => m.id === cortina.forro_id);
        if (forro) descricao += `, com forro ${forro.nome}`;
      }
      
      // Adicionar trilho
      if (cortina.trilho_id) {
        const trilho = materiais.find((m: MaterialData) => m.id === cortina.trilho_id);
        if (trilho) descricao += `, trilho ${trilho.nome}`;
      }
      
      // Adicionar medidas
      descricao += `, ${cortina.largura}m (L) x ${cortina.altura}m (A)`;
      
      // Adicionar barra
      if (cortina.barra_cm) {
        descricao += `, barra ${cortina.barra_cm}cm`;
      }
      
      // Adicionar instalação
      if (cortina.custo_instalacao && cortina.custo_instalacao > 0) {
        descricao += '. Valor inclui instalação.';
      }

      const precoUnitario = (cortina.preco_venda || 0) / cortina.quantidade;
      const total = cortina.preco_venda || 0;

      return [
        descricao,
        cortina.quantidade.toString(),
        `R$ ${precoUnitario.toFixed(2)}`,
        `R$ ${total.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Qtd.', 'Valor Unitário', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Resumo Financeiro
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR TOTAL: R$ ${orcamento.total_geral.toFixed(2)}`, 195, yPos, { align: 'right' });
    
    yPos += 15;

    // Formas de Pagamento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Formas de Pagamento Disponíveis', 15, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• PIX: 50% na confirmação do pedido e 50% na entrega.', 15, yPos);
    
    yPos += 5;
    doc.text('• Boleto bancário: 50% entrada e 50% na entrega (mediante aprovação de cadastro).', 15, yPos);
    
    yPos += 5;
    doc.text('• Cartão de crédito (link de pagamento): parcelamento em até 12x (sujeito à aprovação).', 15, yPos);
    
    yPos += 12;

    // Observações
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', 15, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (orcamento.observacoes) {
      const obsLines = doc.splitTextToSize(orcamento.observacoes, 180);
      doc.text(obsLines, 15, yPos);
      yPos += obsLines.length * 5;
    }
    
    yPos += 5;
    doc.text('• Prazo de entrega estimado: 15 a 25 dias úteis após confirmação do pedido.', 15, yPos);
    
    yPos += 5;
    doc.text('• Valores sujeitos a alteração em caso de mudanças de projeto ou medidas.', 15, yPos);

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Prisma Interiores - Transformando ambientes com qualidade e profissionalismo.', 105, 280, { align: 'center' });
      doc.text('WhatsApp: (47) 99262-4706 | Email: somosprisma@gmail.com | Website: www.prismadecorlab.com', 105, 285, { align: 'center' });
      doc.text('CNPJ: 44.840.624/0001-92', 105, 290, { align: 'center' });
    }

    // Salvar PDF
    doc.save(`Orcamento_${orcamento.codigo}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}
