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
import CampaignList from "./components/CampaignList";
import CampaignDetail from "./components/CampaignDetail";
import CampaignProgress from "./components/CampaignProgress";
import WarrantyClaims from "./components/WarrantyClaims";
import WarrantyClaimDetail from "./components/WarrantyClaimDetail";
import WarrantyDashboard from "./components/WarrantyDashboard";
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
              <ProtectedRoute allowedRoles={[ 'service_center_manager']}>
                <AllClaims />
              </ProtectedRoute>
            } />
            <Route path="/service-center" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'service_center_technician', 'service_center_manager']}>
                <ServiceCenterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/manufacturer" element={
              <ProtectedRoute allowedRoles={['emv_admin', 'emv_staff']}>
                <ManufacturerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'service_center_manager']}>
                <CampaignList />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'service_center_manager']}>
                <CampaignDetail />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/progress" element={
              <ProtectedRoute allowedRoles={['service_center_staff', 'service_center_manager']}>
                <CampaignProgress />
              </ProtectedRoute>
            } />
            <Route path="/warranty-claims" element={
              <ProtectedRoute allowedRoles={['emv_admin', 'emv_staff']}>
                <WarrantyClaims />
              </ProtectedRoute>
            } />
            <Route path="/warranty-claims/:id" element={
              <ProtectedRoute allowedRoles={['emv_admin', 'emv_staff']}>
                <WarrantyClaimDetail />
              </ProtectedRoute>
            } />
            <Route path="/warranty-dashboard" element={
              <ProtectedRoute allowedRoles={['emv_admin', 'emv_staff']}>
                <WarrantyDashboard />
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
