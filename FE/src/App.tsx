import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AllClaims from "./pages/AllClaims";
import NotFound from "./pages/NotFound";
import ServiceCenterDashboard from "./components/ServiceCenterDashboard";
import ManufacturerDashboard from "./components/ManufacturerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/all-claims" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'technician']}>
                <AllClaims />
              </ProtectedRoute>
            } />
            <Route path="/service-center" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'technician']}>
                <ServiceCenterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/manufacturer" element={
              <ProtectedRoute allowedRoles={['evm_admin', 'evm_staff']}>
                <ManufacturerDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
