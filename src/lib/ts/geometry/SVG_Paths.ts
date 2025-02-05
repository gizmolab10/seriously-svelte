import { k, u, Size, Point, T_Oblong, Direction } from '../common/Global_Imports';
import type { Integer } from '../common/Types';

export default class SVG_Paths {

	line_connecting(start: Point, end: Point) { return `M ${start.x} ${start.y} L ${end.x} ${end.y}`; }

	line_atAngle(start: Point, radius: number, angle: number) {
		return this.line_connecting(start, Point.fromPolar(radius, angle).offsetBy(start))
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

	annulus(center: Point, outer_radius: number, thickness: number, offset: Point = Point.zero): string {
		const offset_center = center.offsetBy(offset);
		const inner_center = offset_center.offsetByX(center.x * 2);
		return `${this.circle(offset_center, outer_radius, true)} ${this.circle(inner_center, outer_radius - thickness, false)}`;
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
        	return `M ${up ? 0 : diameter} ${radius}
				A ${radius} ${radius} 0 0 1 ${radius + (up ? radius : -radius)} ${radius}`;
		} else {
			const left = direction == Direction.right;
        	return `M ${radius} ${left ? 0 : diameter}
				A ${radius} ${radius} 0 0 1 ${radius} ${left ? (radius * 2) : 0}`;
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

	tinyDots_circular(diameter: number, count: Integer, points_right: boolean ): string {
		if (count < 10) {
			return this.tinyDots_fullCircular(diameter, count, points_right);
		} else {
			const small = count % 10 as Integer;
			const big = (count - small) / 10 as Integer;
			if (small == 0) {
				return this.tinyDots_fullCircular(diameter, big, points_right, 4);
			}
			return this.tinyDots_halfCircular(diameter, small, points_right, false) + this.tinyDots_halfCircular(diameter, big, points_right, true);
		}
	}

	tinyDots_fullCircular(diameter: number, count: Integer, points_right: boolean, dot_size: number = 2): string {
		if (count == 0) {
			return k.empty;
		}
		const radius = diameter / 3;
		const isOdd = (count % 2) != 0;
		const increment = Math.PI * 2 / count;
		const radial = new Point(isOdd ? radius : 0, isOdd ? 0 : radius).rotate_by(points_right ? 0 : Math.PI);
		return this.tinyDots(diameter, dot_size, increment, count, radial);
	}

	tinyDots_halfCircular(diameter: number, count: Integer, points_right: boolean, isBig: boolean): string {
		if (count == 0) {
			return k.empty;
		}
		const radius = diameter / 3;
		const dot_size = isBig ? 4 : 2;
		const increment = Math.PI / count;
		let radial = new Point(0, (isBig == points_right) ? -radius : radius).rotate_by(increment / 2);
		return this.tinyDots(diameter, dot_size, increment, count, radial);
	}

	tinyDots(diameter: number, dot_size: number, increment: number, count: Integer, radial: Point) {
		let i = 0;
		let path = k.empty;
		while (i++ < count) {
			path = path + this.circle_atOffset(diameter, dot_size, radial.offsetByXY(-0.7, 0.3));
			radial = radial.rotate_by(increment);
		}
		return path;
	}

	oblong(center: Point, size: Size, part: T_Oblong = T_Oblong.full) {
		const bumpRight = [T_Oblong.full, T_Oblong.right].includes(part);
		const bumpLeft = [T_Oblong.full, T_Oblong.left].includes(part);
		const radius = size.height / 2;
		const half = size.width / 2;
		const cx = center.x;
		const cy = center.y;
		const L = cx - half + (bumpLeft ? 0 : radius);
		const R = cx + half + (bumpRight ? 0 : radius);
		const T = cy - radius;
		const B = cy + radius;
		const TL = `${L}, ${T}`;
		const TR = `${R}, ${T}`;
		const BR = `${R}, ${B}`;
		const BL = `${L}, ${B}`;
		const cap = `${radius}, ${radius} 0 0 1`;
		switch(part) {
			case T_Oblong.middle: return `M ${TL} L ${TR} L ${BR} L ${BL} L ${TL} Z`;
			case T_Oblong.right:  return `M ${TL} L ${TR} A ${cap} ${BR} L ${BL} L ${TL} Z`;
			case T_Oblong.left:	 return `M ${TL} L ${TR} L ${BR} L ${BL} A ${cap} ${TL} Z`;
			case T_Oblong.full:	 return `M ${TL} L ${TR} A ${cap} ${BR} L ${BL} A ${cap} ${TL} Z`;
		}
		
	}

	ellipses(stretch: number, tiny: number, horizontal: boolean = true, count: number = 3, other: number = 6): string {
		const max = Math.min(4, count);
		const gap = stretch / (max - 1) - tiny;
		let a = 2.5 + ((max > 2) ? 0 : k.halfIncrement);
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
		const segmentAngle = Math.PI / vertices;
		const offset = Point.square(size / 2);
		const inner = Point.x(size / 3);
		const outer = Point.x(size / 2);
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
		return `<svg class='rotate-svg' width="48px" height="48px" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="20" stroke="black" stroke-width="2" fill="none" />
			<path class='rotate-path' d="M 4 24 a 20 20 0 0 1 40 0" fill="none" stroke="black" stroke-width="2"/>
			<polygon points="44 24 38 18 38 30" fill="black"/>
		</svg>`;
	}

	// double arrows
	// <polygon points="66.08 8.13 46.18 0 50.32 7.13 34.58 7.13 34.58 3.13 32.58 3.13 32.58 7.13 15.76 7.13 19.9 0 0 8.13 19.9 16.26 15.76 9.13 32.58 9.13 32.58 13.13 34.58 13.13 34.58 9.13 50.32 9.13 46.18 16.26 66.08 8.13"/>
	// rotate icon
	// <path class="b" d="M13.65 9.12c9.31-1.71 22.64-2.81 37.69 .01"/><polygon points="0 12.74 21.28 15.8 14.72 9.06 17.34 .03 0 12.74"/><polygon points="65 12.74 43.72 15.77 50.28 9.04 47.69 0 65 12.74"/>

	get hammer(): string {
		return 'M4 12\
			C4 7.58172 7.58172 4 12 4\
			C12.5523 4 13 3.55228 13 3\
			C13 2.44772 12.5523 2 12 2\
			C6.47715 2 2 6.47715 2 12\
			C2 17.5228 6.47715 22 12 22\
			C14.7611 22 17.2625 20.8796 19.0711 19.0711\
			C19.4616 18.6805 19.4616 18.0474 19.0711 17.6569\
			C18.6805 17.2663 18.0474 17.2663 17.6569 17.6569\
			C16.208 19.1057 14.2094 20 12 20\
			C7.58172 20 4 16.4183 4 12Z\
			M13 6\
			C13 5.44772 12.5523 5 12 5\
			C11.4477 5 11 5.44772 11 6V12\
			C11 12.2652 11.1054 12.5196 11.2929 12.7071\
			L14.2929 15.7071\
			C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071\
			C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929\
			L13 11.5858V6\
			Z\
			M21.7483 15.1674\
			C21.535 15.824 20.8298 16.1833 20.1732 15.97\
			C19.5167 15.7566 19.1574 15.0514 19.3707 14.3949\
			C19.584 13.7383 20.2892 13.379 20.9458 13.5923\
			C21.6023 13.8057 21.9617 14.5108 21.7483 15.1674Z\
			M21.0847 11.8267\
			C21.7666 11.7187 22.2318 11.0784 22.1238 10.3966\
			C22.0158 9.71471 21.3755 9.2495 20.6937 9.3575\
			C20.0118 9.46549 19.5466 10.1058 19.6546 10.7877\
			C19.7626 11.4695 20.4029 11.9347 21.0847 11.8267Z\
			M20.2924 5.97522\
			C20.6982 6.53373 20.5744 7.31544 20.0159 7.72122\
			C19.4574 8.127 18.6757 8.00319 18.2699 7.44468\
			C17.8641 6.88617 17.9879 6.10446 18.5464 5.69868\
			C19.1049 5.2929 19.8867 5.41671 20.2924 5.97522Z\
			M17.1997 4.54844\
			C17.5131 3.93333 17.2685 3.18061 16.6534 2.86719\
			C16.0383 2.55378 15.2856 2.79835 14.9722 3.41346\
			C14.6588 4.02858 14.9033 4.78129 15.5185 5.09471\
			C16.1336 5.40812 16.8863 5.16355 17.1997 4.54844\
			Z';
	}

	// for debugging paths
	sizeFrom_svgPath(svgPath: string): Size {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		const commands = svgPath.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
		let x = 0, y = 0;
		for (const command of commands) {
			const type = command[0];
			const args = command.slice(1).trim().split(/[\s,]+/).map(Number);
			switch (type) {
				case 'H': x = args[0]; break;
				case 'V': y = args[0]; break;
				case 'M':
				case 'L': [x, y] = args; break;
				case 'a':
				case 'A': handleArcCommand(args); break;
				case 'Z': break; // Close path, no coordinates to update
				default: throw new Error(`Unsupported command: ${type}`);
			}
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
		function handleArcCommand(args: number[]): void {
			const startX = x;
			const startY = y;
			let [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY] = args;
			x = endX;
			y = endY;
			const xAxisRotationRad = (xAxisRotation * Math.PI) / 180;							// Convert rotation to radians
			const dx2 = (startX - endX) / 2.0;													// Compute the half distance between the db_now and the end point
			const dy2 = (startY - endY) / 2.0;
			const x1 = Math.cos(xAxisRotationRad) * dx2 + Math.sin(xAxisRotationRad) * dy2;
			const y1 = -Math.sin(xAxisRotationRad) * dx2 + Math.cos(xAxisRotationRad) * dy2;
			const radiiCheck = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);					// Ensure radii are large enough
			if (radiiCheck > 1) {
				rx *= Math.sqrt(radiiCheck);
				ry *= Math.sqrt(radiiCheck);
			}
			const sign = largeArcFlag === sweepFlag ? -1 : 1;
			const sq = ((rx * rx) * (ry * ry) - (rx * rx) * (y1 * y1) - (ry * ry) * (x1 * x1)) / ((rx * rx) * (y1 * y1) + (ry * ry) * (x1 * x1));
			const coef = sign * Math.sqrt(Math.max(sq, 0));
			const cx1 = coef * ((rx * y1) / ry);
			const cy1 = coef * -((ry * x1) / rx);
			const cx = (startX + endX) / 2.0 + Math.cos(xAxisRotationRad) * cx1 - Math.sin(xAxisRotationRad) * cy1;
			const cy = (startY + endY) / 2.0 + Math.sin(xAxisRotationRad) * cx1 + Math.cos(xAxisRotationRad) * cy1;
			minX = Math.min(minX, startX, endX, cx - rx, cx + rx);								// Calculate bounding box
			minY = Math.min(minY, startY, endY, cy - ry, cy + ry);
			maxX = Math.max(maxX, startX, endX, cx - rx, cx + rx);
			maxY = Math.max(maxY, startY, endY, cy - ry, cy + ry);
		}
		return new Size(maxX - minX, maxY - minY);
	}

}

export const svgPaths = new SVG_Paths();
