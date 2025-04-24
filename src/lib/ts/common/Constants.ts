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

	radius = {
		arcSlider_cap: 7.5,
		ring_center: 60,
		rounded_t: 30, };

	id_base = {
		test: 'handcrafted',
		local: 'data', };

	help_url = {
		local: 'http://localhost:8000/README.html',
		remote: 'https://help.webseriously.org', };

	zoom_ratio = {
		out: 0.9,
		in: 1.1, };

	threshold = {
		double_click: 700,
		long_click: 800, };

	title = {
		separator: '------------------------',
		default: 'Please, enter a title', };

	separator = {
		generic: '::',
		small: ':::',
		big: '::::', };

	height = {
		segmented: 21,
		small: 16,
		row: 20, };

	thickness = {
		ring_rotation: 44,
		paging_arc: 15,
		separator: 5,
		fork: 2.5,
		thin: 2, };

	size = {
		smallest_font: 9,
		smaller_font: 11,
		small_font: 13,
		button: 16,
		font: 14,
		dot: 13, };
}

export const k = new Constants();
