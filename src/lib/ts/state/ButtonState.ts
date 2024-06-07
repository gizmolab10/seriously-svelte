import { k } from '../common/Constants';

// data about buttons that has to persist 
// while the button itself is replaced
// this allows them to change the context
// around them without losing their appearance

export default class ButtonState {
	background_color = 'transparent';
	color = k.color_defaultText;
	cursor = k.cursor_default;

	constructor(color: string, background_color: string, cursor: string) {
		this.background_color = background_color;
		this.cursor = cursor;
		this.color = color;
	}

	update(isOut: boolean, color: string, cursor: string) {
		this.background_color = isOut ? k.color_background : color;
		this.color = isOut ? color : k.color_background;
		this.cursor = isOut ? k.cursor_default : cursor;
	}

}
