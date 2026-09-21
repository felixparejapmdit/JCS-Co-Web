import { BaseEntity } from '../common/BaseEntity';

export interface Department {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  managerName: string;
  budgetMonthly: number;
  headcount: number;
  costCenterCode: string;
}

export type LeaveType = 
  | 'VACATION' 
  | 'SICK' 
  | 'EMERGENCY' 
  | 'MATERNITY_PATERNITY' 
  | 'BEREAVEMENT' 
  | 'SOLO_PARENT';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  date: string;
  timeIn: string;
  timeOut: string;
  tardinessMinutes: number;
  undertimeMinutes: number;
  overtimeHours: number;
  status: 'PRESENT' | 'LATE' | 'UNDERTIME' | 'ABSENT' | 'ON_LEAVE';
}

export interface Employee201Props {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  civilStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED';
  email: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  position: string;
  department: string;
  costCenterCode: string;
  employmentStatus: 'REGULAR' | 'PROBATIONARY' | 'CONTRACTUAL' | 'PROJECT_BASED';
  hireDate: string;
  regularizationDate?: string;
  monthlyBasicSalary: number;
  dailyRate: number;
  hourlyRate: number;
  allowanceMonthly: number;
  tin: string;
  sssNumber: string;
  philHealthNumber: string;
  pagIbigNumber: string;
  bankName: string;
  bankAccountNumber: string;
  vacationLeaveCredits: number;
  sickLeaveCredits: number;
  emergencyLeaveCredits: number;
}

export class Employee201 extends BaseEntity {
  public tenantId: string;
  public employeeCode: string;
  public firstName: string;
  public lastName: string;
  public middleName?: string;
  public gender: 'MALE' | 'FEMALE';
  public birthDate: string;
  public civilStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED';
  public email: string;
  public phone: string;
  public address: string;
  public emergencyContactName: string;
  public emergencyContactPhone: string;
  public position: string;
  public department: string;
  public costCenterCode: string;
  public employmentStatus: 'REGULAR' | 'PROBATIONARY' | 'CONTRACTUAL' | 'PROJECT_BASED';
  public hireDate: string;
  public regularizationDate?: string;
  public monthlyBasicSalary: number;
  public dailyRate: number;
  public hourlyRate: number;
  public allowanceMonthly: number;
  public tin: string;
  public sssNumber: string;
  public philHealthNumber: string;
  public pagIbigNumber: string;
  public bankName: string;
  public bankAccountNumber: string;
  public vacationLeaveCredits: number;
  public sickLeaveCredits: number;
  public emergencyLeaveCredits: number;

  constructor(props: Employee201Props) {
    super(props.id, 'system');
    this.tenantId = props.tenantId;
    this.employeeCode = props.employeeCode;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.middleName = props.middleName;
    this.gender = props.gender;
    this.birthDate = props.birthDate;
    this.civilStatus = props.civilStatus;
    this.email = props.email;
    this.phone = props.phone;
    this.address = props.address;
    this.emergencyContactName = props.emergencyContactName;
    this.emergencyContactPhone = props.emergencyContactPhone;
    this.position = props.position;
    this.department = props.department;
    this.costCenterCode = props.costCenterCode;
    this.employmentStatus = props.employmentStatus;
    this.hireDate = props.hireDate;
    this.regularizationDate = props.regularizationDate;
    this.monthlyBasicSalary = props.monthlyBasicSalary;
    this.dailyRate = props.dailyRate;
    this.hourlyRate = props.hourlyRate;
    this.allowanceMonthly = props.allowanceMonthly;
    this.tin = props.tin;
    this.sssNumber = props.sssNumber;
    this.philHealthNumber = props.philHealthNumber;
    this.pagIbigNumber = props.pagIbigNumber;
    this.bankName = props.bankName;
    this.bankAccountNumber = props.bankAccountNumber;
    this.vacationLeaveCredits = props.vacationLeaveCredits;
    this.sickLeaveCredits = props.sickLeaveCredits;
    this.emergencyLeaveCredits = props.emergencyLeaveCredits;
  }

  get fullName(): string {
    return `${this.lastName}, ${this.firstName}${this.middleName ? ` ${this.middleName[0]}.` : ''}`;
  }

  get isStatutoryComplete(): boolean {
    return Boolean(
      this.tin && this.tin.length >= 9 &&
      this.sssNumber && this.sssNumber.length >= 10 &&
      this.philHealthNumber && this.philHealthNumber.length >= 12 &&
      this.pagIbigNumber && this.pagIbigNumber.length >= 12
    );
  }
}
