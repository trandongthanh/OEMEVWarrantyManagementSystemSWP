import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, User, AlertTriangle, Camera, FileText, Wrench } from 'lucide-react';

interface WorkTask {
  id: string;
  component: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
  progress: number;
  estimatedTime: string;
  actualTime?: string;
  notes: string;
  images: string[];
}

interface TechnicianWorkProgressProps {
  claimId: string;
  isMainTechnician: boolean;
  userRole: string;
  tasks: WorkTask[];
  onTaskUpdate: (taskId: string, updates: Partial<WorkTask>) => void;
  onCompleteWork: () => void;
  onClose: () => void;
}

const TechnicianWorkProgress = ({ 
  claimId, 
  isMainTechnician, 
  userRole, 
  tasks, 
  onTaskUpdate, 
  onCompleteWork, 
  onClose 
}: TechnicianWorkProgressProps) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const { toast } = useToast();

  const getStatusColor = (status: WorkTask['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'needs_review': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: WorkTask['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Hoàn thành</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Đang thực hiện</Badge>;
      case 'needs_review':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Cần kiểm tra</Badge>;
      default:
        return <Badge variant="outline">Chờ thực hiện</Badge>;
    }
  };

  const handleTaskProgress = (taskId: string, newProgress: number, status: WorkTask['status']) => {
    onTaskUpdate(taskId, { 
      progress: newProgress, 
      status,
      actualTime: status === 'completed' ? new Date().toLocaleTimeString('vi-VN') : undefined
    });

    const task = tasks.find(t => t.id === taskId);
    toast({
      title: "Cập nhật tiến độ",
      description: `Đã cập nhật tiến độ ${task?.component}: ${newProgress}%`
    });
  };

  const handleAddProgressNote = (taskId: string) => {
    if (!progressUpdate.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    const updatedNotes = task?.notes ? `${task.notes}\n\n[${new Date().toLocaleString('vi-VN')}] ${progressUpdate}` : progressUpdate;
    
    onTaskUpdate(taskId, { notes: updatedNotes });
    setProgressUpdate('');
    setSelectedTask(null);

    toast({
      title: "Đã thêm ghi chú",
      description: "Ghi chú tiến độ đã được cập nhật."
    });
  };

  const canCompleteWork = () => {
    return isMainTechnician && tasks.every(task => task.status === 'completed');
  };

  const overallProgress = tasks.length > 0 ? 
    Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length) : 0;

  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Tiến độ công việc - Yêu cầu #{claimId}
          </CardTitle>
          <CardDescription>
            {isMainTechnician ? 'Theo dõi và quản lý tiến độ các công việc bảo hành' : 'Cập nhật tiến độ công việc được phân công'}
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Overall Progress */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Tổng quan tiến độ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Tiến độ tổng thể</span>
                    <span className="text-sm font-medium">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                    <p className="text-sm text-muted-foreground">Tổng công việc</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                    <p className="text-sm text-muted-foreground">Hoàn thành</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{tasks.length - completedTasks}</p>
                    <p className="text-sm text-muted-foreground">Còn lại</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Danh sách công việc</h3>
            {tasks.map((task) => (
              <Card key={task.id} className={`transition-all ${
                selectedTask === task.id ? 'border-primary' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{task.component}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Phân công:</strong> {task.assignedTo}</p>
                      <p><strong>Thời gian ước tính:</strong> {task.estimatedTime}</p>
                      {task.actualTime && (
                        <p><strong>Thời gian thực tế:</strong> {task.actualTime}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Tiến độ</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  </div>

                  {/* Progress Controls - Only for assigned technician or main tech */}
                  {(task.assignedTo === userRole || isMainTechnician) && task.status !== 'completed' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskProgress(task.id, 25, 'in_progress')}
                        disabled={task.progress >= 25}
                      >
                        25%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskProgress(task.id, 50, 'in_progress')}
                        disabled={task.progress >= 50}
                      >
                        50%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskProgress(task.id, 75, 'in_progress')}
                        disabled={task.progress >= 75}
                      >
                        75%
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleTaskProgress(task.id, 100, 'completed')}
                        disabled={task.progress >= 100}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Hoàn thành
                      </Button>
                    </div>
                  )}

                  {/* Task Notes */}
                  {task.notes && (
                    <div className="bg-accent/20 p-3 rounded">
                      <h5 className="font-medium mb-2">Ghi chú công việc:</h5>
                      <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                    </div>
                  )}

                  {/* Add Progress Note */}
                  {(task.assignedTo === userRole || isMainTechnician) && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Thêm ghi chú
                        </Button>
                        <Button size="sm" variant="outline">
                          <Camera className="h-3 w-3 mr-1" />
                          Chụp ảnh
                        </Button>
                      </div>

                      {selectedTask === task.id && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Nhập ghi chú tiến độ..."
                            value={progressUpdate}
                            onChange={(e) => setProgressUpdate(e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddProgressNote(task.id)}
                              disabled={!progressUpdate.trim()}
                            >
                              Lưu ghi chú
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTask(null);
                                setProgressUpdate('');
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Technician Final Review */}
          {isMainTechnician && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-800">Nghiệm thu cuối cùng (Kỹ thuật viên chính)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="final-notes">Ghi chú nghiệm thu</Label>
                  <Textarea
                    id="final-notes"
                    placeholder="Nhập ghi chú tổng kết và nghiệm thu công việc..."
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                {canCompleteWork() ? (
                  <div className="p-3 bg-green-100 border border-green-200 rounded">
                    <p className="text-green-800 font-medium mb-2">
                      ✓ Tất cả công việc đã hoàn thành. Sẵn sàng nghiệm thu.
                    </p>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={onCompleteWork}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Xác nhận hoàn thành & Nghiệm thu
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-100 border border-yellow-200 rounded">
                    <p className="text-yellow-800">
                      ⏳ Chờ tất cả kỹ thuật viên hoàn thành công việc để nghiệm thu.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <div className="text-sm text-muted-foreground">
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianWorkProgress;