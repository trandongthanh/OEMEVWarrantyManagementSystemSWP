import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
	Shield,
	Car,
	Eye,
	EyeOff,
	LogIn,
	LogOut,
	AlertCircle,
	Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isCarRotating, setIsCarRotating] = useState(false);
	const { login, isLoading, getToken } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

	// const demoAccounts = [
	//   {
	//     role: 'Service Center Staff',
	//     email: 'staff@evservice.com',
	//     password: 'staff123',
	//     description: 'Tạo hồ sơ xe, xử lý khách hàng',
	//     color: 'bg-primary'
	//   },
	//   {
	//     role: 'Technician',
	//     email: 'tech@evservice.com',
	//     password: 'tech123',
	//     description: 'Chẩn đoán, sửa chữa, cập nhật tiến độ',
	//     color: 'bg-success'
	//   },
	//   {
	//     role: 'EVM Admin',
	//     email: 'admin@evm.com',
	//     password: 'admin123',
	//     description: 'Quản lý toàn bộ hệ thống',
	//     color: 'bg-destructive'
	//   },
	//   {
	//     role: 'EVM Staff',
	//     email: 'evmstaff@evm.com',
	//     password: 'evm123',
	//     description: 'Duyệt warranty claims, quản lý parts',
	//     color: 'bg-warning'
	//   }
	// ];

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!username || !password) {
			setError("Please enter both username and password");
			return;
		}

		const success = await login(username, password);

		if (success) {
			toast({
				title: "Login Successful!",
				description: "Welcome to EV Warranty Management System",
			});
			navigate("/dashboard");
		} else {
			setError("Invalid username or password");
		}
	};

	const quickLogin = (demoUsername: string, demoPassword: string) => {
		setUsername(demoUsername);
		setPassword(demoPassword);
	};

	const handleCarClick = () => {
		setIsCarRotating(true);
		setTimeout(() => {
			setIsCarRotating(false);
		}, 2000); // Animation lasts 2 seconds
	};

	return (
		<div className="min-h-screen w-full relative">
			{/* Radial Gradient Background from Bottom */}
			<div
				className="absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(125% 125% at 50% 90%, #fff 40%, #6366f1 100%)",
				}}
			/>

			{/* Content Container */}
			<div className="relative z-10 min-h-screen">
				{/* Header */}
				<header className="border-b bg-gradient-primary backdrop-blur-sm shadow-elegant">
					<div className="container mx-auto px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
									<Shield className="h-6 w-6 text-white" />
								</div>
								<div>
									<h1 className="text-xl font-bold text-white">
										EV Warranty Management
									</h1>
									<p className="text-sm text-primary-foreground/80">
										Professional Service Platform
									</p>
								</div>
							</div>

							{/* Logout Button */}
							<Button
								variant="ghost"
								size="sm"
								className="text-white hover:bg-white/20 hover:text-white"
								onClick={() => {
									// Clear any stored auth data and navigate to login
									localStorage.clear();
									sessionStorage.clear();
									navigate("/");
								}}
							>
								<LogOut className="h-4 w-4 mr-2" />
								Back to Homepage
							</Button>
						</div>
					</div>
				</header>

				<div className="flex min-h-[calc(100vh-80px)] relative">
					{/* Left Side - Login Form */}
					<div className="flex-1 flex items-center justify-center p-8 lg:p-12">
						<Card className="w-full max-w-md shadow-glow backdrop-blur-sm">
							<CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
									<LogIn className="h-8 w-8 text-white" />
								</div>
								<CardTitle className="text-2xl text-white">
									System Login
								</CardTitle>
								<CardDescription className="text-primary-foreground/80">
									Access to EV Warranty Management Platform
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleLogin} className="space-y-6">
									{error && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>{error}</AlertDescription>
										</Alert>
									)}

									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											id="username"
											type="text"
											placeholder="Enter your username"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											disabled={isLoading}
											className="h-11"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="password">Mật khẩu</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												placeholder="Enter your password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												disabled={isLoading}
												className="h-11 pr-10"
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() => setShowPassword(!showPassword)}
												disabled={isLoading}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>

									<Button
										type="submit"
										className="w-full h-11"
										variant="gradient"
										disabled={isLoading}
									>
										{isLoading ? (
											<div className="flex items-center space-x-2">
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
												<span>Signing in...</span>
											</div>
										) : (
											<>
												<LogIn className="mr-2 h-4 w-4" />
												Sign In
											</>
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>

					{/* Right Side - 3D Car Image */}
					<div className="hidden lg:flex flex-1 items-center justify-start p-8 pl-0 relative">
						<div className="relative ml-8">
							{/* 3D Container */}
							<div
								className="relative transform-gpu"
								style={{
									perspective: "1000px",
									transformStyle: "preserve-3d",
								}}
							>
								<img
									src="/CAR2.png"
									alt="Electric Vehicle"
									className={`w-[450px] xl:w-[600px] 2xl:w-[750px] h-auto object-contain cursor-pointer select-none ${
										isCarRotating 
											? 'animate-spin duration-2000' 
											: 'transition-transform duration-700 hover:scale-105 hover:rotate-6'
									}`}
									onClick={handleCarClick}
									style={{
										transform: isCarRotating 
											? "rotateY(360deg) rotateX(360deg) rotateZ(360deg) scale(1.1)" 
											: "rotateY(-15deg) rotateX(5deg)",
										filter:
											"drop-shadow(20px 20px 40px rgba(0,0,0,0.3)) drop-shadow(-5px -5px 20px rgba(255,255,255,0.1))",
										background: "transparent",
										transition: isCarRotating 
											? "transform 2s cubic-bezier(0.4, 0.0, 0.2, 1)" 
											: "transform 0.7s ease-in-out",
									}}
								/>

								{/* 3D Shadow/Base */}
								<div
									className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4"
									style={{
										width: "400px",
										height: "40px",
										background:
											"radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
										borderRadius: "50%",
										transform: "rotateX(75deg) scale(1.6)",
										filter: "blur(15px)",
									}}
								/>

								{/* Floating Animation Elements */}
								<div className="absolute inset-0">
									<div className="absolute top-10 left-10 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce" />
									<div className="absolute top-20 right-16 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse" />
									<div className="absolute bottom-20 left-20 w-2 h-2 bg-indigo-400/25 rounded-full animate-ping" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
