import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Car, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface VehicleWarrantyInfo {
  vin: string;
  model: string;
  year: string;
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  mileage: number;
  maxMileage: number;
  warrantyStatus: 'valid' | 'expired_time' | 'expired_mileage' | 'not_found';
  customer: {
    name: string;
    phone: string;
    email: string;
  };
}

interface WarrantyValidatorProps {
  onValidationComplete: (vehicleInfo: VehicleWarrantyInfo | null) => void;
  onClose: () => void;
}

const WarrantyValidator = ({ onValidationComplete, onClose }: WarrantyValidatorProps) => {
  const [vinSearch, setVinSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<VehicleWarrantyInfo | null>(null);
  const { toast } = useToast();

  // Mock vehicle warranty database
  const vehicleDatabase: VehicleWarrantyInfo[] = [
    {
      vin: '1HGBH41JXMN109186',
      model: 'EV Model X Pro',
      year: '2023',
      purchaseDate: '2023-03-15',
      warrantyStartDate: '2023-03-15',
      warrantyEndDate: '2028-03-15',
      mileage: 15000,
      maxMileage: 100000,
      warrantyStatus: 'valid',
      customer: {
        name: 'Nguyễn Văn Minh',
        phone: '0901234567',
        email: 'minh.nguyen@email.com'
      }
    },
    {
      vin: 'WVWZZZ1JZ3W386752',
      model: 'EV Compact Plus',
      year: '2022',
      purchaseDate: '2022-01-20',
      warrantyStartDate: '2022-01-20',
      warrantyEndDate: '2025-01-20',
      mileage: 85000,
      maxMileage: 100000,
      warrantyStatus: 'valid',
      customer: {
        name: 'Trần Thị Lan',
        phone: '0987654321',
        email: 'lan.tran@email.com'
      }
    },
    {
      vin: 'JH4KA7532MC123456',
      model: 'EV City Car',
      year: '2020',
      purchaseDate: '2020-06-10',
      warrantyStartDate: '2020-06-10',
      warrantyEndDate: '2023-06-10',
      mileage: 45000,
      maxMileage: 100000,
      warrantyStatus: 'expired_time',
      customer: {
        name: 'Phạm Văn Hùng',
        phone: '0912345678',
        email: 'hung.pham@email.com'
      }
    },
    {
      vin: 'KMHGH4JH3EA123789',
      model: 'EV Sport Sedan',
      year: '2021',
      purchaseDate: '2021-08-15',
      warrantyStartDate: '2021-08-15',
      warrantyEndDate: '2026-08-15',
      mileage: 105000,
      maxMileage: 100000,
      warrantyStatus: 'expired_mileage',
      customer: {
        name: 'Võ Thị Mai',
        phone: '0934567890',
        email: 'mai.vo@email.com'
      }
    }
  ];

  const validateWarranty = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const vehicle = vehicleDatabase.find(v => v.vin.toLowerCase() === vinSearch.toLowerCase());
      
      if (!vehicle) {
        setValidationResult({
          vin: vinSearch,
          model: 'Unknown',
          year: 'Unknown',
          purchaseDate: '',
          warrantyStartDate: '',
          warrantyEndDate: '',
          mileage: 0,
          maxMileage: 0,
          warrantyStatus: 'not_found',
          customer: {
            name: 'Unknown',
            phone: 'Unknown',
            email: 'Unknown'
          }
        });
        toast({
          title: "Xe không tìm thấy",
          description: "VIN không có trong hệ thống. Vui lòng kiểm tra lại.",
          variant: "destructive"
        });
      } else {
        // Check warranty status
        const today = new Date();
        const warrantyEnd = new Date(vehicle.warrantyEndDate);
        const timeExpired = today > warrantyEnd;
        const mileageExpired = vehicle.mileage > vehicle.maxMileage;
        
        let status: VehicleWarrantyInfo['warrantyStatus'] = 'valid';
        if (timeExpired) status = 'expired_time';
        else if (mileageExpired) status = 'expired_mileage';
        
        const updatedVehicle = { ...vehicle, warrantyStatus: status };
        setValidationResult(updatedVehicle);
        
        if (status === 'valid') {
          toast({
            title: "Xe còn bảo hành",
            description: `${vehicle.model} của ${vehicle.customer.name} còn trong thời gian bảo hành.`
          });
        } else {
          const reason = status === 'expired_time' ? 'hết thời gian bảo hành' : 'vượt quá số km cho phép';
          toast({
            title: "Xe hết bảo hành",
            description: `${vehicle.model} đã ${reason}. Gợi ý khách hàng gia hạn bảo hành.`,
            variant: "destructive"
          });
        }
      }
      setIsLoading(false);
    }, 1500);
  };

  const getWarrantyStatusBadge = (status: VehicleWarrantyInfo['warrantyStatus']) => {
    switch (status) {
      case 'valid':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Còn bảo hành</Badge>;
      case 'expired_time':
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" />Hết hạn (thời gian)</Badge>;
      case 'expired_mileage':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Hết hạn (km)</Badge>;
      case 'not_found':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Không tìm thấy</Badge>;
      default:
        return null;
    }
  };

  const handleProceed = () => {
    if (validationResult) {
      onValidationComplete(validationResult);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Kiểm tra bảo hành xe
          </CardTitle>
          <CardDescription>
            Nhập mã VIN để kiểm tra tình trạng bảo hành của xe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="vin-input">Mã VIN</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="vin-input"
                placeholder="Nhập mã VIN (ví dụ: 1HGBH41JXMN109186)"
                value={vinSearch}
                onChange={(e) => setVinSearch(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={validateWarranty} 
                disabled={!vinSearch.trim() || isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </Button>
            </div>
          </div>

          {/* Demo VINs */}
          <Card className="bg-accent/20">
            <CardContent className="pt-4">
              <p className="font-medium mb-2">Mã VIN demo:</p>
              <div className="flex flex-wrap gap-2">
                {vehicleDatabase.map((vehicle) => (
                  <Badge
                    key={vehicle.vin}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setVinSearch(vehicle.vin)}
                  >
                    {vehicle.vin}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Validation Result */}
          {validationResult && (
            <Card className={`border-2 ${
              validationResult.warrantyStatus === 'valid' 
                ? 'border-green-200' 
                : validationResult.warrantyStatus === 'not_found'
                ? 'border-gray-200'
                : 'border-red-200'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Kết quả kiểm tra</CardTitle>
                  {getWarrantyStatusBadge(validationResult.warrantyStatus)}
                </div>
              </CardHeader>
              <CardContent>
                {validationResult.warrantyStatus !== 'not_found' ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Thông tin xe</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>VIN:</strong> {validationResult.vin}</p>
                        <p><strong>Model:</strong> {validationResult.model}</p>
                        <p><strong>Năm:</strong> {validationResult.year}</p>
                        <p><strong>Ngày mua:</strong> {new Date(validationResult.purchaseDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Thông tin khách hàng</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Tên:</strong> {validationResult.customer.name}</p>
                        <p><strong>SĐT:</strong> {validationResult.customer.phone}</p>
                        <p><strong>Email:</strong> {validationResult.customer.email}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-medium">Tình trạng bảo hành</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Bắt đầu:</strong> {new Date(validationResult.warrantyStartDate).toLocaleDateString('vi-VN')}</p>
                          <p><strong>Kết thúc:</strong> {new Date(validationResult.warrantyEndDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                          <p><strong>Km hiện tại:</strong> {validationResult.mileage.toLocaleString('vi-VN')} km</p>
                          <p><strong>Km tối đa:</strong> {validationResult.maxMileage.toLocaleString('vi-VN')} km</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Không tìm thấy thông tin xe với VIN: <strong>{validationResult.vin}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp.
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {validationResult.warrantyStatus === 'expired_time' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-medium text-amber-800 mb-2">Gợi ý cho khách hàng:</h5>
                    <p className="text-sm text-amber-700">
                      Xe đã hết thời gian bảo hành. Khách hàng có thể gia hạn bảo hành mở rộng 
                      hoặc sử dụng dịch vụ sửa chữa trả phí.
                    </p>
                  </div>
                )}
                {validationResult.warrantyStatus === 'expired_mileage' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-medium text-amber-800 mb-2">Gợi ý cho khách hàng:</h5>
                    <p className="text-sm text-amber-700">
                      Xe đã vượt quá số km bảo hành cho phép. Khách hàng có thể gia hạn bảo hành 
                      theo km hoặc sử dụng dịch vụ sửa chữa trả phí.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button 
              onClick={handleProceed}
              disabled={!validationResult || validationResult.warrantyStatus === 'not_found'}
            >
              {validationResult?.warrantyStatus === 'valid' 
                ? 'Tiếp tục tạo yêu cầu bảo hành' 
                : 'Ghi nhận yêu cầu'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantyValidator;