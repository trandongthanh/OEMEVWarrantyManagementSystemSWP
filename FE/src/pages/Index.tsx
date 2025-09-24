import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Wrench, Building2, Shield, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: "service-center",
      title: "Service Center",
      description: "Manage vehicle profiles, warranty claims, and customer service",
      icon: Wrench,
      features: [
        "Vehicle & Customer Management",
        "Warranty Claim Processing",
        "Technician Assignment",
        "Service History Tracking"
      ],
      color: "bg-gradient-primary"
    },
    {
      id: "manufacturer",
      title: "Manufacturer (EVM)",
      description: "Oversee warranty policies, parts management, and analytics",
      icon: Building2,
      features: [
        "Parts & Policy Management",
        "Claim Approval System",
        "Supply Chain Management",
        "Analytics & Reporting"
      ],
      color: "bg-gradient-card"
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    if (isAuthenticated) {
      // If already logged in, go directly to dashboard
      navigate('/dashboard');
    } else {
      // If not logged in, go to login page
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">EV Warranty Management System</h1>
                <p className="text-sm text-muted-foreground">Professional Electric Vehicle Service Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => navigate('/login')}>
                <LogIn className="mr-2 h-4 w-4" />
                Đăng Nhập
              </Button>
            </div>
          </div>
        </div>
      </header>

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

      {/* Role Selection */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Choose Your Role</h2>
            <p className="text-lg text-muted-foreground">
              Select your organization type to access the appropriate dashboard and tools
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card 
                  key={role.id}
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 ${
                    selectedRole === role.id ? 'ring-2 ring-primary shadow-glow' : ''
                  }`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${role.color}`}>
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{role.title}</CardTitle>
                    <CardDescription className="text-base">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="mt-6 w-full group-hover:animate-pulse-glow"
                      onClick={() => handleRoleSelect(role.id)}
                    >
                      Access Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">System Features</h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Comprehensive tools for modern electric vehicle warranty management
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Secure Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  End-to-end encrypted warranty claim processing with audit trails and compliance reporting.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-primary" />
                  <span>VIN Integration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatic vehicle identification and history tracking through VIN-based database integration.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span>Real-time Updates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Live progress tracking and notifications for technicians, staff, and customers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            © 2024 EV Warranty Management System. Professional automotive service platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;