import { u } from '../../ts/common/Global_Imports';

export default class G_Repeater {
	button_portion: number;
	title_widths: number[];
	font_size: number;
    titles: string[];
    height: number;
    width: number;

	constructor(titles: string[], height: number, width: number, font_size: number) {
		this.font_size = font_size;
		this.titles = titles;
		this.height = height;
		this.width = width;
		this.title_widths = this.titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
		this.button_portion = this.compute_button_portion();
	}

	compute_button_portion() {
		const total_width = this.title_widths.reduce((acc, width) => acc + width, 0);
		const columns = this.titles.length;
		const button_portion = (this.width - total_width) / columns;
		return button_portion;
	}
	
}