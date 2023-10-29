import { noop, dbDispatch, isMobileDevice } from '../../ts/common/GlobalImports'

export default class Constants {
	public detailsMargin: number;
	public orderIncrement: number;
	public leftJustifyGraph: boolean;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public allowHorizontalScrolling: boolean;
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
		this.orderIncrement = 0.5;
		this.detailsMargin = 101;
	}

	applyQueryStrings(params: URLSearchParams) {
		if (params.get('editGraph') === 'deny') {
			this.allowGraphEditing = false;
		}
		if (params.get('editTitles') === 'deny') {
			this.allowTitleEditing = false;
		}
		if (params.get('horizontalScrolling') === 'deny') {
			this.allowHorizontalScrolling = false;
		}
	}
}

export let k = new Constants();
