import { tu } from '../utilities/Testworthy_Utilities';
import { Size, Point } from '../types/Geometry';
import { T_Direction } from './Enumerations';
import { builds } from './Builds';

const dot_size = 14;
const row_height = 16;
const rubberband_thickness = 1;
const tiny_outer_dots_expansion = 6;
const tiny_outer_dots_diameter = dot_size + tiny_outer_dots_expansion;

export default class Constants {

	constructor() {
		const {printer_page_width, printer_dpi} = tu.printer_configuration;
		this.printer_page_width = printer_page_width;
		this.printer_dpi = printer_dpi;
	}

	printer_dpi = 96;
	details_margin = 0;
	halfIncrement = 0.5;
	separator_title_left = 0;
	printer_page_width = 722;
	hid_unknown = 1000000000000;
	build_number = builds.build_number;
	radial_widget_inset = dot_size + 14;
	printer_aspect_ratio = 11.69 / 8.27;
	next_previous_titles: string[] = [T_Direction.previous, T_Direction.next];
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none';
	nothing_to_show = 'Please select something to show here';
	name_bulkAdmin = 'Jonathan Sand';
	cursor_default = 'default';
	corrupted = 'corrupted';
	unknown = 'unknown';
	root_path = 'root';
	empty_id = '""';
	newLine = '\n';
	wildcard = '*';
	comma = ',';
	quote = '"';
	space = ' ';
	empty = '';
	tab = '\t';

	dasharray = {
		relateds: '4,3',
		editing:  '3,2',
	};

	width = {
		details:  219,
		child_gap: 12,
	};

	help_url = {
		local:  'http://localhost:8000/README.html',
		remote: 'https://help.webseriously.org',
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

	threshold = {
		double_click: 400,
		long_click:	  800,
		alteration:	  500,
		autorepeat:	  150,
	};

	opacity = {
		none:	0,
		least:  0.13,
		thumb:	0.25,
		hover:	0.35,
		active:	0.4
	};

	id_base = {
		airtable: 'Airtable',
		unknown:  'Unknown',
		firebase: 'Public',
		bubble:	  'Bubble',
		bulks:	  'Bulks',
		local:	  'Local',
		test:	  'Test',
	};

	radius = {
		text_area_border:  7,
		arcSlider_cap: 	   7.5,
		ring_minimum:  	  55,
		gull_wings: { 
			thick:	   	  14,
			thin:		   8,
			ultra_thin:	   5,
		},
	};

	height = {
		separator: 7,
		empty:	   22,
		line:	   row_height + 2,
		segmented: row_height + 1,
		row:	   row_height,
		controls:  16,
		button:	   dot_size + 3,
		dot:	   dot_size,
	};

	font_size = {
		instructions: dot_size - 4,
		separator:	  dot_size - 4,
		details:	  dot_size - 3,
		banners:	  dot_size - 2,
		arc_slider:	  dot_size - 1.7,
		info:		  dot_size - 1,
		common:		  dot_size,
		segmented:	  dot_size + 1,
		tree_prefs:	  36,
	};

	thickness = {
		rotation_ring: 44,
		paging_arc:	   15,
		extra:		   12 + rubberband_thickness,
		rubberband:	  	rubberband_thickness,
		fork:		    2.5,
		separator: {
			main:		5,
			banners:	2.5,
			details:	0.75,
		},
	};
	
	tiny_outer_dots = {
		diameter: tiny_outer_dots_diameter,
		expansion: tiny_outer_dots_expansion,
		size: Size.square(tiny_outer_dots_diameter).extendedByY(3),
		offset: Point.square(-tiny_outer_dots_expansion).offsetByXY(4, 3.5),
		viewBox: `0.5 2.35 ${tiny_outer_dots_diameter} ${tiny_outer_dots_diameter}`,	
	};
}

export const k = new Constants();
