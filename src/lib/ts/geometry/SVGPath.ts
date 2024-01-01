import { Size } from "./Geometry";

export enum Direction {
	downRight = Math.PI * 4 / 3,
	upRight = Math.PI * 2 / 3,
	down = Math.PI * 3 / 2,
	up = Math.PI / 2,
	right = Math.PI,
	left = 0,
}

export default class SVGPath {

    line(width: number) {
        return 'M0 1 L' + width + ' 1';
    }

    dash(diameter: number, margin: number) {
		const start = margin + 2;
		const radius = diameter / 2;
		const end = diameter - start;
        return `M${start} ${radius} L${end} ${radius}`;
    }

    xCross(diameter: number, margin: number) {
		const start = margin + 2;
		const end = diameter - start;
        return `M${start} ${start} L${end} ${end} M${start} ${end} L${end} ${start}`;
    }

    tCross(diameter: number, margin: number) {
		const radius = diameter / 2;
		const length = (radius - margin) * 2;
        return `M${margin + 2} ${radius} L${length} ${radius} M${radius} ${margin + 2} L${radius} ${diameter - margin - 2}`;
    }

    oval(diameter: number, horizontal: boolean = true) {
        const radius = diameter / 2;
        const width = radius - (horizontal ? 1 : 3);
        const height = radius - (horizontal ? 3 : 1);
        const doubleWidth = width * 2;
        const path = 'M' + radius + ' ' + radius + ' m-' + width + ' 0a' + width + ' ' + height + ' 0 1,0 ' + doubleWidth + ' 0a' + width + ' ' + height + ' 0 1,0 -' + doubleWidth + ' 0';
        return path;
    }

    circle(width: number, diameter: number) {
        const radius = diameter / 2;
        const center = width / 2;
        const doubleRadius = radius * 2;
        const path = 'M' + center + ' ' + center + ' m-' + radius + ' 0a' + radius + ' ' + radius + ' 0 1,0 ' + doubleRadius + ' 0a' + radius + ' ' + radius + ' 0 1,0 -' + doubleRadius + ' 0';
        return path;
    }

	triangle(size: Size, direction: number) {
		const width = size.width;
		const height = size.height;
		const offsetX = width / 2;
		const offsetY = height / 2;
		const insetRatio = 0.35;
		const radius = Math.min(width, height) * insetRatio;
		const oneSixth = Math.PI / 3; // one sixth of a circle
		const oneThirtieth = Math.PI / 15; // one thirtieth of a circle
		const inner = { x: radius, y: 0 };
		const outer = { x: radius * 1.5, y: 0 };
		let start = { x: 0, y: 0 };
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
			controlOne: { x: d.controlOne.x + offsetX, y: d.controlOne.y + offsetY },
			controlTwo: { x: d.controlTwo.x + offsetX, y: d.controlTwo.y + offsetY },
			end: { x: d.end.x + offsetX, y: d.end.y + offsetY },
		}));

		start = data[2].end;
		return `M${start.x},${start.y},${data.map(d => `C${d.controlOne.x},${d.controlOne.y} ${d.controlTwo.x},${d.controlTwo.y} ${d.end.x},${d.end.y}`).join('')}Z`;
	}

	rotatePoint(point: {x:number, y:number}, angle: number) {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return {
			x: point.x * cos - point.y * sin,
			y: point.x * sin + point.y * cos
		};
	}
}

export const svgPath = new SVGPath();
