import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Benefits from "@/components/Benefits";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Products />
      <Benefits />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;
