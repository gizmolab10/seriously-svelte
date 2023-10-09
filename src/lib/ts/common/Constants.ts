export default class Constants {
	public orderIncrement: number;
	public backgroundColor: string;
	public highlightColor: string;
	public defaultTitle: string;
	public allowGraphEditing: boolean;
	public allowTitleEditing: boolean;
	public showDetails: boolean;

	constructor(allowGraphEditing: boolean, allowTitleEditing: boolean, showDetails: boolean) {
		this.orderIncrement = 0.5;
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.defaultTitle = 'Please, enter a title';
		this.allowGraphEditing = allowGraphEditing;
		this.allowTitleEditing = allowTitleEditing;
		this.showDetails = showDetails;
	}

	readQueryStrings() {
		const params = new URLSearchParams(window.location.search);
		if (params.get('editGraph') === 'allow') {
			this.allowGraphEditing = true;
		}
		if (params.get('editTitles') === 'allow') {
			this.allowTitleEditing = true;
		}
		if (params.get('details') === 'show') {
			this.showDetails = true;
		}
	}
}

export let constants = new Constants(false, false, false);
