import { k } from '../common/GlobalImports';

export default class Appearance {
	background_color = 'transparent';
	color = k.color_defaultText;
	cursor = k.cursor_default;

	constructor(color: string, background_color: string, cursor: string) {
		this.background_color = background_color;
		this.cursor = cursor;
		this.color = color;
	}

}
