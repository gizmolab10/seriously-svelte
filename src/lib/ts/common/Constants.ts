import { u, Path, dbDispatch } from '../../ts/common/GlobalImports'

export default class Constants {
	public halfIncrement: number;
	public detailsMargin: number;
	public bandHeightAtTop: number;
	public titleHeightAtTop: number;
	public toolsClusterHeight: number;
	public longClickThreshold: number;
	public doubleClickThreshold: number;
	public allowHorizontalScrolling: boolean;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public leftJustifyGraph: boolean;
	public backgroundColor: string;
	public highlightColor: string;
	public adminBulkName: string;
	public pathSeparator: string;
	public defaultTitle: string;
	public lineTitle: string;
	public rootPath: Path;

	constructor() {
		this.pathSeparator = '::';
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.adminBulkName = 'Jonathan Sand';
		this.defaultTitle = 'Please, enter a title';
		this.lineTitle = '------------------------';
		this.leftJustifyGraph = u.isMobileDevice();
		this.allowHorizontalScrolling = true;
		this.allowGraphEditing = true;
		this.allowTitleEditing = true;
		this.doubleClickThreshold = 100;
		this.longClickThreshold = 500;
		this.toolsClusterHeight = 80;
		this.titleHeightAtTop = 50;
		this.bandHeightAtTop = 35;
		this.halfIncrement = 0.5;
		this.detailsMargin = 101;
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
		this.rootPath = dbDispatch.db.hierarchy.uniquePath();
	}
}

export let k = new Constants();
