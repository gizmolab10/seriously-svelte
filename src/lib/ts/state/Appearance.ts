import { k } from '../common/Constants';

export default class Appearance {
	background_color = 'transparent';
	color = k.color_defaultText;
	cursor = k.cursor_default;

	constructor(color: string, background_color: string, cursor: string) {
		this.background_color = background_color;
		this.cursor = cursor;
		this.color = color;
	}

	static out_withColor(isOut: boolean, color: string, cursor: string) {
		return new Appearance(
			isOut ? color : k.color_background,
			isOut ? k.color_background : color,
			isOut ? k.cursor_default : cursor
		) }

}
