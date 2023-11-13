import { FatTrianglePath } from "./FatTrianglePath";;

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
        const minor = radius - (horizontal ? 3 : 1);
        const doubleWidth = width * 2;
        const path = 'M' + radius + ' ' + radius + ' m-' + width + ' 0a' + width + ' ' + minor + ' 0 1,0 ' + doubleWidth + ' 0a' + width + ' ' + minor + ' 0 1,0 -' + doubleWidth + ' 0';
        return path;
    }
}

export const svgFactory = new SVGFactory();
