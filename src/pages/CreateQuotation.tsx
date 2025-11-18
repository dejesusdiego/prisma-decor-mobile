import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CreateQuotation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    } else {
      setIsLoading(false);
    }
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Novo Orçamento</h1>
              <p className="text-sm text-muted-foreground">
                Passo {currentStep} de {totalSteps}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {currentStep === 1 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Dados do Cliente</h2>
              <p className="text-muted-foreground">Formulário de dados do cliente será implementado aqui</p>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Seleção de Cortinas</h2>
              <p className="text-muted-foreground">Formulário de seleção de cortinas será implementado aqui</p>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Voltar
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Margem de Lucro</h2>
              <p className="text-muted-foreground">Seleção de margem de lucro será implementada aqui</p>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Voltar
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do Orçamento</h2>
              <p className="text-muted-foreground">Resumo final será implementado aqui</p>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Voltar
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Orçamento salvo",
                    description: "O orçamento foi criado com sucesso.",
                  });
                  navigate("/dashboard");
                }}>
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateQuotation;
