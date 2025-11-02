import { useAuth } from '@/contexts/AuthContext';
import ServiceCenterDashboard from '@/components/ServiceCenterDashboard';
import PartsCoordinatorDashboard from '@/components/PartsCoordinatorDashboard';
import ManufacturerDashboard from '@/components/ManufacturerDashboard';
import TechnicianDashboard from '@/components/TechnicianDashboard';
import WarrantyDashboard from '@/components/WarrantyDashboard';
import PartsCompanyDashboard from '@/components/PartsCompanyDashboard';
import SuperAdvisor from "@/components/SuperAdvisor";

const Dashboard = () => {
	const { user } = useAuth();

	if (!user) return null;

	// Route to appropriate dashboard based on user role
	if (user.role === "service_center_manager") {
		return <ServiceCenterDashboard />;
	}

	// Parts coordinator at service center should see the parts coordinator dashboard
	if (user.role === "parts_coordinator_service_center") {
		return <PartsCoordinatorDashboard />;
	}

	if (user.role === "service_center_technician") {
		return <TechnicianDashboard />;
	}

	if (user.role === "emv_admin") {
		return <ManufacturerDashboard />;
	}

	if (user.role === "emv_staff") {
		return <WarrantyDashboard />;
	}

	if (user.role === "parts_coordinator_company") {
		return <PartsCompanyDashboard />;
	}

	if (user.role === "service_center_staff") {
		return <SuperAdvisor />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-foreground mb-2">
					Vai trò không xác định
				</h1>
				<p className="text-muted-foreground">
					Không thể xác định dashboard phù hợp cho vai trò của bạn.
				</p>
			</div>
		</div>
	);
};

export default Dashboard;
