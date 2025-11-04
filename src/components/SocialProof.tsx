import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import parisBistroCurtains from "@/assets/paris-bistro-curtains.jpg";
import parisBistroProfile from "@/assets/paris-bistro-profile.jpg";
import yachthouseCurtains from "@/assets/yachthouse-curtains.jpg";
import yachthouseProfile from "@/assets/yachthouse-profile.png";

// Dados de exemplo - você pode editar com as informações reais
const testimonials = [
  {
    username: "paris6_balneariocamboriu",
    verified: true,
    profileImage: parisBistroProfile,
    postImage: parisBistroCurtains,
    likes: 458,
    comments: 67,
    caption: "Todas as cortinas foram entregues junto com essas abraçadeiras, do mesmo tecido da cortina, Shantung Classic Dourado! ✨🪟💛"
  },
  {
    username: "yachthouse",
    verified: true,
    profileImage: yachthouseProfile,
    postImage: yachthouseCurtains,
    likes: 734,
    comments: 92,
    caption: "Elegância e tecnologia juntas! Nossas cortinas de tear com motorização integrada à Alexa transformam qualquer ambiente. Conforto, sofisticação e praticidade no comando de voz. 🏠✨🎙️"
  },
  {
    username: "casa.dos.sonhos",
    verified: true,
    postImage: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800&h=800&fit=crop",
    likes: 892,
    comments: 123,
    caption: "As persianas ficaram lindas! Atendimento excelente do início ao fim. Super recomendo! 💛"
  },
  {
    username: "ana.designer",
    verified: true,
    postImage: "https://images.unsplash.com/photo-1616137422495-b4a3f26fd058?w=800&h=800&fit=crop",
    likes: 445,
    comments: 67,
    caption: "Melhor escolha! As cortinas blackout são perfeitas. Equipe super atenciosa e pontual! ⭐"
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
          <div className="relative overflow-hidden">
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
                              alt={`Perfil de ${post.username}`}
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
                        alt={`Post de ${post.username}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Ações */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(index)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Heart 
                              className={`h-6 w-6 ${
                                likedPosts.has(index) 
                                  ? "fill-red-500 text-red-500" 
                                  : "text-foreground"
                              }`}
                            />
                          </button>
                          <button className="hover:opacity-70 transition-opacity">
                            <MessageCircle className="h-6 w-6 text-foreground" />
                          </button>
                          <button className="hover:opacity-70 transition-opacity">
                            <Send className="h-6 w-6 text-foreground" />
                          </button>
                        </div>
                        <button className="hover:opacity-70 transition-opacity">
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
