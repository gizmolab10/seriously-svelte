import { dbDispatch, isMobileDevice } from '../../ts/common/GlobalImports'

export default class Constants {
	public allowHorizontalScrolling: boolean;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public graphIsCentered: boolean;
	public orderIncrement: number;
	public backgroundColor: string;
	public highlightColor: string;
	public defaultTitle: string;

	constructor() {
		this.orderIncrement = 0.5;
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.defaultTitle = 'Please, enter a title';
		this.allowHorizontalScrolling = true;
		this.allowGraphEditing = true;
		this.allowTitleEditing = true;
		this.graphIsCentered = true;
	}

	setup() {
		const params = new URLSearchParams(window.location.search);
		this.graphIsCentered = !isMobileDevice();
		dbDispatch.applyQueryStrings(params);
		this.applyQueryStrings(params);
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

export let constants = new Constants();
