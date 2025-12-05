const partners = [
  { name: "Hunter Douglas", logo: "HD" },
  { name: "Luxaflex", logo: "LX" },
  { name: "Silhouette", logo: "SH" },
  { name: "Duette", logo: "DT" },
  { name: "Motorize", logo: "MZ" },
  { name: "Somfy", logo: "SM" },
];

const PartnersLogos = () => {
  return (
    <section className="py-8 md:py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <p className="text-center text-muted-foreground text-xs sm:text-sm mb-6 md:mb-8 uppercase tracking-wider">
          Trabalhamos com as melhores marcas do mercado
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-10 md:h-12 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
              title={partner.name}
            >
              <div className="text-xl md:text-2xl font-bold text-muted-foreground hover:text-foreground transition-colors">
                {partner.logo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersLogos;
