import { Point } from "./Geometry";

export enum Direction {
	downRight = Math.PI * 4 / 3,
	upRight = Math.PI * 2 / 3,
	down = Math.PI * 3 / 2,
	up = Math.PI / 2,
	right = Math.PI,
	left = 0,
}

export default class SVGPath {

    line(width: number): string { return `M0 1 L${width} 1`; }

    xCross(diameter: number, margin: number): string {
		const start = margin + 2;
		const end = diameter - start;
        return `M${start} ${start} L${end} ${end} M${start} ${end} L${end} ${start}`;
    }

    tCross(diameter: number, margin: number): string {
		const radius = diameter / 2;
		const length = (radius - margin) * 2;
        return `M${margin + 2} ${radius} L${length + 1} ${radius} M${radius} ${margin + 2} L${radius} ${diameter - margin - 2}`;
    }

    dash(diameter: number, margin: number): string {
		const y = diameter / 2;
		const start = margin + 2;
		const end = diameter - start;
        return `M${start} ${y} L${end} ${y}`;
    }

    circle(width: number, diameter: number, offset: Point = new Point()): string {
        const radius = diameter / 2;
        const center = width / 2;
        const doubleRadius = radius * 2;
        const path = `M${center + offset.x} ${center+ offset.y} m${-radius} 0a${radius} ${radius} 0 1,0 ${doubleRadius} 0a${radius} ${radius} 0 1,0 ${-doubleRadius} 0`;
        return path;
    }

    halfCircle(diameter: number, direction: number, offset: Point = new Point()): string {
		const up = direction == Direction.up;
        const radius = diameter / 2;
        const center = diameter / 2;
		const delta = up ? -radius : radius;
        const path = `M ${up ? 0 : diameter} ${center} A ${radius} ${radius} 0 0 1 ${radius - delta} ${center}`;
        return path;
    }

    oval(diameter: number, horizontal: boolean = true): string {
        const radius = diameter / 2;
        const width = radius - (horizontal ? 1 : 3);
        const height = radius - (horizontal ? 3 : 1);
        const doubleWidth = width * 2;
        const path = `M${radius - width} ${radius}a${width} ${height} 0 1,0 ${doubleWidth} 0a${width} ${height} 0 1,0 ${-doubleWidth} 0`;
        return path;
    }

	ellipses(tiny: number, gap: number): string {
		const x = 1;
		const y = 6;
		const x2 = x + tiny * 2;
		const x3 = x2 + gap + tiny;
		const x4 = x3 + 2 * tiny;
		const x5 = x4 + gap + tiny;
		const x6 = x5 + 2 * tiny;
		return `M ${x},${y} A ${tiny},${tiny} 0 1,1 ${x2},${y} A ${tiny},${tiny} 0 1,1 ${x},${y}
		M ${x3},${y} A ${tiny},${tiny} 0 1,1 ${x4},${y} A ${tiny},${tiny} 0 1,1 ${x3},${y}
		M ${x5},${y} A ${tiny},${tiny} 0 1,1 ${x6},${y} A ${tiny},${tiny} 0 1,1 ${x5},${y}`;
	}

	tinyDots(size: number, count: number): string {
		if (count == 0) {
			return '';
		}
		if (count == 1) {
			return this.circle(size, size / 2);
		}
		const radius = size / 3;
		const isOdd = (count % 2) != 0;
		const increment = Math.PI * 2 / count;
		let offset = new Point(isOdd ? radius : 0, isOdd ? 0 : radius);
		let index = 0;
		let path = '';
		while (index++ < count) {
			path = path + this.circle(size, size / (count + 1), offset);
			offset = this.rotatePoint(offset, increment);
		}
		return path;
	}

	triangle(size: number, direction: number): string {
		const width = size;
		const height = size;
		const offsetX = width / 2;
		const offsetY = height / 2;
		const insetRatio = 0.35;
		const radius = Math.min(width, height) * insetRatio;
		const outer = new Point(radius * 1.5, 0);
		const inner = new Point(radius, 0);
		const oneThirtieth = Math.PI / 15; // one thirtieth of a circle
		const oneSixth = Math.PI / 3; // one sixth of a circle
		let start = new Point(0, 0);
		let data = [];
		let index = 0;
		while (index < 3) {
			const angle = direction + index * oneSixth * 2; // multiples of one third of a circle
			const halfWay = angle - oneSixth;
			const preceder = halfWay - oneThirtieth;
			const follower = halfWay + oneThirtieth;
			data.push({
				controlOne: this.rotatePoint(outer, preceder),
				controlTwo: this.rotatePoint(outer, follower),
				end:		this.rotatePoint(inner, angle),
			});
			index += 1;
		}

		data = data.map(d => ({
			controlOne: new Point(d.controlOne.x + offsetX, d.controlOne.y + offsetY),
			controlTwo: new Point(d.controlTwo.x + offsetX, d.controlTwo.y + offsetY),
			end: new Point(d.end.x + offsetX, d.end.y + offsetY),
		}));

		start = data[2].end;
		return `M${start.x},${start.y},${data.map(d => `C${d.controlOne.x},${d.controlOne.y} ${d.controlTwo.x},${d.controlTwo.y} ${d.end.x},${d.end.y}`).join('')}Z`;
	}

	rotatePoint(point: Point, angle: number): Point {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			point.x * cos - point.y * sin,
			point.x * sin + point.y * cos
		);
	}
}

export const svgPath = new SVGPath();
