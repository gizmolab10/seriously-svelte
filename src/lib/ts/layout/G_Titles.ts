import { u } from '../common/Global_Imports';

export default class G_Titles {
	proportionate: boolean;
	button_portion: number;
	title_widths: number[];
	font_size: number;
	columns: number;
    titles: string[];
	margin: number;
    height: number;
    width: number;
	padding = 6;
	gap = 0;

	constructor(titles: string[], height: number, width: number, margin: number, gap: number, proportionate: boolean, font_size: number) {
		this.proportionate = proportionate;
		this.columns = titles.length;
		this.font_size = font_size;
		this.titles = titles;
		this.height = height;
		this.margin = margin;
		this.width = width;
		this.gap = gap;
		this.title_widths = this.titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
		this.button_portion = this.compute_button_portion();
	}

	button_width_for(column: number): number { 
		if (this.proportionate) {
			return this.button_portion + this.title_widths[column]; 
		}
		if (column === 0) {
			// First button: fill remaining space (no extra padding)
			const other_buttons_width = this.title_widths.slice(1).reduce((acc, width) => acc + width + this.padding * 2, 0);
			return this.width - this.margin * 2 - other_buttons_width - this.gap - this.padding;
		}
		return this.title_widths[column] + this.padding * 2;
	}

	compute_button_portion() {
		if (this.proportionate) {
			const total_width = this.title_widths.reduce((acc, width) => acc + width, 0);
			return (this.width - this.margin * 2 - total_width - this.gap * (this.columns - 1)) / this.columns;
		} else {
			const other_buttons_width = this.title_widths.slice(1).reduce((acc, width) => acc + width + this.padding, 0);
			const first_button_width = this.width - this.margin * 2 - other_buttons_width - this.gap * (this.columns - 1);
			return first_button_width;
		}
	}

	button_left_for(column: number): number {
		if (this.proportionate) {
			return this.title_widths.slice(0, column).reduce((sum, title_width) => sum + this.gap + title_width + this.button_portion, this.gap / 2);
		}
		let x = 0;
		for (let i = 0; i < column; i++) {
			x += this.button_width_for(i) + this.gap;
		}
		return x;
	}
	
}