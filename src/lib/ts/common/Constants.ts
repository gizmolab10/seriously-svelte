export default class Constants {
	dot_size = 13;
	width_max = 200;
	necklace_gap = 12;
	line_stretch = 25;
	height_banner = 35;
	halfIncrement = 0.5;
	thing_fontSize = 14;
	width_details = 200;
	height_titleAtTop = 50;
	threshold_longClick = 500;
	cluster_inside_radius = 30;
	editingTools_diameter = 64;
	threshold_doubleClick = 100;
	hid_unknown = 1000000000000;
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none;';
	title_default = 'Please, enter a title';
	title_line = '------------------------';
	name_bulkAdmin = 'Jonathan Sand';
	color_highlighted = '#9e7daa';
    color_disabled = 'lightGray';
	baseID_local = 'handcrafted';
	color_background = 'white';
	genericSeparator = '::';
    color_default = 'blue';
	id_unknown = 'unknown';
	exemplar = 'exemplar';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';
	show_controls = false;
	show_titleAtTop = false;
	show_arrowheads = false;
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;
	queryString: URLSearchParams;
	cluster_offsetY: number;
	row_height: number;

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
		this.row_height = this.dot_size + 7;
		this.cluster_offsetY = 4 - this.dot_size;
		this.queryString = new URLSearchParams(window.location.search);
	}

}

export let k = new Constants();
