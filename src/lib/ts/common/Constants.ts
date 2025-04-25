import { builds } from './Builds';

export default class Constants {
	dot_size = 13;
	line_stretch = 22;
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

	zoom_ratio = {
		out: 0.9,
		in:	 1.1, };

	threshold = {
		double_click: 700,
		long_click:	  800, };

	title = {
		separator: '------------------------',
		default: 'Please, enter a title', };

	radius = {
		arcSlider_cap: 7.5,
		ring_center:  60,
		gull_wings:	  11, };

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::', };

	thickness = {
		ring_rotation: 44,
		paging_arc:	   15,
		separator:		5,
		fork:			2.5,
		thin:			2, };

	size = {
		smallest_font: 9,
		smaller_font: 11,
		small_font:	  13,
		button:		  16,
		font:		  14,
		dot:		  13, };

	info = {
		segments:	  21,
		before_title:  4,
		title:		  17,
		after_title:   4,
		table:		 139,
		color:		   2,
		traits:		   2,
		consequence:  50,
		quest:		  50,
	};

	height = {
		segmented: 21,
		small:	   16,
		row:	   20,
		banners: {
			controls: 15,
			crumbs:	  20,
			main:	  20,
		},
		details: {
			storage: 118,
			tools:	  40,
			display:  76,
			info:	   0,
		},
	 };
}

export const k = new Constants();
