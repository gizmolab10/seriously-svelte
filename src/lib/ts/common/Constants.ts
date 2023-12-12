import { isMobileDevice } from '../../ts/common/GlobalImports'

export enum EraseOptions {
	data = 'data',
	settings = 'settings',
}

export enum DenyOptions {
	editGraph = 'editGraph',
	editTitles = 'editTitles',
	horizontalScrolling = 'horizontalScrolling',
}

export default class Constants {
	public clusterHeight: number;
	public detailsMargin: number;
	public halfIncrement: number;
	public longClickThreshold: number;
	public doubleClickThreshold: number;
	public leftJustifyGraph: boolean;
	public useFlow: boolean;
	public lineTitle: string;
	public defaultTitle: string;
	public adminBulkName: string;
	public highlightColor: string;
	public backgroundColor: string;
	public denyOptions: DenyOptions[];
	public eraseOptions: EraseOptions[];

	constructor() {
		this.backgroundColor = 'white';
		this.highlightColor = '#9e7daa';
		this.adminBulkName = 'Jonathan Sand';
		this.defaultTitle = 'Please, enter a title';
		this.lineTitle = '------------------------';
		this.leftJustifyGraph = isMobileDevice();
		this.doubleClickThreshold = 100;
		this.longClickThreshold = 500;
		this.halfIncrement = 0.5;
		this.detailsMargin = 101;
		this.clusterHeight = 80;
		this.eraseOptions = [];
		this.denyOptions = [];
		this.useFlow = false;
	}

    hasDenyOption(option: DenyOptions) { return this.denyOptions.includes(option); }
    hasEraseOption(option: EraseOptions) { return this.eraseOptions.includes(option); }
	get allowHorizontalScrolling(): boolean { return !this.hasDenyOption(DenyOptions.horizontalScrolling); }
	get allowGraphEditing(): boolean { return !this.hasDenyOption(DenyOptions.editGraph); }
	get allowTitleEditing(): boolean { return !this.hasDenyOption(DenyOptions.editTitles); }
	get eraseSettings(): boolean { return this.hasEraseOption(EraseOptions.settings); }
	get eraseData(): boolean { return this.hasEraseOption(EraseOptions.data); }

	applyQueryStrings(queryStrings: URLSearchParams) {
        const erase = queryStrings.get('erase');
        const deny = queryStrings.get('deny');
		if (queryStrings.get('use') === 'flow') {
			this.useFlow = true;
		}
        if (erase) {
            const options = erase.split(',');
            for (const option of options) {
                switch (option) {
                    case 'data': this.eraseOptions.push(EraseOptions.data); break;
                    case 'settings': this.eraseOptions.push(EraseOptions.settings); break;
                }
            }
        }
        if (deny) {
            const options = deny.split(',');
            for (const option of options) {
                switch (option) {
                    case 'editGraph': this.denyOptions.push(DenyOptions.editGraph); break;
                    case 'editTitles': this.denyOptions.push(DenyOptions.editTitles); break;
                    case 'horizontalScrolling': this.denyOptions.push(DenyOptions.horizontalScrolling); break;
                }
            }
        }
	}
}

export let k = new Constants();
