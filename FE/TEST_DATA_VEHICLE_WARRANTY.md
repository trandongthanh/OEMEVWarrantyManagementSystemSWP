# 🚗 DỮ LIỆU MẪU KIỂM TRA VEHICLE WARRANTY

## 📋 Danh sách VIN để test

### ✅ **XE CÒN BẢO HÀNH (VALID)**
| VIN | Model | Khách hàng | Trạng thái | Ghi chú |
|-----|-------|------------|------------|---------|
| `1HGBH41JXMN109186` | VinFast VF8 Plus | Nguyễn Văn Minh | ✅ Còn BH | Mới mua 2023, chạy 15,000km |
| `WVWZZZ1JZ3W386752` | VinFast VF9 Premium | Trần Thị Lan Anh | ✅ Còn BH | Xe mới 2024, chạy 8,500km |
| `VF8ABC123DEF456789` | VinFast VF8 Eco | Lê Hoàng Nam | ✅ Còn BH | Mua 2023, chạy 25,000km |
| `NEWCAR2025TEST123` | VinFast VF Wild (Concept) | Bùi Văn Đạt | ✅ Còn BH | Xe mới nhất 2025, 500km |
| `ALMOSTEXPIRE2024` | VinFast VF6 Standard | Hoàng Thị Bích | ✅ Còn BH | Gần hết km (159,000/160,000) |

### ⏰ **XE HẾT BẢO HÀNH THEO THỜI GIAN (EXPIRED_TIME)**
| VIN | Model | Khách hàng | Trạng thái | Ghi chú |
|-----|-------|------------|------------|---------|
| `JH4KA7532MC123456` | VinFast VF5 Basic | Phạm Văn Hùng | ❌ Hết BH | Mua 2016, hết hạn 2024 |
| `OLD2017VIN1234567` | VinFast Klara S | Đỗ Thị Hương | ❌ Hết BH | Mua 2017, hết hạn 2025 |

### 🛣️ **XE HẾT BẢO HÀNH THEO KM (EXPIRED_MILEAGE)**
| VIN | Model | Khách hàng | Trạng thái | Ghi chú |
|-----|-------|------------|------------|---------|
| `KMHGH4JH3EA123789` | VinFast VF8 City | Võ Thị Mai Phương | ❌ Hết BH | Chạy 165,000km (vượt 160,000) |
| `HIGHMILE123456789` | VinFast VF9 Luxury | Nguyễn Đức Thành | ❌ Hết BH | Chạy 180,000km (taxi/logistics) |

### ❓ **VIN KHÔNG TỒN TẠI (NOT_FOUND)**
- `NOTFOUND123456789` - Test case VIN không có trong hệ thống
- `INVALID1234567890` - Test case VIN không hợp lệ
- `WRONGVIN111111111` - Test case VIN sai

---

## 🎯 **HƯỚNG DẪN TEST**

### 1. **Cách test xe còn bảo hành:**
```
VIN: 1HGBH41JXMN109186
Kết quả mong đợi: ✅ Badge "Under Warranty" màu xanh
Toast: "Xe vẫn còn bảo hành"
```

### 2. **Cách test xe hết hạn theo thời gian:**
```
VIN: JH4KA7532MC123456
Kết quả mong đợi: ❌ Badge "Expired (Time)" màu đỏ
Toast: "Xe đã hết bảo hành - đã hết thời gian bảo hành"
```

### 3. **Cách test xe hết hạn theo km:**
```
VIN: KMHGH4JH3EA123789
Kết quả mong đợi: ❌ Badge "Expired (Mileage)" màu đỏ
Toast: "Xe đã hết bảo hành - đã vượt quá số km cho phép"
```

### 4. **Cách test VIN không tồn tại:**
```
VIN: NOTFOUND123456789
Kết quả mong đợi: ❓ Badge "Not Found" màu xám
Toast: "Vehicle not found"
```

---

## 📱 **CUSTOMER INFORMATION**

| Tên khách hàng | Phone | Email | Ghi chú |
|----------------|-------|-------|---------|
| Nguyễn Văn Minh | 0901234567 | minh.nguyen@gmail.com | Khách VIP |
| Trần Thị Lan Anh | 0987654321 | lan.tran@vinfast.vn | Nhân viên VinFast |
| Lê Hoàng Nam | 0912345678 | nam.le@email.com | Khách thường |
| Phạm Văn Hùng | 0912888999 | hung.pham@yahoo.com | Xe cũ |
| Võ Thị Mai Phương | 0934567890 | mai.vo@company.com | Công ty |

