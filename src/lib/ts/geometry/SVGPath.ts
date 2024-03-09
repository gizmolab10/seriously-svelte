import { k, Point } from '../common/GlobalImports';

export enum Direction {
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
		const start = margin;
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

	tinyDots_circular(size: number, count: number): string {
		if (count == 0) {
			return '';
		}
		let index = 0;
		let path = '';
		const radius = size / 3;
		const isOdd = (count % 2) != 0;
		const increment = Math.PI * 2 / count;
		let offset = new Point(isOdd ? radius : 0, isOdd ? 0 : radius);2
		while (index++ < count) {
			path = path + this.circle(size, size / 9, offset.offsetByX(-0.5));
			offset = this.rotatePoint(offset, increment);
		}
		return path;
	}

	// TODO: this only works for the default number of vertices
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
		let index = 0;
		while (index++ < vertices) {
			const angle = direction + index * segmentAngle * 2; // multiples of one third of a circle
			const halfWay = angle - segmentAngle;
			const preceder = halfWay - tweak;
			const follower = halfWay + tweak;
			data.push({
				controlOne: this.rotatePoint(outer, preceder).offsetBy(offset),
				controlTwo: this.rotatePoint(outer, follower).offsetBy(offset),
				end:		this.rotatePoint(inner,    angle).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		const path = 'M' + start.description+ k.comma + arcs.join(k.space) + 'Z';
		// console.log(path);
		return path;
	}

	rotatePoint(point: Point, angle: number): Point {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			point.x * cos - point.y * sin,
			point.x * sin + point.y * cos
		);
	}

	tinyDots_linear(size: number, tiny: number, count: number = 3, vertical: boolean = false): string {
		const pairs: Array<Array<number>> = [[1]];
		const gap = size / count - tiny;
		const other = 6;
		let index = 0;
		while (index < count) {
			const pair = pairs[index];
			const first = pair[0];
			const other = first + tiny * 2;
			pairs[index][1] = other;
			if (index + 1 < count) {
				pairs[index + 1] = [];
				pairs[index + 1][0] = other + gap + tiny;
			}
			index++;
		}
		const paths = pairs.map(p => `M ${p[0]},${other} A ${tiny},${tiny} 0 1,1 ${p[1]},${other} A ${tiny},${tiny} 0 1,1 ${p[0]},${other} `);
		const path = paths.join(k.space);
		// console.log(path);
		return path;
	}

}

export const svgPath = new SVGPath();
