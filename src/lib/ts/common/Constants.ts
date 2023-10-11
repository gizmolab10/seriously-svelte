import { dbDispatch, persistLocal } from '../../ts/common/GlobalImports'

export default class Constants {
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public orderIncrement: number;
	public backgroundColor: string;
	public highlightColor: string;
	public defaultTitle: string;

	constructor() {
		this.orderIncrement = 0.5;
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.defaultTitle = 'Please, enter a title';
		this.allowGraphEditing = false;
		this.allowTitleEditing = false;
	}

	setup() {
		const params = new URLSearchParams(window.location.search);
		this.applyQueryStrings(params)
		dbDispatch.setupDBParameters(params);
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
