import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import ProcessFlow from "@/components/ProcessFlow";
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
      <ProcessFlow />
      <Benefits />
      <FAQ />
      <ContactForm />
      <WhatsAppButton />
      <Footer />
    </div>;
};
export default Index;