import { k, u, Point } from '../common/GlobalImports';

export enum Direction {
	up = Math.PI * 3 / 2,
	down = Math.PI / 2,
	right = Math.PI,
	left = 0,
}

export default class SVGPaths {

    dash(diameter: number, margin: number): string {
		const y = diameter / 2;
        return `M${margin} ${y} L${diameter - margin} ${y}`;
    }

    x_cross(diameter: number, margin: number): string {
		const start = margin + 2;
		const end = diameter - start;
        return `M${start} ${start} L${end} ${end} M${start} ${end} L${end} ${start}`;
    }

    t_cross(diameter: number, margin: number): string {
		const radius = diameter / 2;
		const length = (radius - margin) * 2;
        return `M${margin + 2} ${radius} L${length + 1} ${radius} M${radius} ${margin + 2} L${radius} ${diameter - margin - 2}`;
    }

    circle(width: number, diameter: number, offset: Point = new Point()): string {
        const radius = diameter / 2;
        const center = width / 2;
        return `M${center + offset.x} ${center+ offset.y} m${-radius} 0a${radius} ${radius} 0 1,0 ${diameter} 0a${radius} ${radius} 0 1,0 ${-diameter} 0`;
    }

    oval(diameter: number, horizontal: boolean = true, eccentricity: number = 2.3): string {
        const radius = diameter / 2;
        const width = radius - (horizontal ? 1 : eccentricity);
        const height = radius - (horizontal ? eccentricity : 1);
        const doubleWidth = width * 2;
        return `M${radius - width} ${radius}a${width} ${height} 0 1,0 ${doubleWidth} 0a${width} ${height} 0 1,0 ${-doubleWidth} 0`;
    }

	arc(center: Point, radius: number, sweepFlag: number, startAngle: number, endAngle: number): string {
		const radial = new Point(radius, 0);
		const end = center.offsetBy(radial.rotate_by(endAngle));
		const start = center.offsetBy(radial.rotate_by(startAngle));
		const largeArcFlag = (u.normalized_angle(startAngle - endAngle) > Math.PI) ? 1 : 0;
		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
	}

	line(vector: Point): string {
		const x = vector.x;
		const y = vector.y;
		if (x >= 0 && y >= 0)		{ return `M 0 0 L ${x} ${y}`;
		} else if (x >= 0 && y < 0)	{ return `M 0 ${-y} L ${x} 0`;
		} else if (x < 0 && y >= 0)	{ return `M ${-x} 0 L 0 ${y}`;
		} else						{ return `M ${x} ${y} L 0 0`;
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
		return path + ' Z';
	}

    half_circle(diameter: number, direction: number): string {
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
			offset = offset.rotate_by(increment);
		}
		return path;
	}

	ellipses(stretch: number, tiny: number, horizontal: boolean = true, count: number = 3, other: number = 6): string {
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
		return paths.join(k.space);
	}

	// TODO: this only works for the default number of vertices (3)
	fat_polygon(size: number, direction: number, vertices: number = 3): string {
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
				controlOne: outer.rotate_by(preceder).offsetBy(offset),
				controlTwo: outer.rotate_by(follower).offsetBy(offset),
				end:		inner.rotate_by(   angle).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		return 'M' + start.description+ k.comma + arcs.join(k.space) + 'Z';
	}

}

export const svgPaths = new SVGPaths();