---

## 🔧 **CHÍNH SÁCH BẢO HÀNH**

- **Thời gian:** 8 năm từ ngày mua
- **Số km:** 160,000 km (theo chính sách VinFast)
- **Điều kiện:** Còn hiệu lực khi CÙNG LÚC chưa hết thời gian VÀ chưa vượt quá số km

---

## 🧪 **TEST SCENARIOS**

### Scenario 1: Happy Path
1. Nhập VIN: `1HGBH41JXMN109186`
2. Click "Check"
3. Verify: Badge xanh "Under Warranty"
4. Verify: Thông tin xe và khách hàng hiển thị đúng

### Scenario 2: Expired Time
1. Nhập VIN: `JH4KA7532MC123456`
2. Click "Check"  
3. Verify: Badge đỏ "Expired (Time)"
4. Verify: Gợi ý gia hạn bảo hành

### Scenario 3: Expired Mileage
1. Nhập VIN: `KMHGH4JH3EA123789`
2. Click "Check"
3. Verify: Badge đỏ "Expired (Mileage)"
4. Verify: Hiển thị số km vượt quá

### Scenario 4: Not Found
1. Nhập VIN: `NOTFOUND123456789`
2. Click "Check"
3. Verify: Badge xám "Not Found"
4. Verify: Message "VIN không tồn tại"

### Scenario 5: Edge Case - Almost Expired
1. Nhập VIN: `ALMOSTEXPIRE2024`
2. Click "Check"
3. Verify: Vẫn còn BH nhưng gần hết (159k/160k km)

---

## 🎨 **UI VERIFICATION**

- ✅ Loading spinner hiển thị khi đang check
- ✅ Badge color đúng theo trạng thái
- ✅ Toast notification xuất hiện
- ✅ Thông tin xe và khách hàng đầy đủ
- ✅ Button "Continue to create warranty request" enable/disable đúng
- ✅ Button "Record request" cho xe hết bảo hành

---

# 👨‍🔧 DỮ LIỆU MẪU TECHNICIAN ASSIGNMENT

## 📋 Danh sách Technicians để test

### 🔋 **BATTERY SYSTEMS SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-001 | Trần Minh Quân | 8 năm | 3/5 | 4.8⭐ | ✅ Available |
| tech-002 | Nguyễn Thị Bảo An | 6 năm | 2/5 | 4.7⭐ | ✅ Available |
| tech-014 | Trần Thị Xuân | 11 năm | 2/5 | 4.95⭐ | ✅ Available (Senior) |

### ⚡ **MOTOR & DRIVETRAIN SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-003 | Lê Thị Hoa | 10 năm | 2/5 | 4.9⭐ | ✅ Available |
| tech-004 | Phạm Văn Thành | 7 năm | 4/5 | 4.6⭐ | ✅ Available |
| tech-015 | Lê Văn Cường | 9 năm | 6/5 | 4.8⭐ | ❌ Busy |

### 💻 **ELECTRONICS & SOFTWARE SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-005 | Võ Minh Tuấn | 5 năm | 1/5 | 4.8⭐ | ✅ Available |
| tech-006 | Đỗ Thị Kim Loan | 4 năm | 3/5 | 4.5⭐ | ✅ Available |
| tech-016 | Phạm Thị Hương | 6 năm | 5/5 | 4.7⭐ | ❌ Unavailable |

### 🔌 **CHARGING SYSTEMS SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-007 | Nguyễn Văn Đức | 6 năm | 1/5 | 4.7⭐ | ✅ Available |
| tech-008 | Lý Thị Phương | 3 năm | 2/5 | 4.4⭐ | ✅ Available |
| tech-018 | Đinh Thị Lan | 1 năm | 1/5 | 4.0⭐ | ✅ Junior |

### 🔍 **GENERAL DIAGNOSTICS SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-009 | Võ Thị Mai | 12 năm | 2/5 | 4.9⭐ | ✅ Available |
| tech-010 | Hoàng Văn Long | 8 năm | 3/5 | 4.6⭐ | ✅ Available |
| tech-013 | Nguyễn Văn Sơn | 15 năm | 3/5 | 5.0⭐ | ✅ Senior Expert |
| tech-017 | Vũ Đình Nam | 2 năm | 1/5 | 4.2⭐ | ✅ Junior |

