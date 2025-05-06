import { show } from '../managers/Visibility';
import { builds } from './Builds';

const dot_size = 13;
const row_height = 20;
const banner_height = 18;
const separator_thickness = 4;

export default class Constants {
	details_margin = 0;
	halfIncrement = 0.5;
	width_details = 200;
	radial_widget_inset = 26;
	separator_title_left = 20;
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

	size = {
		button:	dot_size + 3,
		line:	row_height + 2,
		dot:	dot_size, };

	radius = {
		arcSlider_cap: 7.5,
		ring_center:   55,
		gull_wings:	   separator_thickness * 3, };

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::', };

	font_size = {
		smallest: dot_size - 3,
		smaller:  dot_size - 0.7,
		small:	  dot_size,
		common:	  dot_size + 1, };

	opacity = {
		none:	0,
		least:  0.1,
		thumb:	0.13,
		hover:	0.2,
		active:	0.3 };

	thickness = {
		ring_rotation: 44,
		paging_arc:	   15,
		separator: 	   separator_thickness,
		fork:		   2.5,
		thin:		   1, };

	height = {
		separator: 7,
		segmented: row_height + 1,
		small:	   dot_size + 3,
		row:	   row_height,
		banner: {
			controls: banner_height,
			crumbs:	  banner_height,
			graph:	  0,
		},
		detail: {
			storage: 125,
			tools:	 show.tool_boxes ? 229 : 120,
			display:  77,
			info:	   0,
		},
		info: {
			segments:	  22,
			before_title:  5,
			title:		  22,
			after_title:   4,
			table:		 132,
			color:		  20,
			traits:		   2,
			consequence:  50,
			quest:		  50,
		},
	 };

}

export const k = new Constants();
