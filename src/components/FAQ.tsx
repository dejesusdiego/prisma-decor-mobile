import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Como escolher o tecido ou material ideal para minhas cortinas e persianas?",
      answer: (
        <>
          <p className="mb-3">
            Para cortinas, o <strong>linho</strong> proporciona um visual leve e natural, ideal para filtrar a luz suavemente, 
            enquanto o <strong>blackout</strong> bloqueia totalmente a entrada de luz, garantindo privacidade e conforto térmico.
          </p>
          <p>
            Já para persianas, os modelos em <strong>PVC, alumínio ou tecido</strong> oferecem diferentes níveis de controle de 
            luminosidade e são ideais para quem busca praticidade e fácil manutenção.
          </p>
        </>
      ),
    },
    {
      question: "Quanto tempo leva para fazer e instalar cortinas ou persianas sob medida?",
      answer: (
        <>
          <p className="mb-3">
            Nosso prazo médio de produção é de <strong>até 15 dias úteis</strong>.
          </p>
          <p>
            Após a entrega, a instalação é realizada em <strong>apenas um dia</strong>, por nossa equipe especializada, 
            garantindo acabamento impecável e funcionamento perfeito.
          </p>
        </>
      ),
    },
    {
      question: "Cortinas e persianas ajudam a controlar a temperatura do ambiente?",
      answer: (
        <>
          <p className="mb-3"><strong>Sim!</strong></p>
          <p>
            Tanto cortinas <strong>blackout</strong> quanto persianas com <strong>barreira térmica</strong> ajudam a manter o ambiente mais 
            fresco no verão e mais aconchegante no inverno, além de melhorar a eficiência energética do ar-condicionado.
          </p>
        </>
      ),
    },
    {
      question: "Posso lavar cortinas e persianas em casa ou preciso de limpeza profissional?",
      answer: (
        <>
          <p className="mb-3"><strong>Depende do material.</strong></p>
          <p className="mb-3">
            Cortinas de tecido delicado, como <strong>linho e voil</strong>, devem ser higienizadas em lavanderias especializadas 
            para preservar a estrutura e as cores originais.
          </p>
          <p className="mb-3">
            Já persianas em <strong>alumínio, PVC ou rolo</strong> podem ser limpas facilmente com um pano úmido e produtos neutros, 
            sem necessidade de remoção completa.
          </p>
          <p>
            Além disso, nós oferecemos o <strong>serviço completo de lavagem e higienização profissional</strong> — incluindo 
            desmontagem, limpeza e reinstalação das cortinas e persianas. <strong>Buscamos e entregamos diretamente na 
            sua casa</strong>, garantindo comodidade, segurança e praticidade.
          </p>
        </>
      ),
    },
    {
      question: "Quais são as vantagens das cortinas de tecido em relação às persianas — e vice-versa?",
      answer: (
        <>
          <p className="mb-3">
            As <strong>cortinas de tecido</strong> oferecem variedade de cores e texturas, trazendo aconchego e elegância, 
            especialmente para salas e quartos.
          </p>
          <p className="mb-3">
            As <strong>persianas</strong>, por outro lado, são mais práticas, fáceis de limpar e ideais para escritórios, 
            cozinhas e áreas com alta incidência solar.
          </p>
          <p>
            Muitos clientes combinam os dois — <strong>cortina + persiana</strong> — para unir funcionalidade e estética.
          </p>
        </>
      ),
    },
    {
      question: "Vocês fazem a instalação de cortinas e persianas?",
      answer: (
        <>
          <p className="mb-3"><strong>Sim!</strong></p>
          <p className="mb-3">
            A <strong>instalação profissional está inclusa</strong> em nosso serviço.
          </p>
          <p className="mb-2">Nossos consultores realizam todo o processo:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Medição personalizada</strong> no local;</li>
            <li><strong>Apresentação de amostras</strong> e consultoria de estilo;</li>
            <li><strong>Instalação final</strong> com garantia de alinhamento, fixação e acabamento.</li>
          </ol>
          <p className="mt-3">
            Tudo feito por profissionais treinados para garantir um <strong>resultado perfeito</strong> em suas cortinas e 
            persianas sob medida.
          </p>
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre nossos produtos e serviços
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-2xl border-none shadow-lg overflow-hidden transition-all hover:shadow-xl"
              >
                <AccordionTrigger className="text-left hover:no-underline px-6 py-5 hover:bg-muted/50 transition-colors">
                  <span className="text-base text-foreground pr-4 leading-relaxed">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground px-6 pb-5 pt-1 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
