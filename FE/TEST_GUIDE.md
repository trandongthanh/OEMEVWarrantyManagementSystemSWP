# Quick Test Guide - Role Migration

## ⚠️ Trước khi test

**Bắt buộc**: Clear localStorage trước khi test
```javascript
// Chạy trong browser console
localStorage.clear();
window.location.href = '/login';
```

## 🧪 Test Cases

### Test 1: Service Center Staff
1. Login với `staff01` / `staff123`
2. Expected role: `service_center_staff`
3. Expected redirect: `/dashboard` → ServiceCenterDashboard
4. Verify trong console:
```javascript
const user = JSON.parse(localStorage.getItem('ev_warranty_user'));
console.log(user.role); // should be 'service_center_staff'
```

### Test 2: Technician
1. Login với `technician01` / `tech123`
2. Expected role: `service_center_technician`
3. Expected redirect: `/dashboard` → TechnicianDashboard
4. Verify trong console:
```javascript
const user = JSON.parse(localStorage.getItem('ev_warranty_user'));
console.log(user.role); // should be 'service_center_technician'
```

### Test 3: EMV Staff
1. Login với `emvstaff01` / `emv123`
2. Expected role: `emv_staff`
3. Expected redirect: `/dashboard` → ManufacturerDashboard
4. Verify trong console:
```javascript
const user = JSON.parse(localStorage.getItem('ev_warranty_user'));
console.log(user.role); // should be 'emv_staff'
```

### Test 4: EMV Admin
1. Login với `admin01` / `admin123`
2. Expected role: `emv_admin`
3. Expected redirect: `/dashboard` → ManufacturerDashboard
4. Verify trong console:
```javascript
const user = JSON.parse(localStorage.getItem('ev_warranty_user'));
console.log(user.role); // should be 'emv_admin'
```

## 🔒 Test Route Protection

### Test Protected Routes

1. Login as `staff01` (service_center_staff)
2. Try to access `/manufacturer` → Should see "Không có quyền truy cập"
3. Logout và login as `emvstaff01` (emv_staff)
4. Try to access `/service-center` → Should see "Không có quyền truy cập"

### Expected Access Matrix

| Route | service_center_staff | service_center_technician | emv_staff | emv_admin |
|-------|---------------------|---------------------------|-----------|-----------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/all-claims` | ✅ | ✅ | ❌ | ❌ |
| `/service-center` | ✅ | ✅ | ❌ | ❌ |
| `/manufacturer` | ❌ | ❌ | ✅ | ✅ |
| `/warranty-claims` | ❌ | ❌ | ✅ | ✅ |
| `/warranty-dashboard` | ❌ | ❌ | ✅ | ✅ |

## 🐛 Troubleshooting

### Problem: "Vai trò không xác định" after login
**Solution**: 
```javascript
localStorage.clear();
// Then login again
```

### Problem: Wrong dashboard displayed
**Check**:
1. Open browser console
2. Run: `console.log(JSON.parse(localStorage.getItem('ev_warranty_user')))`
3. Verify role matches expected
4. If not, check backend is returning correct role in JWT

### Problem: Route blocked even with correct role
**Check**:
1. Verify backend JWT contains correct roleName
2. Decode token in console:
```javascript
const token = localStorage.getItem('ev_warranty_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role from token:', payload.roleName);
```
3. Compare with role in user object

### Problem: Backend returns old role names
**Solution**: Backend database needs to be updated
```bash
cd BE
npm run seed  # Re-run seeder
```

## 📝 Debug Console Commands

```javascript
// 1. Check current user
const user = JSON.parse(localStorage.getItem('ev_warranty_user'));
console.log('Current user:', user);

// 2. Decode token
const token = localStorage.getItem('ev_warranty_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);

// 3. Clear and restart
localStorage.clear();
window.location.href = '/login';

// 4. Copy test script
// Paste content from test-role-migration.js
```

## ✅ Success Criteria

All tests pass if:
- [ ] Each test account logs in successfully
- [ ] Each user gets correct role from backend JWT
- [ ] Each user redirects to correct dashboard
- [ ] Route protection works correctly
- [ ] No console errors during login
- [ ] Role persists after page reload

## 📚 Related Files

- Implementation: `FE/src/contexts/AuthContext.tsx`
- Routes: `FE/src/App.tsx`
- Dashboard routing: `FE/src/pages/Dashboard.tsx`
- Permissions: `FE/src/utils/permissions.ts`
- Full guide: `FE/ROLE_MIGRATION_GUIDE.md`
