import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import Products from "@/components/Products";
import ProcessFlow from "@/components/ProcessFlow";
import Benefits from "@/components/Benefits";
import PartnersLogos from "@/components/PartnersLogos";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrustBar from "@/components/TrustBar";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <StatsSection />
      <Products />
      <ProcessFlow />
      <Benefits />
      <PartnersLogos />
      <SocialProof />
      <FAQ />
      <ContactForm />
      <WhatsAppButton />
      <TrustBar />
      <Footer />
    </div>
  );
};

export default Index;