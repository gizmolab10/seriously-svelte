export default class Constants {
	dot_size: number;
	width_max: number;
	row_height: number;
	line_stretch: number;
	height_banner: number;
	width_details: number;
	halfIncrement: number;
	circle_offsetY: number;
	thing_fontSize: number;
	height_titleAtTop: number;
	circle_focus_radius: number;
	threshold_longClick: number;
	threshold_doubleClick: number;
	circle_necklace_radius: number;
	circle_angle_increment: number;
	color_highlighted: string;
	color_background: string;
    color_disabled: string;
	name_bulkAdmin: string;
	pathSeparator: string;
	title_default: string;
	title_line: string;
	id_unknown: string;
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

	constructor() {
		this.empty = '';
		this.space = ' ';
		this.comma = ',';
		this.newLine = '\n';
		this.pathSeparator = '::';
		this.id_unknown = 'unknown';
		this.color_background = 'white';
		this.color_disabled = 'lightGray';
		this.color_highlighted = '#9e7daa';
		this.name_bulkAdmin = 'Jonathan Sand';
		this.title_default = 'Please, enter a title';
		this.title_line = '------------------------';
		this.queryString = new URLSearchParams(window.location.search);
		this.allow_HorizontalScrolling = true;
		this.allow_GraphEditing = true;
		this.allow_TitleEditing = true;
		this.titleIsAtTop = false;
		this.showControls = false;
		this.circle_necklace_radius = 160;
		this.circle_angle_increment = 0.2;
		this.threshold_doubleClick = 100;
		this.threshold_longClick = 500;
		this.circle_focus_radius = 90;
		this.height_titleAtTop = 50;
		this.halfIncrement = 0.5;
		this.thing_fontSize = 14;
		this.width_details = 80;
		this.height_banner = 35;
		this.line_stretch = 25;
		this.row_height = 20;
		this.width_max = 200;
		this.dot_size = 13;

		this.circle_offsetY = 5 - this.dot_size;
	}

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
}

export let k = new Constants();
