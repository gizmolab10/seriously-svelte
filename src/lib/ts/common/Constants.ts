export default class Constants {
	dot_size: number;
	width_max: number;
	row_height: number;
	hid_unknown: number;
	necklace_gap: number;
	line_stretch: number;
	height_banner: number;
	width_details: number;
	halfIncrement: number;
	thing_fontSize: number;
	cluster_offsetY: number;
	height_titleAtTop: number;
	graphTools_diameter: number;
	threshold_longClick: number;
	cluster_inside_radius: number;
	threshold_doubleClick: number;
	color_highlighted: string;
	color_background: string;
    color_disabled: string;
	name_bulkAdmin: string;
    color_default: string;
	pathSeparator: string;
	title_default: string;
	id_unknown: string;
	title_line: string;
	exemplar: string;
	newLine: string;
	comma: string;
	space: string;
	empty: string;
	titleIsAtTop: boolean;
	showControls: boolean;
	allow_GraphEditing: boolean;
	allow_TitleEditing: boolean;
	allow_HorizontalScrolling: boolean;
	queryString: URLSearchParams;

	queryStrings_apply() {
        const deny = this.queryString.get('deny');
        if (deny) {
            const flags = deny.split(',');
            for (const option of flags) {
                switch (option) {
                    case 'editGraph': this.allow_GraphEditing = false; break;
                    case 'editTitles': this.allow_TitleEditing = false; break;
                    case 'horizontalScrolling': this.allow_HorizontalScrolling = false; break;
                }
            }
        }
	}

	constructor() {
		this.empty = '';
		this.space = ' ';
		this.comma = ',';
		this.newLine = '\n';
		this.pathSeparator = '::';
		this.exemplar = 'exemplar';
		this.id_unknown = 'unknown';
		this.color_default = 'blue';
		this.color_background = 'white';
		this.color_disabled = 'lightGray';
		this.color_highlighted = '#9e7daa';
		this.name_bulkAdmin = 'Jonathan Sand';
		this.title_default = 'Please, enter a title';
		this.title_line = '------------------------';
		this.queryString = new URLSearchParams(window.location.search);
		this.hid_unknown = 1000000000000;
		this.threshold_doubleClick = 100;
		this.cluster_inside_radius = 45;
		this.threshold_longClick = 500;
		this.graphTools_diameter = 64;
		this.height_titleAtTop = 50;
		this.thing_fontSize = 14;
		this.halfIncrement = 0.5;
		this.width_details = 80;
		this.height_banner = 35;
		this.necklace_gap = 120;
		this.line_stretch = 25;
		this.row_height = 20;
		this.width_max = 200;
		this.dot_size = 13;
		this.showControls = false;
		this.titleIsAtTop = false;
		this.allow_GraphEditing = true;
		this.allow_TitleEditing = true;
		this.allow_HorizontalScrolling = true;
		this.cluster_offsetY = 4 - this.dot_size;
	}

}

export let k = new Constants();
