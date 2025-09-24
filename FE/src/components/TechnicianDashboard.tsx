import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Package, 
  User,
  Search,
  LogOut,
  Camera,
  Plus,
  Eye,
  PlayCircle
} from "lucide-react";

interface TechnicianDashboardProps {
  onViewCase?: (caseId: string) => void;
  onAddReport?: (caseId: string) => void;
  onLogProgress?: (caseId: string) => void;
  onRecordInstallation?: (caseId: string) => void;
}

const TechnicianDashboard = ({
  onViewCase,
  onAddReport,
  onLogProgress,
  onRecordInstallation
}: TechnicianDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const { user, logout } = useAuth();

  const myTasks = [
    {
      id: "WC-2024-001",
      customer: "Nguyễn Văn A",
      vehicle: "VinFast VF8 2023",
      vin: "1HGBH41JXMN109186",
      issue: "Battery Performance Issue",
      status: "in-progress",
      priority: "high",
      assignedDate: "2024-01-15",
      dueDate: "2024-01-20",
      progress: 60,
      lastUpdate: "2024-01-16 14:30",
      reportsSubmitted: 2,
      partsWaiting: 1
    },
    {
      id: "WC-2024-003",
      customer: "Hoàng Minh E", 
      vehicle: "VinFast VF9 2023",
      vin: "1N4AL11D75C109151",
      issue: "Charging System Error",
      status: "blocked",
      priority: "medium",
      assignedDate: "2024-01-13",
      dueDate: "2024-01-18",
      progress: 30,
      lastUpdate: "2024-01-14 09:15",
      reportsSubmitted: 1,
      partsWaiting: 2
    },
    {
      id: "WC-2024-005",
      customer: "Trần Thị K",
      vehicle: "VinFast VF8 2023", 
      vin: "WVWZZZ1JZ3W654321",
      issue: "AC System Malfunction",
      status: "todo",
      priority: "low",
      assignedDate: "2024-01-16",
      dueDate: "2024-01-22",
      progress: 0,
      lastUpdate: "2024-01-16 08:00",
      reportsSubmitted: 0,
      partsWaiting: 0
    },
    {
      id: "WC-2024-006",
      customer: "Lê Văn M",
      vehicle: "VinFast VF9 2023",
      vin: "JM1BK32F787654321", 
      issue: "Software Update Required",
      status: "ready-for-handover",
      priority: "medium",
      assignedDate: "2024-01-10",
      dueDate: "2024-01-15",
      progress: 100,
      lastUpdate: "2024-01-15 16:45",
      reportsSubmitted: 1,
      partsWaiting: 0
    }
  ];

  const stats = [
    {
      title: "New Assignments",
      value: myTasks.filter(t => t.status === "todo").length.toString(),
      change: "+1 today",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "In Progress", 
      value: myTasks.filter(t => t.status === "in-progress").length.toString(),
      change: "Active work",
      icon: Wrench,
      color: "text-warning"
    },
    {
      title: "Awaiting Parts",
      value: myTasks.filter(t => t.status === "blocked").length.toString(),
      change: "Blocked tasks",
      icon: Package,
      color: "text-destructive"
    },
    {
      title: "Ready for Handover",
      value: myTasks.filter(t => t.status === "ready-for-handover").length.toString(),
      change: "Completed",
      icon: CheckCircle,
      color: "text-success"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      todo: { variant: "secondary" as const, text: "To Do", icon: Clock },
      "in-progress": { variant: "warning" as const, text: "In Progress", icon: Wrench },
      blocked: { variant: "destructive" as const, text: "Blocked", icon: AlertCircle },
      "ready-for-handover": { variant: "success" as const, text: "Ready", icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: "destructive" as const, text: "High" },
      medium: { variant: "warning" as const, text: "Medium" },
      low: { variant: "outline" as const, text: "Low" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-warning";
    return "bg-primary";
  };

  const filteredTasks = myTasks.filter(task =>
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.vin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTasks = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    "in-progress": filteredTasks.filter(t => t.status === "in-progress"),
    blocked: filteredTasks.filter(t => t.status === "blocked"),
    "ready-for-handover": filteredTasks.filter(t => t.status === "ready-for-handover")
  };

  const TaskCard = ({ task }: { task: typeof myTasks[0] }) => (
    <Card className="shadow-elegant hover:shadow-glow transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{task.id}</CardTitle>
          <div className="flex items-center space-x-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>
        <CardDescription className="text-sm">
          <div className="space-y-1">
            <p className="font-medium">{task.customer}</p>
            <p>{task.vehicle}</p>
            <p className="font-mono text-xs">{task.vin}</p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">{task.issue}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor(task.progress)}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{task.progress}% Complete</p>
          </div>

          {/* Task Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                {task.reportsSubmitted} reports
              </span>
              {task.partsWaiting > 0 && (
                <span className="flex items-center text-warning">
                  <Package className="h-3 w-3 mr-1" />
                  {task.partsWaiting} parts waiting
                </span>
              )}
            </div>
            <span>Due: {task.dueDate}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewCase?.(task.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            {task.status === "in-progress" && (
              <>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => onAddReport?.(task.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Report
                </Button>
                <Button 
                  variant="gradient" 
                  size="sm"
                  onClick={() => onLogProgress?.(task.id)}
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Update
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">My Tasks Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name} - Technician
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs">
                Battery Systems Specialist
              </Badge>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Quick Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Case ID, Customer, or VIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Assigned Cases</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === "kanban" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban View
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        {viewMode === "kanban" && (
          <div className="grid gap-6 md:grid-cols-4">
            {Object.entries(groupedTasks).map(([status, tasks]) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize">
                    {status.replace("-", " ")} ({tasks.length})
                  </h3>
                  {getStatusBadge(status)}
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>All My Cases</CardTitle>
              <CardDescription>
                List view of all assigned cases with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                        <FileText className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{task.id}</p>
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {task.customer} - {task.vehicle}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          VIN: {task.vin}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{task.issue}</p>
                      <p className="text-sm text-muted-foreground">
                        Progress: {task.progress}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewCase?.(task.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {task.status === "in-progress" && (
                        <Button 
                          variant="gradient" 
                          size="sm"
                          onClick={() => onLogProgress?.(task.id)}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;