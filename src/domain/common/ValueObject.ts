/**
 * Abstract ValueObject enforcing structural equality based on constituent values.
 */
export abstract class ValueObject {
  protected abstract getEqualityComponents(): unknown[];

  public equals(other?: ValueObject | null): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) return false;

    const thisComponents = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();

    if (thisComponents.length !== otherComponents.length) return false;

    return thisComponents.every((component, index) => {
      const otherComponent = otherComponents[index];
      if (component instanceof ValueObject && otherComponent instanceof ValueObject) {
        return component.equals(otherComponent);
      }
      return component === otherComponent;
    });
  }
}
