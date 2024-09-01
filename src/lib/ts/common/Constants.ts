import { builds } from './Builds';

export default class Constants {
	dot_size = 13;
	debug_size = 20;
	width_max = 200;
	line_stretch = 22;
	height_banner = 35;
	ring_thickness = 30;
	halfIncrement = 0.5;
	thing_fontSize = 14;
	width_details = 200;
	height_titleAtTop = 50;
	default_buttonSize = 16;
	height_breadcrumbs = 33;
	threshold_longClick = 800;
	ring_smallest_radius = 90;
	editingTools_diameter = 64;
	threshold_doubleClick = 700;
	hid_unknown = 1000000000000;
	local_help_url = 'http://localhost:8000/README.html';
	remote_help_url = 'https://help-webseriously.netlify.app/README.html';
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none;';
	title_default = 'Please, enter a title';
	title_line = '------------------------';
	name_bulkAdmin = 'Jonathan Sand';
	color_highlighted = '#9e7daa';
    color_disabled = 'lightGray';
	baseID_local = 'handcrafted';
	color_background = 'white';
	cursor_default = 'default';
	generic_separator = '::';
	small_separator = ':::';
	big_separator = '::::';
    color_default = 'blue';
	unknown = 'unknown';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';

	paging_arc_thickness: number;
	ring_widget_padding: number;
	cluster_offsetY: number;
	build_number: string;
	row_height: number;

	rotateSVG = `
		<svg width="48px" height="48px" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="20" stroke="black" stroke-width="2" fill="none" />
			<path d="M 4,24 a 20,20 0 0,1 40,0" fill="none" stroke="black" stroke-width="2"/>
			<polygon points="44,24 38,18 38,30" fill="black"/>
		</svg>`;

	constructor() {
		this.build_number = builds.latest;
		this.row_height = this.dot_size + 7;
		this.cluster_offsetY = 4 - this.dot_size;
		this.paging_arc_thickness = this.ring_thickness / 3;
		this.ring_widget_padding = (this.ring_thickness - 1) / 2;
	}

}

export const k = new Constants();
