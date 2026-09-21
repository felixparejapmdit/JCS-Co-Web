import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { Employee201, LeaveRequest } from '@/domain/entities/HRIS';
import { Employee } from '@/domain/entities/Payroll';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';

  const emps = tenantStore.employees201.get(tenantId) || [];
  const depts = tenantStore.departments.get(tenantId) || [];
  const leaves = tenantStore.leaveRequests.get(tenantId) || [];
  const attendance = tenantStore.attendanceRecords.get(tenantId) || [];

  // Compute live compliance and headcount metrics
  const totalEmployees = emps.length;
  const regularCount = emps.filter((e) => e.employmentStatus === 'REGULAR').length;
  const probationaryCount = emps.filter((e) => e.employmentStatus === 'PROBATIONARY').length;
  const contractualCount = emps.filter((e) => e.employmentStatus === 'CONTRACTUAL' || e.employmentStatus === 'PROJECT_BASED').length;
  const pendingLeavesCount = leaves.filter((l) => l.status === 'PENDING').length;
  
  const compliantCount = emps.filter((e) => e.isStatutoryComplete).length;
  const statutoryComplianceRate = totalEmployees > 0 ? Math.round((compliantCount / totalEmployees) * 100) : 100;

  return NextResponse.json({
    success: true,
    tenantId,
    employees: emps,
    departments: depts,
    leaveRequests: leaves,
    attendanceRecords: attendance,
    stats: {
      totalEmployees,
      regularCount,
      probationaryCount,
      contractualCount,
      pendingLeavesCount,
      statutoryComplianceRate,
    },
  });
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create Employee (201 Profile)
    if (action === 'CREATE_EMPLOYEE') {
      const {
        employeeCode,
        firstName,
        lastName,
        middleName,
        gender,
        birthDate,
        civilStatus,
        email,
        phone,
        address,
        emergencyContactName,
        emergencyContactPhone,
        position,
        department,
        costCenterCode,
        employmentStatus,
        hireDate,
        monthlyBasicSalary,
        allowanceMonthly = 0,
        tin,
        sssNumber,
        philHealthNumber,
        pagIbigNumber,
        bankName,
        bankAccountNumber,
      } = body;

      if (!firstName || !lastName || !position || !department || !monthlyBasicSalary) {
        return NextResponse.json(
          { success: false, error: 'First name, last name, position, department, and salary are required.' },
          { status: 400 }
        );
      }

      const id = `${tenantId}-emp-${Date.now()}`;
      const dailyRate = Math.round((monthlyBasicSalary / 26) * 100) / 100;
      const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

      const newEmp201 = new Employee201({
        id,
        tenantId,
        employeeCode: employeeCode || `EMP-${tenantId}-${String(Date.now()).slice(-4)}`,
        firstName,
        lastName,
        middleName: middleName || '',
        gender: gender || 'MALE',
        birthDate: birthDate || '1995-01-01',
        civilStatus: civilStatus || 'SINGLE',
        email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jcs.ph`,
        phone: phone || '+63 900 000 0000',
        address: address || 'Metro Manila, Philippines',
        emergencyContactName: emergencyContactName || 'N/A',
        emergencyContactPhone: emergencyContactPhone || 'N/A',
        position,
        department,
        costCenterCode: costCenterCode || 'CC-GEN',
        employmentStatus: employmentStatus || 'PROBATIONARY',
        hireDate: hireDate || new Date().toISOString().slice(0, 10),
        monthlyBasicSalary: Number(monthlyBasicSalary),
        dailyRate,
        hourlyRate,
        allowanceMonthly: Number(allowanceMonthly),
        tin: tin || '',
        sssNumber: sssNumber || '',
        philHealthNumber: philHealthNumber || '',
        pagIbigNumber: pagIbigNumber || '',
        bankName: bankName || 'BDO Unibank',
        bankAccountNumber: bankAccountNumber || '',
        vacationLeaveCredits: 5,
        sickLeaveCredits: 5,
        emergencyLeaveCredits: 3,
      });

      // Add to HRIS 201 store
      const currentEmps201 = tenantStore.employees201.get(tenantId) || [];
      currentEmps201.unshift(newEmp201);
      tenantStore.employees201.set(tenantId, currentEmps201);

      // Keep legacy payroll Employee store synchronized
      const currentLegacy = tenantStore.employees.get(tenantId) || [];
      currentLegacy.unshift(
        new Employee({
          id,
          tenantId,
          employeeCode: newEmp201.employeeCode,
          firstName,
          lastName,
          position,
          department,
          tin: newEmp201.tin,
          sssNumber: newEmp201.sssNumber,
          philHealthNumber: newEmp201.philHealthNumber,
          pagIbigNumber: newEmp201.pagIbigNumber,
          monthlyBasicSalary: Number(monthlyBasicSalary),
          dailyRate,
          employmentStatus: newEmp201.employmentStatus as any,
          hireDate: newEmp201.hireDate,
        })
      );
      tenantStore.employees.set(tenantId, currentLegacy);

      tenantStore.recordAudit(
        tenantId,
        'Employee201',
        id,
        'CREATE',
        'HR_OFFICER',
        `Registered new 201 employee record ${newEmp201.fullName} (${newEmp201.employeeCode}) in ${department}.`
      );

      return NextResponse.json({ success: true, employee: newEmp201 });
    }

    // 2. Submit Leave Request
    if (action === 'APPLY_LEAVE') {
      const { employeeId, leaveType, startDate, endDate, daysCount, reason } = body;
      const emps = tenantStore.employees201.get(tenantId) || [];
      const emp = emps.find((e) => e.id === employeeId);

      if (!emp) {
        return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
      }

      const newLeave: LeaveRequest = {
        id: `${tenantId}-lv-${Date.now()}`,
        tenantId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        department: emp.department,
        leaveType: leaveType || 'VACATION',
        startDate,
        endDate,
        daysCount: Number(daysCount) || 1,
        reason: reason || 'Personal matters',
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
      };

      const leaves = tenantStore.leaveRequests.get(tenantId) || [];
      leaves.unshift(newLeave);
      tenantStore.leaveRequests.set(tenantId, leaves);

      return NextResponse.json({ success: true, leaveRequest: newLeave });
    }

    // 3. Review Leave (Approve / Reject)
    if (action === 'REVIEW_LEAVE') {
      const { leaveId, status, reviewerName, remarks } = body;
      const leaves = tenantStore.leaveRequests.get(tenantId) || [];
      const leave = leaves.find((l) => l.id === leaveId);

      if (!leave) {
        return NextResponse.json({ success: false, error: 'Leave request not found.' }, { status: 404 });
      }

      leave.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      leave.reviewedBy = reviewerName || 'HR Lead';
      leave.reviewedAt = new Date().toISOString();
      leave.remarks = remarks || '';

      tenantStore.recordAudit(
        tenantId,
        'LeaveRequest',
        leave.id,
        status,
        reviewerName || 'HR_OFFICER',
        `Leave application ${leave.id} for ${leave.employeeName} (${leave.leaveType}) ${status.toLowerCase()}.`
      );

      return NextResponse.json({ success: true, leaveRequest: leave });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('HRIS API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
