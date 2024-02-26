import { u } from '../../ts/common/GlobalImports';

export default class Constants {
	public dot_size: number;
	public row_height: number;
	public line_stretch: number;
	public bannerHeight: number;
	public detailsWidth: number;
	public halfIncrement: number;
	public thing_fontSize: number;
	public titleHeightAtTop: number;
	public toolsClusterHeight: number;
	public longClickThreshold: number;
	public doubleClickThreshold: number;
	public allowHorizontalScrolling: boolean;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public isMobileDevice: boolean;
	public backgroundColor: string;
	public highlightColor: string;
	public adminBulkName: string;
	public pathSeparator: string;
	public defaultTitle: string;
	public lineTitle: string;
	public unknownID: string;

	constructor() {
		this.pathSeparator = '::';
		this.unknownID = 'unknown';
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.adminBulkName = 'Jonathan Sand';
		this.defaultTitle = 'Please, enter a title';
		this.lineTitle = '------------------------';
		this.isMobileDevice = u.isMobileDevice();
		this.allowHorizontalScrolling = true;
		this.allowGraphEditing = true;
		this.allowTitleEditing = true;
		this.doubleClickThreshold = 100;
		this.longClickThreshold = 500;
		this.toolsClusterHeight = 80;
		this.titleHeightAtTop = 50;
		this.halfIncrement = 0.5;
		this.thing_fontSize = 14;
		this.detailsWidth = 80;
		this.bannerHeight = 35;
		this.line_stretch = 25;
		this.row_height = 20;
		this.dot_size = 13;
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
        const deny = queryStrings.get('deny');
        if (deny) {
            const flags = deny.split(',');
            for (const option of flags) {
                switch (option) {
                    case 'editGraph': this.allowGraphEditing = false; break;
                    case 'editTitles': this.allowTitleEditing = false; break;
                    case 'horizontalScrolling': this.allowHorizontalScrolling = false; break;
                }
            }
        }
	}
}

export let k = new Constants();
