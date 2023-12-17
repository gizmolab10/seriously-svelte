import { isMobileDevice } from '../../ts/common/GlobalImports'

export default class Constants {
	public clusterHeight: number;
	public detailsMargin: number;
	public halfIncrement: number;
	public longClickThreshold: number;
	public doubleClickThreshold: number;
	public allowHorizontalScrolling: boolean;
	public leftJustifyGraph: boolean;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public backgroundColor: string;
	public highlightColor: string;
	public adminBulkName: string;
	public defaultTitle: string;
	public lineTitle: string;

	constructor() {
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.adminBulkName = 'Jonathan Sand';
		this.defaultTitle = 'Please, enter a title';
		this.lineTitle = '------------------------';
		this.leftJustifyGraph = isMobileDevice();
		this.allowHorizontalScrolling = true;
		this.allowGraphEditing = true;
		this.allowTitleEditing = true;
		this.doubleClickThreshold = 100;
		this.longClickThreshold = 500;
		this.halfIncrement = 0.5;
		this.detailsMargin = 101;
		this.clusterHeight = 80;
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
