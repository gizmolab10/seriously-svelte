import { Point } from '../geometry/Geometry';

describe('Point', () => {
  it('should create a point with given x and y coordinates', () => {
    const point = new Point(1, 2);
    expect(point.x).toBe(1);
    expect(point.y).toBe(2);
  });

  it('should correctly offset the point by another point', () => {
    const point1 = new Point(1, 2);
    const point2 = new Point(3, 4);
    const result = point1.offsetBy(point2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
});