### 🚗 **BODY & INTERIOR SPECIALISTS**
| ID | Tên | Kinh nghiệm | Workload | Rating | Trạng thái |
|-----|-----|-------------|----------|--------|------------|
| tech-011 | Trần Thị Linh | 7 năm | 4/5 | 4.5⭐ | ✅ Available |
| tech-012 | Bùi Minh Đức | 5 năm | 2/5 | 4.3⭐ | ✅ Available |

---

## 🎯 **ISSUE CATEGORY MAPPING**

### 1. **Battery Performance Issues:**
- **Recommended:** Battery Systems specialists
- **Top picks:** tech-014 (Trần Thị Xuân), tech-001 (Trần Minh Quân)

### 2. **Motor Controller Issues:**
- **Recommended:** Motor & Drivetrain + Electronics specialists
- **Top picks:** tech-003 (Lê Thị Hoa), tech-005 (Võ Minh Tuấn)

### 3. **Charging System Issues:**
- **Recommended:** Charging Systems + Electronics specialists
- **Top picks:** tech-007 (Nguyễn Văn Đức), tech-005 (Võ Minh Tuấn)

### 4. **Electronics Issues:**
- **Recommended:** Electronics & Software specialists
- **Top picks:** tech-005 (Võ Minh Tuấn), tech-006 (Đỗ Thị Kim Loan)

### 5. **Software Issues:**
- **Recommended:** Electronics & Software specialists
- **Top picks:** tech-005 (Võ Minh Tuấn)

### 6. **Other Issues:**
- **Recommended:** General Diagnostics specialists
- **Top picks:** tech-013 (Nguyễn Văn Sơn), tech-009 (Võ Thị Mai)

---

## 🧪 **TEST SCENARIOS**

### Scenario 1: Battery Issue Assignment
1. Chọn Issue: "Battery Performance"
2. Verify: Hệ thống recommend Battery specialists
3. Expected: tech-014, tech-001, tech-002 appear in recommended

### Scenario 2: High Workload Handling
1. Chọn technician có workload cao (5-6/5)
2. Verify: Badge hiển thị "Busy" màu đỏ
3. Some technicians may not be available

### Scenario 3: Multi-technician Assignment
1. Chọn Main technician: tech-013 (Nguyễn Văn Sơn)
2. Chọn Assistant: tech-017 (Vũ Đình Nam) - Junior
3. Verify: Assignment summary hiển thị đúng

### Scenario 4: Specialty Matching
1. Issue: "Charging System"
2. Expected recommendations: Charging + Electronics specialists
3. Verify sorting: Rating cao > Workload thấp

---

## 🏆 **RATING & EXPERIENCE LEVELS**

### **Senior Experts (4.9-5.0 ⭐)**
- tech-013: Nguyễn Văn Sơn (5.0⭐ - 15 năm)
- tech-014: Trần Thị Xuân (4.95⭐ - 11 năm)
- tech-003: Lê Thị Hoa (4.9⭐ - 10 năm)
- tech-009: Võ Thị Mai (4.9⭐ - 12 năm)

### **Experienced (4.5-4.8 ⭐)**
- tech-001, tech-005, tech-007, tech-015 (4.7-4.8⭐)

### **Standard (4.0-4.4 ⭐)**
- tech-008, tech-012, tech-017, tech-018 (4.0-4.4⭐)

### **Workload Status:**
- **Available (1-2/5):** 🟢 Green badge
- **Normal (3-4/5):** 🟡 Yellow badge  
- **Busy (5-6/5):** 🔴 Red badge

---

## 🎮 **QUICK TEST COMMANDS**

```javascript
// In browser console (for debugging):
// Check all available technicians
console.log('Available Technicians:', technicians.filter(t => t.isAvailable));

// Check recommendations for battery issues
console.log('Battery Specialists:', technicians.filter(t => 
  t.isAvailable && t.specialty === 'Battery Systems'
));

// Check by rating
console.log('Top Rated:', technicians.filter(t => 
  t.isAvailable && t.rating >= 4.8
));
```