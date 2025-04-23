import { builds } from './Builds';
import E_Array from './E_Array';

export default class Constants {
	dot_size = 13;
	line_stretch = 22;
	halfIncrement = 0.5;
	width_details = 200;
	editingTools_diameter = 64;
	hid_unknown = 1000000000000;
	diameterOf_outer_tinyDots = 19;
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none';
	title_default = 'Please, enter a title';
	title_line = '------------------------';
	name_bulkAdmin = 'Jonathan Sand';
	cursor_default = 'default';
	unknown = 'unknown';
	root_path = 'root';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';

	build_number: string;
	size: E_Array<number>;
	height: E_Array<number>;
	radial: E_Array<number>;
	id_base: E_Array<string>;
	help_url: E_Array<string>;
	separator: E_Array<string>;
	thickness: E_Array<number>;
	threshold: E_Array<number>;
	zoom_ratio: E_Array<number>;

	constructor() {
		this.build_number = builds.latest;
		this.help_url = E_Array.create({
			local: 'http://localhost:8000/README.html',
			remote: 'https://help.webseriously.org', });
		this.id_base = E_Array.create({
			test: 'handcrafted',
			local: 'data', });
		this.zoom_ratio = E_Array.create({
			out: 0.9,
			in: 1.1, });
		this.threshold = E_Array.create({
			double_click: 700,
			long_click: 800, });
		this.radial = E_Array.create({
			widget_inset: 26,
			innermost: 60, });
		this.separator = E_Array.create({
			generic: '::',
			small: ':::',
			big: '::::', });
		this.height = E_Array.create({
			segmented: 21,
			small: 16,
			row: 20, });
		this.size = E_Array.create({
			smallest_font: 9,
			smaller_font: 11,
			small_font: 13,
			button: 16,
			font: 14,
			dot: 13, });
		this.thickness = E_Array.create({
			ring_rotation: 44,
			paging_arc: 15,
			separator: 5,
			fork: 2.5,
			thin: 2, });
	}

}

export const k = new Constants();
