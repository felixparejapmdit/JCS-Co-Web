import { DomainException } from '../common/DomainException';

export interface ChequeCoordinate {
  readonly bankCode: string;
  readonly dateX: number; // mm from top-left
  readonly dateY: number;
  readonly payeeX: number;
  readonly payeeY: number;
  readonly amountFiguresX: number;
  readonly amountFiguresY: number;
  readonly amountWordsX: number;
  readonly amountWordsY: number;
}

/**
 * Strategy interface for multi-bank physical cheque printing alignment.
 */
export interface IChequeLayoutStrategy {
  isApplicable(bankCode: string): boolean;
  getCoordinates(): ChequeCoordinate;
}

export class BdoChequeLayoutStrategy implements IChequeLayoutStrategy {
  public isApplicable(bankCode: string): boolean {
    return bankCode.trim().toUpperCase() === 'BDO';
  }

  public getCoordinates(): ChequeCoordinate {
    return {
      bankCode: 'BDO',
      dateX: 152.4,
      dateY: 12.7,
      payeeX: 25.4,
      payeeY: 22.8,
      amountFiguresX: 155.0,
      amountFiguresY: 22.8,
      amountWordsX: 20.0,
      amountWordsY: 30.5,
    };
  }
}

export class BpiChequeLayoutStrategy implements IChequeLayoutStrategy {
  public isApplicable(bankCode: string): boolean {
    return bankCode.trim().toUpperCase() === 'BPI';
  }

  public getCoordinates(): ChequeCoordinate {
    return {
      bankCode: 'BPI',
      dateX: 150.0,
      dateY: 11.5,
      payeeX: 24.0,
      payeeY: 21.5,
      amountFiguresX: 152.0,
      amountFiguresY: 21.5,
      amountWordsX: 18.0,
      amountWordsY: 29.0,
    };
  }
}

export class MetrobankChequeLayoutStrategy implements IChequeLayoutStrategy {
  public isApplicable(bankCode: string): boolean {
    return bankCode.trim().toUpperCase() === 'METROBANK' || bankCode.trim().toUpperCase() === 'MBTC';
  }

  public getCoordinates(): ChequeCoordinate {
    return {
      bankCode: 'METROBANK',
      dateX: 153.0,
      dateY: 13.0,
      payeeX: 26.0,
      payeeY: 23.0,
      amountFiguresX: 154.0,
      amountFiguresY: 23.0,
      amountWordsX: 22.0,
      amountWordsY: 31.0,
    };
  }
}

export class ChequeLayoutFactory {
  private static readonly strategies: IChequeLayoutStrategy[] = [
    new BdoChequeLayoutStrategy(),
    new BpiChequeLayoutStrategy(),
    new MetrobankChequeLayoutStrategy(),
  ];

  public static getLayout(bankCode: string): ChequeCoordinate {
    const strategy = this.strategies.find((s) => s.isApplicable(bankCode));
    if (!strategy) {
      throw new DomainException(`No registered cheque print layout for bank code '${bankCode}'.`);
    }
    return strategy.getCoordinates();
  }
}
