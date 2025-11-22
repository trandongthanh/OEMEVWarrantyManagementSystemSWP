
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Wrench, Building2, Shield, ArrowRight, LogIn } from "lucide-react";

const Index = () => {
 
  const navigate = useNavigate();


  return (
    <div className="min-h-screen w-full relative">
      {/* Radial Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
        }}
      />
      
      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Header */}
      <header className="border-b shadow-elegant" style={{ backgroundColor: '#7476F2' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EV Warranty Management System</h1>
                <p className="text-sm text-white">Professional Electric Vehicle Service Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => navigate('/login')}>
                <LogIn className="mr-2 h-4 w-4" />
                LOGIN
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Homepage Image */}
      <div className="w-full h-80 overflow-hidden">
        <img 
          src="/Homepagepic.png" 
          alt="Professional EV Service Center"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex justify-center">
              <Badge variant="secondary" className="px-4 py-2">
                <Car className="mr-2 h-4 w-4" />
                Electric Vehicle Industry Standard
              </Badge>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Streamline Your{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Warranty Process
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Comprehensive warranty management system for electric vehicle manufacturers and service centers.
              Handle everything from vehicle registration to claim processing with professional efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* Warranty Information Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            {/* Left Side - Car Image */}
            <div className="flex justify-center">
              <img 
                src="/CAR.png" 
                alt="Electric Vehicle"
                className="max-w-full h-auto object-contain"
              />
            </div>
            
            {/* Right Side - Warranty Text */}
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
The warranty period of a car is the length of time during which the manufacturer or an authorized dealer commits to repairing or replacing, free of charge, any technical defects arising from manufacturing or assembly faults. Typically, the warranty period is specified either by the number of years of use or by the mileage (whichever comes first). For example, many car brands apply a warranty of 3 years or 100,000 kilometers. This period helps customers feel more assured when using the vehicle while also reflecting the manufacturer’s responsibility and reputation for product quality.              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      
  

        {/* Footer */}
        <footer className="border-t bg-card py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-muted-foreground">
              © 2025 EV Warranty Management System. Professional automotive service platform.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;