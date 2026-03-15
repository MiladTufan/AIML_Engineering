export class SmartArray {
  private arr: number[] = [];

  constructor(length: number) {
    this.arr = Array.from({ length: length }, (_, i) => i + 1);
  }

  /**
   * Get the array
   */
  get values(): number[] {
    return this.arr;
  }

  /**
   * Removes Index from array
   * @param index
   */
  removeAt(index: number): void {
    if (index >= 0 && index < this.arr.length) {
      this.arr.splice(index, 1);
    }
  }

  /**
   * Insert val at index
   * @param index
   * @param val
   */
  insertAt(index: number, val: number): void {
    if (index >= 0 && index < this.arr.length) {
      this.arr.splice(index, 0, val);
    }
  }

  /**
   * Swaps two values in array
   */
  swapIdx(i: number, j: number): void {
    if (i < 0 || j < 0 || i >= this.arr.length || j >= this.arr.length) return;
    [this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]];
  }
}
