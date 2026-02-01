# Backend-Frontend Alignment Fixes

## Summary
Aligned the frontend code with the backend API to ensure proper data structure and field naming consistency.

---

## Issues Fixed

### 1. **Month Field Structure** ✅
**Problem:** Backend uses `months` (JSONField array), frontend used `month` (string)
- **Backend expectation:** `months: ["January 2024", "February 2024"]`
- **Frontend was sending:** `month: "January 2024"`

**Fixes Applied:**
- Changed all references from `formData.month` → `formData.months`
- Updated month input to accept comma-separated months and convert to array
- Updated `parseMonth()` helper to accept array and extract first month for sorting
- Updated payslip list display to show months from array: `(payslip.months || []).join(", ")`

---

### 2. **Total Months Field** ✅
**Problem:** Backend requires `total_months` for calculation but frontend didn't send it
- **Backend model:** `total_months = models.PositiveIntegerField(default=1)`
- **Backend uses:** `net_pay = basic_salary * total_months - deductions + allowances`

**Fixes Applied:**
- Added `total_months: 1` to all formData initialization
- Auto-update `total_months` when months array changes: `total_months: monthsArray.length`
- Updated `employeeSummary` calculation to use: `(basicSalary * (formData.total_months || 1)) - totalDeductions + totalAllowances`

---

### 3. **Payment Status Inconsistency** ✅
**Problem:** Inconsistent use of case for payment_status values
- **Backend expects:** Lowercase `'paid'` or `'unpaid'`
- **Frontend was using:** Mixed case `'Unpaid'`, `'Paid'`, `'paid'`

**Fixes Applied:**
- Changed all `status: "Unpaid"` → `payment_status: "unpaid"`
- Updated status change handler to use lowercase: `formData.payment_status === 'paid' ? 'unpaid' : 'paid'`
- Added `String().toLowerCase()` checks for consistency in display logic

---

### 4. **API Endpoint URL** ✅
**Problem:** Download endpoint missing base URL
- **Was:** `salary-slip/${payslipId}/download/`
- **Should be:** `https://employeemanagement.company/api/salary-slip/${payslipId}/download/`

**Fix Applied:**
- Updated `handleDownloadPayslip()` with full URL

---

### 5. **Field Naming Consistency** ✅
**Problem:** Mixed use of `status` vs `payment_status`
- **Backend field:** `payment_status`
- **Frontend inconsistency:** Sometimes `status`, sometimes `payment_status`

**Fixes Applied:**
- Standardized all references to `payment_status`
- Updated `employeeSummary` to expose `payment_status` instead of `status`
- Updated form handlers to use consistent `payment_status` naming

---

## Backend Model Reference

```python
class PaymentMonth(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    ]
    
    profile = ForeignKey(Profile, ...)
    months = JSONField(default=list)  # Array of month strings
    total_months = PositiveIntegerField(default=1)  # Count of months
    basic_salary = PositiveIntegerField(default=0)
    total_deductions = PositiveIntegerField(default=0)
    total_allowances = PositiveIntegerField(default=0)
    net_pay = PositiveIntegerField(default=0)
    payment_status = CharField(choices=STATUS_CHOICES, default='unpaid')  # lowercase
    created_at = DateTimeField(auto_now_add=True)
    
    def save(self):
        # net_pay = months * basic_salary - deductions + allowances
        gross_salary = self.basic_salary * self.total_months
        self.net_pay = gross_salary - self.total_deductions + self.total_allowances
```

---

## Files Modified

### PayAdmin.jsx
- ✅ Updated formData structure (month → months, added total_months)
- ✅ Fixed parseMonth() to handle month arrays
- ✅ Updated all state setters to use new structure
- ✅ Fixed month input UI to handle comma-separated input
- ✅ Updated validation to check months array
- ✅ Fixed payment status handling (lowercase)
- ✅ Updated API download URL
- ✅ Fixed net salary calculation formula
- ✅ Updated payslip list display

### EmployeePayment.jsx
- ℹ️ No changes needed (reads-only, uses correct fields from backend)

---

## Testing Checklist

- [ ] Create new payslip with multiple months (comma-separated)
- [ ] Verify `total_months` is correctly calculated
- [ ] Verify net salary calculation: `(basic_salary × total_months) - deductions + allowances`
- [ ] Toggle payment status between paid/unpaid
- [ ] Download payslip PDF
- [ ] View existing payslips with multiple months
- [ ] Edit payslips and update months array
- [ ] Verify all API requests send correct field names

---

## API Endpoints Used

- **List:** `GET /api/admin/salary-slips/?profile={employeeId}`
- **Create/Update:** `POST/PUT /api/admin/salary-slips/`
- **Delete:** `DELETE /api/admin/salary-slips/{id}/`
- **Patch Status:** `PATCH /api/admin/salary-slips/{id}/`
- **Download:** `GET /api/salary-slip/{id}/download/`

All endpoints now correctly aligned with frontend requests.
