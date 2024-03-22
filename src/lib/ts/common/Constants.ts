export default class Constants {
	public queryString: URLSearchParams;
	public dot_size: number;
	public width_max: number;
	public row_height: number;
	public line_stretch: number;
	public height_banner: number;
	public width_details: number;
	public halfIncrement: number;
	public thing_fontSize: number;
	public height_titleAtTop: number;
	public threshold_longClick: number;
	public threshold_doubleClick: number;
	public allow_HorizontalScrolling: boolean;
	public allow_GraphEditing: boolean;
	public allow_TitleEditing: boolean;
	public titleIsAtTop = false;
	public showControls = false;
	public color_highlighted: string;
	public color_background: string;
    public color_disabled: string;
	public name_bulkAdmin: string;
	public pathSeparator: string;
	public title_default: string;
	public title_line: string;
	public id_unknown: string;
	public newLine: string;
	public comma: string;
	public space: string;
	public empty: string;

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
		this.threshold_doubleClick = 100;
		this.threshold_longClick = 500;
		this.height_titleAtTop = 50;
		this.halfIncrement = 0.5;
		this.thing_fontSize = 14;
		this.width_details = 80;
		this.height_banner = 35;
		this.line_stretch = 25;
		this.row_height = 20;
		this.width_max = 200;
		this.dot_size = 13;
	}

	applyQueryStrings() {
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
