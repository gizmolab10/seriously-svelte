import { w_hierarchy } from '../../ts/common/Stores';
import { get } from 'svelte/store';

export default class S_Traits {
	index = 0;
	total = 0;	
	
	constructor(total: number) {
		this.total = total;
		this.index = 0;
	}

	grab_next() {
		this.index++;
		if (this.index >= this.total) {
			this.index = 0;
		}
	}
	
	grab_previous() {
		this.index--;
		if (this.index < 0) {
			if (this.total === 0) {
				this.index = 0;
			} else {
				this.index = this.total - 1;
			}
		}
	}

}