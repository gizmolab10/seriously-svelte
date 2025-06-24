import { u } from '../common/Global_Imports';

export default class G_Repeater {
	proportionate: boolean;
	title_widths: number[];
	title_gap: number = 8;
	widths: number[] = [];
	lefts: number[] = [];
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
	//	margin:			on right and left						//
	//	title_gap:		after first title						//
	//															//
	//////////////////////////////////////////////////////////////

	constructor(titles: string[], height: number, width: number, margin: number, gap: number, padding: number, title_gap: number, proportionate: boolean, font_size: number) {
		this.proportionate = proportionate;
		this.columns = titles.length;
		this.font_size = font_size;
		this.title_gap = title_gap;
		this.padding = padding;
		this.titles = titles;
		this.height = height;
		this.margin = margin;
		this.width = width;
		this.gap = gap;
		this.title_widths = this.titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
		this.widths = this.title_widths.map((w, i) => this.gap + this.button_width_for(i));
	}

	button_width_for(column: number): number { 
		const total_width = this.title_widths.reduce((acc, width) => acc + width, 0);	// sum of title widths
		if (this.proportionate) {
			const margin_and_gaps = this.margin * 2 + this.title_gap + this.gap * (this.columns - 1);
			const approportionment = (this.width - total_width - margin_and_gaps) / this.columns;
			return this.title_widths[column] + approportionment; 
		}
		if (column === 0) {			// first button: add up all the other title widths and adjust
			const other_buttons_width = this.title_widths.slice(1).reduce((acc, width) => acc + width + this.padding * 2, 0);
			return this.width - other_buttons_width - this.margin * 2 - this.gap - this.padding;
		}
		return this.title_widths[column] + this.padding * 2;
	}

	button_left_for(column: number): number {
		if (this.proportionate) {
			return this.widths.slice(0, column).reduce((sum, width) => sum + width, this.title_gap + this.gap / 2);
		}
		let x = 0;
		for (let i = 0; i < column; i++) {
			x += this.button_width_for(i) + this.gap;
		}
		return x;
	}
	
}