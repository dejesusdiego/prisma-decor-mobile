import { useEffect, useState } from "react";
import { Home, Calendar, Star, Users } from "lucide-react";

const stats = [
  {
    icon: Home,
    value: 500,
    suffix: "+",
    label: "Ambientes Transformados",
  },
  {
    icon: Calendar,
    value: 8,
    suffix: "",
    label: "Anos de Experiência",
  },
  {
    icon: Star,
    value: 4.9,
    suffix: "",
    label: "Avaliação no Google",
    isDecimal: true,
  },
  {
    icon: Users,
    value: 98,
    suffix: "%",
    label: "Clientes Satisfeitos",
  },
];

const StatsSection = () => {
  const [counters, setCounters] = useState(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          stats.forEach((stat, index) => {
            const duration = 2000;
            const steps = 60;
            const increment = stat.value / steps;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= stat.value) {
                current = stat.value;
                clearInterval(timer);
              }
              setCounters((prev) => {
                const newCounters = [...prev];
                newCounters[index] = stat.isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current);
                return newCounters;
              });
            }, duration / steps);
          });
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById("stats-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section id="stats-section" className="py-10 md:py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/20 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-accent" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary-foreground mb-1 md:mb-2">
                {stat.isDecimal ? counters[index].toFixed(1) : counters[index]}
                {stat.suffix}
              </div>
              <div className="text-primary-foreground/70 text-xs sm:text-sm md:text-base leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
