import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import parisBistroCurtains from "@/assets/paris-bistro-curtains.jpg";
import parisBistroProfile from "@/assets/paris-bistro-profile.jpg";
import yachthouseCurtains from "@/assets/yachthouse-curtains.jpg";
import yachthouseProfile from "@/assets/yachthouse-profile.png";
import emersonsheikCurtains from "@/assets/emersonsheik-curtains.jpg";
import emersonsheikProfile from "@/assets/emersonsheik-profile.jpg";
import anaDesignerBlinds from "@/assets/ana-designer-blinds.jpg";
import anaDesignerProfile from "@/assets/ana-designer-profile.jpg";

const testimonials = [
  {
    username: "paris6_balneariocamboriu",
    verified: true,
    profileImage: parisBistroProfile,
    postImage: parisBistroCurtains,
    likes: 458,
    comments: 67,
    caption: "Todas as cortinas foram entregues junto com essas abraçadeiras, do mesmo tecido da cortina, Shantung Classic Dourado! ✨🪟💛",
    altText: "Cortinas de tecido Shantung Classic Dourado instaladas no restaurante Paris 6 em Balneário Camboriú"
  },
  {
    username: "yachthouse",
    verified: true,
    profileImage: yachthouseProfile,
    postImage: yachthouseCurtains,
    likes: 734,
    comments: 92,
    caption: "Elegância e tecnologia juntas! Nossas cortinas de tear com motorização integrada à Alexa transformam qualquer ambiente. Conforto, sofisticação e praticidade no comando de voz. 🏠✨🎙️",
    altText: "Cortinas motorizadas com integração Alexa instaladas no edifício Yachthouse em Balneário Camboriú"
  },
  {
    username: "emersonsheik",
    verified: true,
    profileImage: emersonsheikProfile,
    postImage: emersonsheikCurtains,
    likes: 1243,
    comments: 156,
    caption: "\"Tudo o que um sonho precisa para ser realizado é alguém que acredite que ele pode ser realizado.\" Agradeço imensamente pela oportunidade, confiança em nosso serviço e na minha equipe, estar entre vocês foi um sonho realizado, obrigado! 🙏✨💫",
    altText: "Projeto de cortinas sob medida em residência de alto padrão do influenciador Emerson Sheik"
  },
  {
    username: "ana.designer",
    verified: true,
    profileImage: anaDesignerProfile,
    postImage: anaDesignerBlinds,
    likes: 892,
    comments: 134,
    caption: "Persianas dupla visão instaladas com perfeição! O controle de luz ficou incrível e a vista preservada. Meus clientes amaram a funcionalidade e elegância. Prisma sempre entregando qualidade! 🪟✨ #designdeinteriores #persianas #duplavisao",
    altText: "Persianas dupla visão instaladas em sala de estar moderna com vista panorâmica"
  }
];

const SocialProof = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLike = (index: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quem Aprova a Prisma?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja o que nossos clientes estão dizendo
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg border-border h-10 w-10 md:h-12 md:w-12 rounded-full"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg border-border h-10 w-10 md:h-12 md:w-12 rounded-full"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            {/* Carousel */}
            <div className="overflow-hidden mx-8 md:mx-12">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((post, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2 md:px-4">
                    <Card className="max-w-md mx-auto bg-card border-border shadow-lg overflow-hidden">
                      {/* Header - Perfil */}
                      <div className="p-4 flex items-center gap-3 border-b border-border">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-400 p-[2px]">
                          <div className="w-full h-full rounded-full bg-background overflow-hidden">
                            {post.profileImage ? (
                              <img 
                                src={post.profileImage} 
                                alt={`Foto de perfil de ${post.username}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs font-bold text-foreground">
                                  {post.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground text-sm">
                            {post.username}
                          </span>
                          {post.verified && (
                            <svg 
                              className="h-4 w-4" 
                              viewBox="0 0 24 24" 
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-label="Conta verificada"
                            >
                              <circle cx="12" cy="12" r="10" fill="#0095F6"/>
                              <path 
                                d="M9 12L11 14L15 10" 
                                stroke="white" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Imagem do Post */}
                      <div className="relative w-full aspect-square bg-muted">
                        <img 
                          src={post.postImage} 
                          alt={post.altText}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Ações */}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleLike(index)}
                              className="hover:opacity-70 transition-opacity"
                              aria-label={likedPosts.has(index) ? "Descurtir" : "Curtir"}
                            >
                              <Heart 
                                className={`h-6 w-6 ${
                                  likedPosts.has(index) 
                                    ? "fill-red-500 text-red-500" 
                                    : "text-foreground"
                                }`}
                              />
                            </button>
                            <button className="hover:opacity-70 transition-opacity" aria-label="Ver comentários">
                              <MessageCircle className="h-6 w-6 text-foreground" />
                            </button>
                            <button className="hover:opacity-70 transition-opacity" aria-label="Compartilhar">
                              <Send className="h-6 w-6 text-foreground" />
                            </button>
                          </div>
                          <button className="hover:opacity-70 transition-opacity" aria-label="Salvar">
                            <Bookmark className="h-6 w-6 text-foreground" />
                          </button>
                        </div>

                        {/* Likes */}
                        <div className="mb-2">
                          <span className="font-semibold text-foreground text-sm">
                            {likedPosts.has(index) ? post.likes + 1 : post.likes} curtidas
                          </span>
                        </div>

                        {/* Caption */}
                        <div className="text-sm text-foreground">
                          <span className="font-semibold mr-2">{post.username}</span>
                          <span className="text-muted-foreground">{post.caption}</span>
                        </div>

                        {/* Comentários */}
                        <div className="mt-2">
                          <button className="text-sm text-muted-foreground hover:text-foreground">
                            Ver todos os {post.comments} comentários
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "w-8 bg-accent" 
                    : "w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;