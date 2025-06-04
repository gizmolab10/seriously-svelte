import { u } from '../common/Global_Imports';

export default class G_Repeater {
	proportionate: boolean;
	title_widths: number[];
	font_size: number;
	columns: number;
    titles: string[];
	margin: number;
    height: number;
    width: number;
	padding = 8;
	gap = 0;

	//////////////////////////////////////////////////////////////
	//															//
	//	titles:			strings to display						//
	//	proportionate:	space titles according to their widths	//
	//	font_size:		needed to compute each title's width	//
	//	gap:			between titles							//
	//	padding:		around titles							//
	//	margin:			around the whole thing					//
	//															//
	//////////////////////////////////////////////////////////////

	constructor(titles: string[], height: number, width: number, margin: number, gap: number, padding: number, proportionate: boolean, font_size: number) {
		this.proportionate = proportionate;
		this.columns = titles.length;
		this.font_size = font_size;
		this.padding = padding;
		this.titles = titles;
		this.height = height;
		this.margin = margin;
		this.width = width;
		this.gap = gap;
		this.title_widths = this.titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
	}

	button_width_for(column: number): number { 
		if (this.proportionate) {
			return this.button_fluff + this.title_widths[column]; 
		}
		if (column === 0) {			// first button: add up all the title widths and adjust
			const other_buttons_width = this.title_widths.slice(1).reduce((acc, width) => acc + width + this.padding * 2, 0);
			return this.width - other_buttons_width - this.margin * 2 - this.gap - this.padding;
		}
		return this.title_widths[column] + this.padding * 2;
	}

	 get button_fluff(): number {
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
			return this.title_widths.slice(0, column).reduce((sum, title_width) => sum + this.gap + title_width + this.button_fluff, this.gap / 2);
		}
		let x = 0;
		for (let i = 0; i < column; i++) {
			x += this.button_width_for(i) + this.gap;
		}
		return x;
	}
	
}