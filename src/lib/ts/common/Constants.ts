export default class Constants {
	dot_size = 13;
	width_max = 200;
	row_height = 20;
	line_stretch = 25;
	necklace_gap = 130;
	height_banner = 35;
	width_details = 80;
	halfIncrement = 0.5;
	thing_fontSize = 14;
	height_titleAtTop = 50;
	threshold_longClick = 500;
	cluster_inside_radius = 35;
	editingTools_diameter = 64;
	threshold_doubleClick = 100;
	hid_unknown = 1000000000000;
	title_default = 'Please, enter a title';
	title_line = '------------------------';
	name_bulkAdmin = 'Jonathan Sand';
	color_highlighted = '#9e7daa';
    color_disabled = 'lightGray';
	baseID_local = 'handcrafted';
	color_background = 'white';
    color_default = 'blue';
	id_unknown = 'unknown';
	exemplar = 'exemplar';
	pathSeparator = '::';
	newLine = '\n';
	comma = ',';
	space = ' ';
	empty = '';
	titleIsAtTop = false;
	showControls = false;
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;
	queryString: URLSearchParams;
	cluster_offsetY: number;

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
		this.cluster_offsetY = 4 - this.dot_size;
		this.queryString = new URLSearchParams(window.location.search);
	}

}

export let k = new Constants();
