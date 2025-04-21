import { builds } from './Builds';

export default class Constants {
	dot_size = 13;
	font_size = 14;
	width_max = 200;
	line_stretch = 22;
	tiny_font_size = 9;
	halfIncrement = 0.5;
	width_details = 200;
	zoom_in_ratio = 1.1;
	fork_thicknes = 2.5;
	small_font_size = 11;
	default_buttonSize = 16;
	separator_thickness = 5;
	threshold_longClick = 800;
	innermost_ring_radius = 60;
	editingTools_diameter = 64;
	threshold_doubleClick = 700;
	hid_unknown = 1000000000000;
	ring_resizing_thickness = 30;
	ring_rotation_thickness = 44;
	thin_separator_thickness = 2;
	diameterOf_outer_tinyDots = this.dot_size * 1.4;
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

	paging_arc_thickness: number;
	radial_widget_inset: number;		// so widgets are centered in necklace
	zoom_out_ratio: number;
	build_number: string;
	row_height: number;

	constructor() {
		this.build_number = builds.latest;
		this.row_height = this.dot_size + 7;
		this.zoom_out_ratio = 1 / this.zoom_in_ratio;
		this.paging_arc_thickness = this.ring_rotation_thickness / 3;
		this.radial_widget_inset = (this.ring_rotation_thickness - 1) * 0.6;
	}

}

export const k = new Constants();
