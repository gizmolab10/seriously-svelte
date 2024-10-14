import { k, u, Size, Point, Angle } from '../common/Global_Imports';

export enum Direction {
	up = Angle.three_quarters,
	down = Angle.quarter,
	right = Angle.half,
	left = Angle.zero,
}

export default class SVG_Paths {

	line_connecting(start: Point, end: Point) { return `M ${start.x} ${start.y} L ${end.x} ${end.y}`; }

	line_atAngle(start: Point, radius: number, angle: number) {
		return this.line_connecting(start, Point.fromPolar(radius, angle).offsetBy(start))
	}

	annulus(center: Point, outer_radius: number, thickness: number, offset: Point = Point.zero): string {
		const offset_center = center.offsetBy(offset);
		const inner_center = offset_center.offsetByX(center.x * 2);
		return `${this.circle(offset_center, outer_radius, true)} ${this.circle(inner_center, outer_radius - thickness, false)}`;
	}

    dash(diameter: number, margin: number): string {
		const y = diameter / 2;
        return `M${margin} ${y} L${diameter - margin} ${y}`;
    }

    x_cross(diameter: number, margin: number): string {
		const start = margin + 2;
		const end = diameter - start;
        return `M ${start} ${start} L ${end} ${end} M ${start} ${end} L ${end} ${start}`;
    }

    t_cross(diameter: number, margin: number): string {
		const radius = diameter / 2;
		const length = (radius - margin) * 2;
        return `M ${margin + 2} ${radius} L ${length + 1} ${radius} M ${radius} ${margin + 2} L ${radius} ${diameter - margin - 2}`;
    }

    circle_atOffset(width: number, diameter: number, offset: Point = Point.zero): string {
        const center = offset.offsetEquallyBy(width / 2);
		return this.circle(center, diameter / 2);
    }

    circle(center: Point, radius: number, clockwise: boolean = true): string {
		const direction = clockwise ? 0 : 1;
		const diametric_move = radius * 2 * (clockwise ? 1 : -1);
        return `M${center.x - radius} ${center.y} a ${radius} ${radius} 0 0 ${direction} ${diametric_move} 0 a ${radius} ${radius} 0 0 ${direction} ${-diametric_move} 0`;
    }

	oblong(center: Point, size: Size) {
		const x = center.x;
		const y = center.y;
		const halfway = size.width / 2;// L/2
		const radius = size.height / 2;// W/2
		return `M ${x - halfway}, ${y + radius} A ${radius}, ${radius} 0 0 1  ${x - halfway}, ${y - radius} H ${x + halfway} A ${radius}, ${radius} 0 0 1 ${x + halfway}, ${y + radius} Z`
	}

    oval(diameter: number, horizontal: boolean = true, eccentricity: number = 2.3): string {
        const radius = diameter / 2;
        const width = radius - (horizontal ? 1 : eccentricity);
        const height = radius - (horizontal ? eccentricity : 1);
        const doubleWidth = width * 2;
        return `M${radius - width} ${radius} a ${width} ${height} 0 1 0 ${doubleWidth} 0 a ${width} ${height} 0 1 0 ${-doubleWidth} 0`;
    }

	arc(center: Point, radius: number, sweepFlag: number, startAngle: number, endAngle: number): string {
		const end = center.offsetBy(Point.fromPolar(radius, endAngle));
		const start = center.offsetBy(Point.fromPolar(radius, startAngle));
		const largeArcFlag = ((startAngle - endAngle).angle_normalized() > Math.PI) ? 1 : 0;
		return `\nM ${start.x} ${start.y} \nA ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} \n${end.x} ${end.y}`;
	}

	arrow_head(tip: Point, angle: number, length: number = 5): string {
		return '';
	}

	arrowed_arc(center: Point, radius: number, angle: number, size: number = 32): string {
		return this.arc(center, radius, 1, 0, 0);
	}

	arrowed_line(angle: number, size: number = 32): string {
		return '';
	}

	arc_partial(center: Point, radius: number, largeArcFlag: number, sweepFlag: number, endAngle: number): string {
		const end = center.offsetBy(Point.fromPolar(radius, endAngle));
		return `\nA ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} \n${end.x} ${end.y}`;
	}

	startOutAt(center: Point, radius: number, startAngle: number) {
		const start = center.offsetBy(Point.fromPolar(radius, startAngle));
		return `\nM ${start.x} ${start.y}`;
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

	line(vector: Point, offset: Point = Point.zero): string {
		const x = vector.x + offset.x;
		const y = vector.y + offset.y;
		if (x >= 0 && y >= 0)		{ return `M ${offset.x} ${offset.y} L ${x} ${y}`;
		} else if (x >= 0 && y < 0)	{ return `M ${offset.x} ${-y} L ${x} ${offset.y}`;
		} else if (x < 0 && y >= 0)	{ return `M ${-x} ${offset.y} L ${offset.x} ${y}`;
		} else						{ return `M ${-x} ${-y} L ${offset.x} ${offset.y}`;
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
			path = path + this.circle_atOffset(size, 2, offset.offsetByXY(-0.7, 0.3));
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
			paths = pairs.map(p => `M ${p[0]} ${other} A ${tiny} ${tiny} 0 1 1 ${p[1]} ${other} A ${tiny} ${tiny} 0 1 1 ${p[0]} ${other}`);
		} else {
			paths = pairs.map(p => `M ${other} ${p[0]} A ${tiny} ${tiny} 0 1 1 ${other} ${p[1]} A ${tiny} ${tiny} 0 1 1 ${other} ${p[0]}`);
		}
		return paths.join(k.space);
	}

	// TODO: this only works for the default number of vertices (3)
	fat_polygon(size: number, angle: number, vertices: number = 3): string {
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
			const final = angle + i * segmentAngle * 2; // multiples of one third of a circle
			const halfWay = final - segmentAngle;
			const preceder = halfWay - tweak;
			const follower = halfWay + tweak;
			data.push({
				controlOne: outer.rotate_by(preceder).offsetBy(offset),
				controlTwo: outer.rotate_by(follower).offsetBy(offset),
				end:		inner.rotate_by(   final).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		return 'M' + start.description+ k.comma + arcs.join(k.space) + 'Z';
	}

	get rotateSVG(): string {
		return `<svg width="48px" height="48px" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="20" stroke="black" stroke-width="2" fill="none" />
			<path d="M 4 24 a 20 20 0 0 1 40 0" fill="none" stroke="black" stroke-width="2"/>
			<polygon points="44 24 38 18 38 30" fill="black"/>
		</svg>`;
	}

	// double arrows
	// <polygon points="66.08 8.13 46.18 0 50.32 7.13 34.58 7.13 34.58 3.13 32.58 3.13 32.58 7.13 15.76 7.13 19.9 0 0 8.13 19.9 16.26 15.76 9.13 32.58 9.13 32.58 13.13 34.58 13.13 34.58 9.13 50.32 9.13 46.18 16.26 66.08 8.13"/>
	// rotate icon
	// <path class="b" d="M13.65 9.12c9.31-1.71 22.64-2.81 37.69 .01"/><polygon points="0 12.74 21.28 15.8 14.72 9.06 17.34 .03 0 12.74"/><polygon points="65 12.74 43.72 15.77 50.28 9.04 47.69 0 65 12.74"/>

}

export const svgPaths = new SVG_Paths();
