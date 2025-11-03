import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Benefits from "@/components/Benefits";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
const Index = () => {
  return <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Products />
      <Benefits />
      <FAQ />
      <ContactForm />
      
      <WhatsAppButton />
    </div>;
};
export default Index;