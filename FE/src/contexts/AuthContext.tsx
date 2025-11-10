import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";

export interface User {
	id: string;
	email: string;
	name: string;
	role: string;
	avatar?: string;
	serviceCenter?: string;
	department?: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
	isAuthenticated: boolean;
	getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if token exists to determine if user is logged in
		const token = localStorage.getItem("ev_warranty_token");

		if (token) {
			try {
				// Decode token to get user info
				const payload = JSON.parse(atob(token.split(".")[1]));
				const userData: User = {
					id: payload.userId,
					email: "",
					name: "",
					role: payload.roleName,
					serviceCenter: payload.serviceCenterId,
					department: payload.department,
				};
				setUser(userData);
				console.log("User restored from token:", userData);
			} catch (error) {
				console.error("Error parsing saved user data:", error);
				// Clear invalid data
				localStorage.removeItem("ev_warranty_token");
				localStorage.removeItem("ev_warranty_user");
			}
		}
		setIsLoading(false);
	}, []);

	const login = async (
		username: string,
		password: string
	): Promise<boolean> => {
		setIsLoading(true);

		try {
			const response = await fetch("http://localhost:3000/api/v1/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username,
					password,
				}),
			});

			const data = await response.json();

			// Handle different response structures
			if (data?.data?.token) {
				const token = data.data.token;
				if (token) {
					localStorage.setItem("ev_warranty_token", token);

					const payload = JSON.parse(atob(token.split(".")[1]));
					const userData: User = {
						id: payload.userId,
						email: "",
						name: "",
						role: payload.roleName,
						serviceCenter: payload.serviceCenterId,
						department: payload.department,
					};

					setUser(userData);
					console.log("User logged in:", userData);
					setIsLoading(false);
					return true;
				} else {
					console.error("No token received from server");
					setIsLoading(false);
					return false;
				}
			} else {
				// Handle failed login (no token in response)
				console.error("Login failed:", data?.message || "Invalid credentials");
				setIsLoading(false);
				return false;
			}
		} catch (error) {
			console.error("Login error:", error);
			setIsLoading(false);
			return false;
		}
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("ev_warranty_token");
		localStorage.removeItem("ev_warranty_user");
	};

	const getToken = (): string | null => {
		return localStorage.getItem("ev_warranty_token");
	};

	const value = {
		user,
		isLoading,
		login,
		logout,
		isAuthenticated: !!user,
		getToken,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
