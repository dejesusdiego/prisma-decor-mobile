const HowItWorksPreview = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Como Funciona?
            </h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground">Agende a Visita</p>
                  <p className="text-sm text-muted-foreground">Preencha o formulário com seus dados</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground">Consultoria Gratuita</p>
                  <p className="text-sm text-muted-foreground">Nossa equipe visita sua casa para tirar medidas</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-foreground">Orçamento Personalizado</p>
                  <p className="text-sm text-muted-foreground">Receba uma proposta sob medida</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold text-foreground">Instalação</p>
                  <p className="text-sm text-muted-foreground">Agendamos a instalação na sua conveniência</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksPreview;
