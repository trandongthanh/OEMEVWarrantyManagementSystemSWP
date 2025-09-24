import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  Clock, 
  Package, 
  AlertCircle,
  Plus,
  Camera,
  FileText,
  Wrench,
  CheckCircle,
  Calendar,
  User
} from "lucide-react";

interface TaskCard {
  id: string;
  caseId: string;
  customer: string;
  vehicleModel: string;
  vin: string;
  issue: string;
  priority: "high" | "medium" | "low";
  dateAssigned: string;
  estimatedCompletion?: string;
  progress?: number;
  status: "new" | "in-progress" | "awaiting-parts" | "ready-review";
}

const TechnicianKanbanDashboard = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Mock task data
  const tasks: TaskCard[] = [
    {
      id: "task-001",
      caseId: "WC-25-09-001",
      customer: "Nguyễn Văn A",
      vehicleModel: "VinFast VF8",
      vin: "VF8ABC123456789",
      issue: "Battery Performance Issue",
      priority: "high",
      dateAssigned: "2025-01-15",
      status: "new"
    },
    {
      id: "task-002", 
      caseId: "WC-25-09-002",
      customer: "Lê Thị C",
      vehicleModel: "VinFast VF9",
      vin: "VF9DEF987654321",
      issue: "Charging Port Malfunction",
      priority: "medium",
      dateAssigned: "2025-01-14",
      estimatedCompletion: "2025-01-18",
      progress: 65,
      status: "in-progress"
    },
    {
      id: "task-003",
      caseId: "WC-25-09-003",
      customer: "Hoàng Minh E", 
      vehicleModel: "VinFast VF8",
      vin: "VF8GHI456789123",
      issue: "Display Screen Not Responding",
      priority: "low",
      dateAssigned: "2025-01-13",
      status: "awaiting-parts"
    },
    {
      id: "task-004",
      caseId: "WC-25-09-004",
      customer: "Trần Văn G",
      vehicleModel: "VinFast VF9",
      vin: "VF9JKL789123456", 
      issue: "Air Conditioning System",
      priority: "medium",
      dateAssigned: "2025-01-12",
      estimatedCompletion: "2025-01-17",
      progress: 90,
      status: "ready-review"
    }
  ];

  const columns = [
    {
      id: "new",
      title: "New Assignments",
      count: tasks.filter(t => t.status === "new").length,
      color: "bg-blue-50 border-blue-200",
      headerColor: "text-blue-600"
    },
    {
      id: "in-progress",
      title: "In Progress", 
      count: tasks.filter(t => t.status === "in-progress").length,
      color: "bg-orange-50 border-orange-200",
      headerColor: "text-orange-600"
    },
    {
      id: "awaiting-parts",
      title: "Awaiting Parts",
      count: tasks.filter(t => t.status === "awaiting-parts").length, 
      color: "bg-yellow-50 border-yellow-200",
      headerColor: "text-yellow-600"
    },
    {
      id: "ready-review",
      title: "Ready for Review",
      count: tasks.filter(t => t.status === "ready-review").length,
      color: "bg-green-50 border-green-200", 
      headerColor: "text-green-600"
    }
  ];

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    const config = {
      high: { icon: AlertCircle, className: "text-destructive" },
      medium: { icon: Clock, className: "text-warning" },
      low: { icon: CheckCircle, className: "text-success" }
    };
    
    const Icon = config[priority].icon;
    return <Icon className={`h-3 w-3 ${config[priority].className}`} />;
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    const config = {
      high: { variant: "destructive" as const, text: "High" },
      medium: { variant: "warning" as const, text: "Medium" },
      low: { variant: "secondary" as const, text: "Low" }
    };
    
    const priorityConfig = config[priority];
    return <Badge variant={priorityConfig.variant} className="text-xs">{priorityConfig.text}</Badge>;
  };

  const TaskCardComponent = ({ task }: { task: TaskCard }) => (
    <Card 
      className={`mb-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        selectedCard === task.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedCard(selectedCard === task.id ? null : task.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-medium text-primary">{task.caseId}</span>
              {getPriorityIcon(task.priority)}
            </div>
            {getPriorityBadge(task.priority)}
          </div>

          {/* Customer & Vehicle */}
          <div>
            <p className="font-medium text-sm">{task.customer}</p>
            <p className="text-xs text-muted-foreground">{task.vehicleModel}</p>
            <p className="font-mono text-xs text-muted-foreground">{task.vin}</p>
          </div>

          {/* Issue */}
          <div>
            <p className="text-sm font-medium text-foreground">{task.issue}</p>
          </div>

          {/* Progress (for in-progress tasks) */}
          {task.progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1.5" />
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{task.dateAssigned}</span>
            </div>
            {task.estimatedCompletion && (
              <span>Due: {task.estimatedCompletion}</span>
            )}
          </div>

          {/* Quick Actions (shown when selected) */}
          {selectedCard === task.id && (
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <FileText className="mr-1 h-3 w-3" />
                  Report
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Camera className="mr-1 h-3 w-3" />
                  Photo
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Wrench className="mr-1 h-3 w-3" />
                  Progress
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              TB
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground">Technician Dashboard - Trần Minh B</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            New Report
          </Button>
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Log Progress
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === "in-progress").length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === "awaiting-parts").length}</p>
                <p className="text-sm text-muted-foreground">Awaiting Parts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === "ready-review").length}</p>
                <p className="text-sm text-muted-foreground">Ready Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <Card className={`${column.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${column.headerColor} flex items-center justify-between`}>
                  <span>{column.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {column.count}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
            
            <div className="space-y-4">
              {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <TaskCardComponent key={task.id} task={task} />
                ))}
              
              {/* Add New Task Button (only for "new" column) */}
              {column.id === "new" && (
                <Button variant="ghost" className="w-full border-2 border-dashed border-muted-foreground/20 h-24 hover:border-primary/50 hover:bg-primary/5">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Request New Assignment</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianKanbanDashboard;