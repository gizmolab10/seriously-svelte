import { builds } from './Builds';

const dot_size = 13;
const row_height = 20;
const banner_height = 18;
const separator_thickness = 4;

export default class Constants {
	halfIncrement = 0.5;
	width_details = 200;
	radial_widget_inset = 26;
	editingTools_diameter = 64;
	hid_unknown = 1000000000000;
	build_number = builds.latest;
	diameterOf_outer_tinyDots = 19;
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none';
	name_bulkAdmin = 'Jonathan Sand';
	cursor_default = 'default';
	unknown = 'unknown';
	root_path = 'root';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';

	id_base = {
		test:  'handcrafted',
		local: 'data', };

	help_url = {
		local:  'http://localhost:8000/README.html',
		remote: 'https://help.webseriously.org', };

	threshold = {
		double_click: 700,
		long_click:	  800, };

	title = {
		separator: '------------------------',
		default: 'Please, enter a title', };

	ratio = {
		zoom_out: 0.9,
		zoom_in:  1.1 };

	radius = {
		arcSlider_cap: 7.5,
		ring_center:   50,
		gull_wings:	   separator_thickness * 3, };

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::', };

	opacity = {
		none:	  0,
		standard: 0.1,
		thumb:	  0.2,
		hover:	  0.4,
		active:	  0.6 };

	thickness = {
		ring_rotation: 44,
		paging_arc:	   15,
		separator: 	   separator_thickness,
		fork:		   2.5,
		thin:		   2, };

	size = {
		smallest_font: dot_size - 4,
		smaller_font:  dot_size - 2,
		small_font:	   dot_size,
		button:		   dot_size + 3,
		line:		   row_height + 2,
		font:		   dot_size + 1,
		dot:		   dot_size, };

	height = {
		segmented: row_height + 1,
		small:	   dot_size + 3,
		row:	   row_height,
		banner: {
			controls: banner_height,
			crumbs:	  banner_height,
			graph:	   0,
		},
		detail: {
			storage: 122,
			tools:	  40,
			display:  76,
			info:	   0,
		},
		info: {
			segments:	  21,
			before_title:  4,
			title:		  17,
			after_title:   4,
			table:		 139,
			color:		   2,
			traits:		   2,
			consequence:  50,
			quest:		  50,
		},
	 };

}

export const k = new Constants();
