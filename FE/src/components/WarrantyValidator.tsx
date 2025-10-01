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

  // Mock vehicle warranty database với dữ liệu test chi tiết
  const vehicleDatabase: VehicleWarrantyInfo[] = [
    // === VEHICLE CÒN BẢO HÀNH (VALID) ===
    {
      vin: '1HGBH41JXMN109186',
      model: 'VinFast VF8 Plus',
      year: '2023',
      purchaseDate: '2023-03-15',
      warrantyStartDate: '2023-03-15',
      warrantyEndDate: '2031-03-15', // 8 năm bảo hành
      mileage: 15000,
      maxMileage: 160000, // 160,000km theo chính sách VinFast
      warrantyStatus: 'valid',
      customer: {
        name: 'Nguyễn Văn Minh',
        phone: '0901234567',
        email: 'minh.nguyen@gmail.com'
      }
    },
    {
      vin: 'WVWZZZ1JZ3W386752',
      model: 'VinFast VF9 Premium',
      year: '2024',
      purchaseDate: '2024-01-20',
      warrantyStartDate: '2024-01-20',
      warrantyEndDate: '2032-01-20',
      mileage: 8500,
      maxMileage: 160000,
      warrantyStatus: 'valid',
      customer: {
        name: 'Trần Thị Lan Anh',
        phone: '0987654321',
        email: 'lan.tran@vinfast.vn'
      }
    },
    {
      vin: 'VF8ABC123DEF456789',
      model: 'VinFast VF8 Eco',
      year: '2023',
      purchaseDate: '2023-06-10',
      warrantyStartDate: '2023-06-10',
      warrantyEndDate: '2031-06-10',
      mileage: 25000,
      maxMileage: 160000,
      warrantyStatus: 'valid',
      customer: {
        name: 'Lê Hoàng Nam',
        phone: '0912345678',
        email: 'nam.le@email.com'
      }
    },

    // === VEHICLE HẾT BẢO HÀNH THEO THỜI GIAN (EXPIRED_TIME) ===
    {
      vin: 'JH4KA7532MC123456',
      model: 'VinFast VF5 Basic',
      year: '2016',
      purchaseDate: '2016-06-10',
      warrantyStartDate: '2016-06-10',
      warrantyEndDate: '2024-06-10', // Đã hết hạn
      mileage: 45000,
      maxMileage: 160000,
      warrantyStatus: 'expired_time',
      customer: {
        name: 'Phạm Văn Hùng',
        phone: '0912888999',
        email: 'hung.pham@yahoo.com'
      }
    },
    {
      vin: 'OLD2017VIN1234567',
      model: 'VinFast Klara S',
      year: '2017',
      purchaseDate: '2017-03-15',
      warrantyStartDate: '2017-03-15',
      warrantyEndDate: '2025-03-15', // Gần hết hạn
      mileage: 35000,
      maxMileage: 160000,
      warrantyStatus: 'expired_time',
      customer: {
        name: 'Đỗ Thị Hương',
        phone: '0933777888',
        email: 'huong.do@hotmail.com'
      }
    },

    // === VEHICLE HẾT BẢO HÀNH THEO KM (EXPIRED_MILEAGE) ===
    {
      vin: 'KMHGH4JH3EA123789',
      model: 'VinFast VF8 City',
      year: '2022',
      purchaseDate: '2022-08-15',
      warrantyStartDate: '2022-08-15',
      warrantyEndDate: '2030-08-15',
      mileage: 165000, // Vượt quá giới hạn
      maxMileage: 160000,
      warrantyStatus: 'expired_mileage',
      customer: {
        name: 'Võ Thị Mai Phương',
        phone: '0934567890',
        email: 'mai.vo@company.com'
      }
    },
    {
      vin: 'HIGHMILE123456789',
      model: 'VinFast VF9 Luxury',
      year: '2021',
      purchaseDate: '2021-12-01',
      warrantyStartDate: '2021-12-01',
      warrantyEndDate: '2029-12-01',
      mileage: 180000, // Chạy nhiều km
      maxMileage: 160000,
      warrantyStatus: 'expired_mileage',
      customer: {
        name: 'Nguyễn Đức Thành',
        phone: '0945123456',
        email: 'thanh.nguyen@logistics.vn'
      }
    },

    // === VEHICLE ĐẶC BIỆT (EDGE CASES) ===
    {
      vin: 'NEWCAR2025TEST123',
      model: 'VinFast VF Wild (Concept)',
      year: '2025',
      purchaseDate: '2025-01-01',
      warrantyStartDate: '2025-01-01',
      warrantyEndDate: '2033-01-01',
      mileage: 500, // Xe mới
      maxMileage: 160000,
      warrantyStatus: 'valid',
      customer: {
        name: 'Bùi Văn Đạt',
        phone: '0977888999',
        email: 'dat.bui@vinfast-test.com'
      }
    },
    {
      vin: 'ALMOSTEXPIRE2024',
      model: 'VinFast VF6 Standard',
      year: '2020',
      purchaseDate: '2020-10-15',
      warrantyStartDate: '2020-10-15',
      warrantyEndDate: '2028-10-15', // Còn vài năm
      mileage: 159000, // Gần hết km
      maxMileage: 160000,
      warrantyStatus: 'valid', // Vẫn còn hạn
      customer: {
        name: 'Hoàng Thị Bích',
        phone: '0888123456',
        email: 'bich.hoang@gmail.com'
      }
    }
  ];

  const validateWarranty = () => {
    setIsLoading(true);

    // Simulate API call với mock data
    setTimeout(() => {
      // Tìm vehicle theo VIN trong mock database
      const vehicle = vehicleDatabase.find(v => v.vin.toLowerCase() === vinSearch.toLowerCase());

      if (!vehicle) {
        // VIN không tìm thấy
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
          title: "Vehicle not found",
          description: `VIN "${vinSearch}" không tồn tại trong hệ thống. Vui lòng kiểm tra lại.`,
          variant: "destructive"
        });
      } else {
        // Tìm thấy vehicle - kiểm tra warranty status
        const today = new Date();
        const warrantyEnd = new Date(vehicle.warrantyEndDate);
        const timeExpired = today > warrantyEnd;
        const mileageExpired = vehicle.mileage > vehicle.maxMileage;

        let status: VehicleWarrantyInfo['warrantyStatus'] = 'valid';
        if (timeExpired) status = 'expired_time';
        else if (mileageExpired) status = 'expired_mileage';

        const updatedVehicle = { ...vehicle, warrantyStatus: status };
        setValidationResult(updatedVehicle);

        // Hiển thị thông báo tương ứng
        if (status === 'valid') {
          toast({
            title: "✅ Xe vẫn còn bảo hành",
            description: `${vehicle.model} của ${vehicle.customer.name} vẫn trong thời gian bảo hành.`
          });
        } else {
          const reason = status === 'expired_time'
            ? 'đã hết thời gian bảo hành'
            : 'đã vượt quá số km cho phép';
          toast({
            title: "⚠️ Xe đã hết bảo hành",
            description: `${vehicle.model} ${reason}. Khuyến nghị khách hàng gia hạn bảo hành hoặc sử dụng dịch vụ có phí.`,
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
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Under Warranty</Badge>;
      case 'expired_time':
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" />Expired (Time)</Badge>;
      case 'expired_mileage':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Expired (Mileage)</Badge>;
      case 'not_found':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Not Found</Badge>;
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
            Vehicle Warranty Check
          </CardTitle>
          <CardDescription>
            Enter VIN to check the warranty status of the vehicle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="vin-input">VIN</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="vin-input"
                placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)"
                value={vinSearch}
                onChange={(e) => setVinSearch(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={validateWarranty}
                disabled={!vinSearch.trim() || isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Checking...' : 'Check'}
              </Button>
            </div>
          </div>



          {/* Validation Result */}
          {validationResult && (
            <Card className={`border-2 ${validationResult.warrantyStatus === 'valid'
                ? 'border-green-200'
                : validationResult.warrantyStatus === 'not_found'
                  ? 'border-gray-200'
                  : 'border-red-200'
              }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Validation Result</CardTitle>
                  {getWarrantyStatusBadge(validationResult.warrantyStatus)}
                </div>
              </CardHeader>
              <CardContent>
                {validationResult.warrantyStatus !== 'not_found' ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Vehicle Information</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>VIN:</strong> {validationResult.vin}</p>
                        <p><strong>Model:</strong> {validationResult.model}</p>
                        <p><strong>Year:</strong> {validationResult.year}</p>
                        <p><strong>Purchase Date:</strong> {new Date(validationResult.purchaseDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Customer Information</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {validationResult.customer.name}</p>
                        <p><strong>Phone:</strong> {validationResult.customer.phone}</p>
                        <p><strong>Email:</strong> {validationResult.customer.email}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-medium">Warranty Status</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Start:</strong> {new Date(validationResult.warrantyStartDate).toLocaleDateString('vi-VN')}</p>
                          <p><strong>End:</strong> {new Date(validationResult.warrantyEndDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                          <p><strong>Current Mileage:</strong> {validationResult.mileage.toLocaleString('vi-VN')} km</p>
                          <p><strong>Max Mileage:</strong> {validationResult.maxMileage.toLocaleString('vi-VN')} km</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No vehicle information found with VIN: <strong>{validationResult.vin}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please contact support for assistance.
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {validationResult.warrantyStatus === 'expired_time' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-medium text-amber-800 mb-2">Suggestions for Customers:</h5>
                    <p className="text-sm text-amber-700">
                      The warranty period has expired. Customers can extend the warranty or use paid repair services.
                    </p>
                  </div>
                )}
                {validationResult.warrantyStatus === 'expired_mileage' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-medium text-amber-800 mb-2">Suggestions for Customers:</h5>
                    <p className="text-sm text-amber-700">
                      The vehicle has exceeded the maximum mileage allowed for the warranty.
                      Customers can extend the warranty based on mileage or use paid repair services.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              disabled={!validationResult || validationResult.warrantyStatus === 'not_found'}
            >
              {validationResult?.warrantyStatus === 'valid'
                ? 'Continue to create warranty request'
                : 'Record request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantyValidator;