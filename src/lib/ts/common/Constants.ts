import { dbDispatch, isMobileDevice } from '../../ts/common/GlobalImports'

export default class Constants {
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
		this.allowGraphEditing = true;
		this.allowTitleEditing = true;
		this.graphIsCentered = true;
	}

	setup() {
		const params = new URLSearchParams(window.location.search);
		this.graphIsCentered = !isMobileDevice();
		dbDispatch.applyQueryStrings(params);
		this.applyQueryStrings(params)
	}

	applyQueryStrings(params: URLSearchParams) {
		if (params.get('editGraph') === 'allow') {
			this.allowGraphEditing = true;
		}
		if (params.get('editTitles') === 'allow') {
			this.allowTitleEditing = true;
		}
	}
}

export let constants = new Constants();
