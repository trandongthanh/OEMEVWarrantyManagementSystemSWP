# Caseline Approval/Rejection Feature Guide

## Tổng quan
Tính năng này cho phép Super Advisor approve hoặc reject các caselines có status `PENDING_APPROVAL`.

## Cách sử dụng

### 1. Xem Caselines
- Trong bảng warranty records, click nút **"View Caselines"** ở cột Actions
- Dialog sẽ hiển thị tất cả caselines của record đó

### 2. Nhận diện Caselines cần xử lý
- Caselines có status **"⏳ PENDING APPROVAL"** sẽ có:
  - Badge màu vàng với text "PENDING APPROVAL"
  - 2 nút: **Approve** (xanh lá) và **Reject** (đỏ)
- Phía trên danh sách sẽ có thông báo số lượng caselines đang chờ quyết định

### 3. Chọn Approve/Reject
#### Approve một caseline:
- Click nút **"Approve"** màu xanh lá
- Nút sẽ đổi thành "Selected for Approval"
- Background của caseline card chuyển sang màu xanh nhạt

#### Reject một caseline:
- Click nút **"Reject"** màu đỏ  
- Nút sẽ đổi thành "Selected for Rejection"
- Background của caseline card chuyển sang màu đỏ nhạt

#### Hủy lựa chọn:
- Click lại nút đã chọn để bỏ selection

### 4. Submit quyết định
- Sau khi chọn xong các caselines cần approve/reject
- Phía dưới dialog sẽ hiển thị:
  - Tổng số caselines đã chọn: "Selected: X approved, Y rejected"
  - Nút **"Submit Decisions"** màu xanh dương
- Click **"Submit Decisions"** để gửi quyết định lên server

### 5. Kết quả
- Thành công: 
  - Toast notification hiển thị số lượng caselines đã được xử lý
  - Danh sách caselines tự động reload
  - Selections được reset về rỗng
- Lỗi:
  - Toast notification hiển thị lỗi chi tiết

## API Endpoint được sử dụng
```
PATCH /api/v1/case-lines/approve
```

### Request Body:
```json
{
  "approvedCaseLineIds": [
    "770e8400-e29b-41d4-a716-446655440003",
    "880e8400-e29b-41d4-a716-446655440004"
  ],
  "rejectedCaseLineIds": [
    "990e8400-e29b-41d4-a716-446655440005"
  ]
}
```

### Response Success:
```json
{
  "status": "success",
  "data": {
    "approved": [
      {
        "caselineId": "770e8400-e29b-41d4-a716-446655440003",
        "status": "CUSTOMER_APPROVED"
      }
    ],
    "rejected": [
      {
        "caselineId": "990e8400-e29b-41d4-a716-446655440005",
        "status": "REJECTED"
      }
    ]
  }
}
```

## Lưu ý
- Chỉ caselines có status `PENDING_APPROVAL` mới hiển thị nút approve/reject
- Không thể approve và reject cùng một caseline (chọn cái sau sẽ bỏ chọn cái trước)
- Phải chọn ít nhất 1 caseline trước khi submit
- Token authentication bắt buộc (auto lấy từ localStorage)

## Troubleshooting

### Không thấy nút Approve/Reject?
- Kiểm tra status của caseline có phải là `PENDING_APPROVAL` không
- Nếu không, caseline chưa sẵn sàng để approve

### Submit thất bại?
- Kiểm tra token còn hạn không (`ev_warranty_token` in localStorage)
- Kiểm tra network tab xem có lỗi từ backend không
- Đảm bảo đã chọn ít nhất 1 caseline

### Caselines không reload sau khi submit?
- Refresh lại trang
- Kiểm tra console log xem có lỗi không
