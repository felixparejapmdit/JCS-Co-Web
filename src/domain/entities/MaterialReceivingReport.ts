import { BaseEntity } from '../common/BaseEntity';
import { Money } from '../value-objects/Money';
import { DomainException } from '../common/DomainException';

export interface MMRRItem {
  itemCode: string;
  description: string;
  unitOfMeasure: string;
  poQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface MMRRProps {
  id: string;
  tenantId: string;
  mmrrNumber: string;
  receivingDate: Date;
  purchaseOrderNumber: string;
  vendorCode: string;
  vendorName: string;
  deliveryReceiptNumber: string;
  warehouseLocation: string;
  items: MMRRItem[];
  remarks?: string;
  createdBy: string;
}

export class MaterialReceivingReport extends BaseEntity<string> {
  public readonly tenantId: string;
  public readonly mmrrNumber: string;
  public readonly receivingDate: Date;
  public readonly purchaseOrderNumber: string;
  public readonly vendorCode: string;
  public readonly vendorName: string;
  public readonly deliveryReceiptNumber: string;
  public readonly warehouseLocation: string;
  public readonly remarks: string;
  private readonly _items: MMRRItem[] = [];
  public isMatchedWithPO: boolean = false;
  public status: 'PENDING_INSPECTION' | 'ACCEPTED' | 'REJECTED' = 'ACCEPTED';

  constructor(props: MMRRProps) {
    super(props.id, props.createdBy);

    if (!props.purchaseOrderNumber) {
      throw new DomainException('Purchase Order number is mandatory for MMRR 3-way matching.');
    }
    if (!props.items || props.items.length === 0) {
      throw new DomainException('At least one chemical item must be listed in MMRR.');
    }

    this.tenantId = props.tenantId;
    this.mmrrNumber = props.mmrrNumber;
    this.receivingDate = props.receivingDate;
    this.purchaseOrderNumber = props.purchaseOrderNumber;
    this.vendorCode = props.vendorCode;
    this.vendorName = props.vendorName;
    this.deliveryReceiptNumber = props.deliveryReceiptNumber;
    this.warehouseLocation = props.warehouseLocation;
    this.remarks = props.remarks || '';
    this._items = [...props.items];
    this.isMatchedWithPO = this.verify3WayMatch();
  }

  public get items(): ReadonlyArray<MMRRItem> {
    return [...this._items];
  }

  public getTotalCost(): Money {
    const sum = this._items.reduce((acc, it) => acc + (it.receivedQuantity * it.unitCost), 0);
    return new Money(sum);
  }

  public verify3WayMatch(): boolean {
    // 3-way match: received qty must not exceed PO qty by more than 5% tolerance
    return this._items.every((it) => it.receivedQuantity <= it.poQuantity * 1.05);
  }
}
