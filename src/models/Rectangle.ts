/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains(x: number, y: number): boolean {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
  }
}
