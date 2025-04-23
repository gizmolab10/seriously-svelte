import { builds } from './Builds';
import E_Array from './E_Array';

export default class Constants {
	dot_size = 13;
	line_stretch = 22;
	halfIncrement = 0.5;
	width_details = 200;
	radial_widget_inset = 26;
	innermost_ring_radius = 60;
	editingTools_diameter = 64;
	hid_unknown = 1000000000000;
	diameterOf_outer_tinyDots = 19;
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none';
	local_help_url = 'http://localhost:8000/README.html';
	remote_help_url = 'https://help.webseriously.org';
	title_default = 'Please, enter a title';
	title_line = '------------------------';
	name_bulkAdmin = 'Jonathan Sand';
	idBase_test = 'handcrafted';
	cursor_default = 'default';
	generic_separator = '::';
	small_separator = ':::';
	big_separator = '::::';
	idBase_file = 'data';
	unknown = 'unknown';
	root_path = 'root';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';

	build_number: string;
	zoom_ratio: E_Array;
	threshold: E_Array;
	thickness: E_Array;
	height: E_Array;
	size: E_Array;

	constructor() {
		this.build_number = builds.latest;
		this.zoom_ratio = E_Array.create({
			out: 0.9,
			in: 1.1, });
		this.threshold = E_Array.create({
			double_click: 700,
			long_click: 800, });
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
