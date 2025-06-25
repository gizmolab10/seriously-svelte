import { tu } from './Testworthy_Utilities';
import { builds } from './Builds';

const dot_size = 14;
const row_height = 20;
const glows_banner_height = tu.device_isMobile ? 32 : 20;

export default class Constants {
	details_margin = 0;
	halfIncrement = 0.5;
	width_details = 220;
	radial_widget_inset = 28;
	autorepeat_interval = 50;
	separator_title_left = 0;
	hid_unknown = 1000000000000;
	diameterOf_outer_tinyDots = 19;
	build_number = builds.build_number;
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
		local: 'data',
	};

	help_url = {
		local:  'http://localhost:8000/README.html',
		remote: 'https://help.webseriously.org',
	};

	threshold = {
		double_click: 700,
		long_click:	  800,
	};

	title = {
		default: 'Please, enter a title',
		line:	 '------------------------',
	};

	ratio = {
		zoom_out: 0.9,
		zoom_in:  1.1
	};

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::',
	};

	font_size = {
		ultra_small: dot_size - 5,
		smallest:	 dot_size - 4,
		smaller:	 dot_size - 1.7,
		small:		 dot_size - 1,
		common:		 dot_size,
	}; 

	opacity = {
		none:	0,
		least:  0.1,
		thumb:	0.13,
		hover:	0.2,
		active:	0.3
	};

	radius = {
		text_area_border:  7,
		arcSlider_cap: 	   7.5,
		ring_center:   	  55,
		gull_wings: { 
			thick:	   	  14,
			thin:		   8,
			ultra_thin:	   5,
		},
	};

	thickness = {
		rotation_ring: 44,
		paging_arc:	   15,
		fork:		    2.5,
		separator: {
			thick:		4,
			thin:		2,
			ultra_thin:	2,
		},
	};

	height = {
		separator: 7,
		line:	   row_height + 2,
		segmented: row_height + 1,
		row:	   row_height,
		controls:  16,
		button:	   dot_size + 3,
		dot:	   dot_size,
		banner: {
			controls: glows_banner_height,
			details:  glows_banner_height,
			graph:	  0,
			crumbs:	  glows_banner_height,
		},
	};

}

export const k = new Constants();
