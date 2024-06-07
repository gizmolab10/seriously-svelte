import { k, ElementType } from '../common/GlobalImports';
import Identifiable from "../data/Identifiable";

// data about html elements that has to persist 
// while the element itself is replaced
// this allows them to cause the context
// around them to be rebuilt
// without losing their appearance

export default class ElementState {
	fill = 'transparent';
	identifiable!: Identifiable;
	color = k.color_defaultText;
	cursor = k.cursor_default;
	type!: ElementType;

	constructor(color: string, fill: string, cursor: string) {
		this.fill = fill;
		this.cursor = cursor;
		this.color = color;
	}

	update(isOut: boolean, color: string, cursor: string) {
		this.fill = isOut ? k.color_background : color;
		this.color = isOut ? color : k.color_background;
		this.cursor = isOut ? k.cursor_default : cursor;
	}

	cursor_forType(type: ElementType) {

	}

	color_forType(type: ElementType) {

	}

	fill_forType(type: ElementType) {

	}

}
