import { Point, FatTrianglePath } from "../common/GlobalImports";;

export enum SVGType {
	triangle = 'triangle',
	circle = 'circle',
	oval = 'oval',
    line = 'line',
}

export default class SVGFactory {

    line(width: number) {
        return 'M0 1 L' + width + ' 1';
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
        const centerOffset = width / 2;
        const doubleRadius = radius * 2;
        const path = 'M' + centerOffset + ' ' + centerOffset + ' m-' + radius + ' 0a' + radius + ' ' + radius + ' 0 1,0 ' + doubleRadius + ' 0a' + radius + ' ' + radius + ' 0 1,0 -' + doubleRadius + ' 0';
        return path;
    }
}

export const svgFactory = new SVGFactory();
