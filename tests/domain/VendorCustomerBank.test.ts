import { describe, it, expect } from 'vitest';
import { Vendor } from '../../src/domain/entities/Vendor';
import { Customer } from '../../src/domain/entities/Customer';
import { BankAccount } from '../../src/domain/entities/BankAccount';
import { Money } from '../../src/domain/value-objects/Money';
import { DomainException } from '../../src/domain/common/DomainException';

describe('Masterfiles Entities (Vendor, Customer, BankAccount)', () => {
  it('should initialize Vendor with formatted Philippine TIN and ATC code', () => {
    const vendor = new Vendor({
      id: 'v-01',
      vendorCode: 'V-PETRON',
      vendorName: 'Petron Chemical Supply Corp',
      tin: '000123456000',
      registeredAddress: 'San Miguel Complex, Mandaluyong City',
      defaultAtc: 'WC160',
      createdBy: 'admin',
    });

    expect(vendor.vendorCode).toBe('V-PETRON');
    expect(vendor.tin.formattedValue).toBe('000-123-456-000');
    expect(vendor.defaultAtc).toBe('WC160');
    expect(vendor.paymentTermsDays).toBe(30);
  });

  it('should reject Vendor without required registered address for BIR Form 2307', () => {
    expect(
      () =>
        new Vendor({
          id: 'v-02',
          vendorCode: 'V-INVALID',
          vendorName: 'No Address Co',
          tin: '123456789000',
          registeredAddress: '',
          defaultAtc: 'WC160',
          createdBy: 'admin',
        })
    ).toThrow(DomainException);
  });

  it('should initialize Customer with credit limit Money and payment terms', () => {
    const customer = new Customer({
      id: 'c-01',
      customerCode: 'C-METRO',
      customerName: 'Metro Industrial Coatings Inc',
      tin: '987654321000',
      billingAddress: 'Valenzuela Industrial Park, Metro Manila',
      creditLimit: 500000,
      paymentTermsDays: 60,
      createdBy: 'admin',
    });

    expect(customer.customerCode).toBe('C-METRO');
    expect(customer.creditLimit.amount).toBe(500000);
    expect(customer.creditLimit.currency).toBe('PHP');
    expect(customer.paymentTermsDays).toBe(60);
  });

  it('should calibrate Bank Account cheque coordinates with custom millimeter printer offsets', () => {
    const bdoAccount = new BankAccount({
      id: 'bk-01',
      bankCode: 'BDO',
      bankName: 'Banco De Oro - Valenzuela Branch',
      accountNumber: '00123-45678-9',
      glAccountNumber: '1010-000',
      chequeMarginTopMm: 2.5, // 2.5mm shift down
      chequeMarginLeftMm: 1.0, // 1.0mm shift right
      createdBy: 'admin',
    });

    const coords = bdoAccount.getCalibratedChequeCoordinates();
    expect(coords.bankCode).toBe('BDO');
    // Base dateX for BDO is 152.4mm, with 1.0mm left shift => 153.4mm
    expect(coords.dateX).toBeCloseTo(153.4, 1);
    // Base dateY for BDO is 12.7mm, with 2.5mm top shift => 15.2mm
    expect(coords.dateY).toBeCloseTo(15.2, 1);
  });
});
