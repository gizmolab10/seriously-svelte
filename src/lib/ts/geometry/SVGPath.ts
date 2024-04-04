import { k, u, Point } from '../common/GlobalImports';

export enum Direction {
	down = Math.PI * 3 / 2,
	up = Math.PI / 2,
	right = Math.PI,
	left = 0,
}

export default class SVGPath {

    dash(diameter: number, margin: number): string {
		const y = diameter / 2;
        return `M${margin} ${y} L${diameter - margin} ${y}`;
    }

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

    circle(width: number, diameter: number, offset: Point = new Point()): string {
        const radius = diameter / 2;
        const center = width / 2;
        const path = `M${center + offset.x} ${center+ offset.y} m${-radius} 0a${radius} ${radius} 0 1,0 ${diameter} 0a${radius} ${radius} 0 1,0 ${-diameter} 0`;
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

	line(vector: Point): string {
		const x = vector.x;
		const y = vector.y;
		if (x >= 0 && y >= 0)		{ return `M0 0 L${x} ${y}`;
		} else if (x >= 0 && y < 0)	{ return `M0 ${-y} L${x} 0`;
		} else if (x < 0 && y >= 0)	{ return `M${-x} 0 L0 ${y}`;
		} else						{ return `M${x} ${y} L0 0`;
		}
	}

	polygon(radius: number, angle: number, count: number = 3, skip: Array<number>): string {
		const points = u.polygonPoints(radius, count, angle);
		const center = Point.square(radius);
		let index = count;
		let path = 'M ';
		while (index > 0) {
			index --;
			if (!skip.includes(index)) {
				const separator = (index == 0) ? k.empty : ' L ';
				const point = center.offsetBy(points[index]);
				path = path + `${point.x} ${point.y}${separator}`
			}
		}
		path = path + ' Z';
		return path;
	}

    halfCircle(diameter: number, direction: number): string {
		const vertical = [Direction.up, Direction.down].includes(direction);
        const radius = diameter / 2;
		if (vertical) {
			const up = direction == Direction.up;
        	return `M ${up ? 0 : diameter} ${radius} A ${radius} ${radius} 0 0 1 ${radius + (up ? radius : -radius)} ${radius}`;
		} else {
			const left = direction == Direction.right;
        	return `M ${radius} ${left ? 0 : diameter} A ${radius} ${radius} 0 0 1 ${radius} ${left ? (radius * 2) : 0}`;
		}
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

	tinyDots_circular(size: number, count: number): string {
		if (count == 0) {
			return k.empty;
		}
		let i = 0;
		let path = k.empty;
		const radius = size / 3;
		const isOdd = (count % 2) != 0;
		const increment = Math.PI * 2 / count;
		let offset = new Point(isOdd ? radius : 0, isOdd ? 0 : radius);2
		while (i++ < count) {
			path = path + this.circle(size, 2, offset.offsetBy(new Point(-0.7, 0.3)));
			offset = offset.rotateBy(increment);
		}
		return path;
	}

	tinyDots_linear(stretch: number, tiny: number, horizontal: boolean = true, count: number = 3, other: number = 6): string {
		const max = Math.min(4, count);
		const gap = stretch / (max - 1) - tiny;
		let a = 2.5 + ((max > 2) ? 0 : 0.5);
		let i = 0;
		let paths: Array<string> = [];
		const pairs: Array<Array<number>> = [[a]];
		while (i < max) {
			const b = a + tiny * 2;
			pairs[i][1] = b;
			if (i + 1 < max) {
				a = b + gap - tiny / max;
				pairs[i + 1] = [a];
			}
			i++;
		}
		if (horizontal) {
			paths = pairs.map(p => `M ${p[0]},${other} A ${tiny},${tiny} 0 1,1 ${p[1]},${other} A ${tiny},${tiny} 0 1,1 ${p[0]},${other}`);
		} else {
			paths = pairs.map(p => `M ${other},${p[0]} A ${tiny},${tiny} 0 1,1 ${other},${p[1]} A ${tiny},${tiny} 0 1,1 ${other},${p[0]}`);
		}
		const path = paths.join(k.space);
		const last = pairs[max - 1][1];
		// console.log('count: ' + count + ', gap: ' + gap + ', last: ' + last + ', stretch: ' + (last - gap / 2));
		return path;
	}

	// TODO: this only works for the default number of vertices (3)
	fatPolygon(size: number, direction: number, vertices: number = 3): string {
		const width = size;
		const height = size;
		const insetRatio = 0.35;
		const radius = Math.min(width, height) * insetRatio;
		const offset = new Point(width / 2, height / 2);
		const outer = new Point(radius * 1.5, 0);
		const segmentAngle = Math.PI / vertices;
		const inner = new Point(radius, 0);
		const tweak = segmentAngle / 5;
		let data = [];
		let i = 0;
		while (i++ < vertices) {
			const angle = direction + i * segmentAngle * 2; // multiples of one third of a circle
			const halfWay = angle - segmentAngle;
			const preceder = halfWay - tweak;
			const follower = halfWay + tweak;
			data.push({
				controlOne: outer.rotateBy(preceder).offsetBy(offset),
				controlTwo: outer.rotateBy(follower).offsetBy(offset),
				end:		inner.rotateBy(   angle).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		const path = 'M' + start.description+ k.comma + arcs.join(k.space) + 'Z';
		// console.log(path);
		return path;
	}

}

export const svgPath = new SVGPath();
