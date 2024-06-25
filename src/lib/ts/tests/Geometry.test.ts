import { Point } from '../geometry/Geometry';

describe('Point', () => {
	it('create a vector', () => {
		const point = new Point(1, 2);
		expect(point.x).toBe(1);
		expect(point.y).toBe(2);
	});

	it('vector from polar', () => {
		const point = Point.fromPolar(Math.sqrt(2), Math.PI / 4);
		expect(point.x).toBeCloseTo(1);
		expect(point.y).toBeCloseTo(-1);	// in browser coordinates, negative y is above x axis
	});
	
	it('negate a vector', () => {
		const point = new Point(1, 2).negated;
		expect(point.x).toBe(-1);
		expect(point.y).toBe(-2);
	});

	it('add two vectors', () => {
		const point1 = new Point(1, 2);
		const point2 = new Point(3, 4);
		const result = point1.offsetBy(point2);
		expect(result.x).toBe(4);
		expect(result.y).toBe(6);
	});

	it('vector magnitude', () => {
		const point = new Point(1, 2);
		const magnitude = point.magnitude;
		const squared = point.x * point.x + point.y * point.y;
		expect(magnitude).toBe(Math.sqrt(squared));
	});

	it('vector angle', () => {
		const point = new Point(2, -2);	// in browser coordinates, negative y is above x axis
		const angle = point.angle;
		expect(angle).toBe(Math.PI / 4);
	});

});
