export default class S_Traits {
	index = 0;
	total = 0;	
	
	constructor(total: number) {
		this.total = total;
		this.index = 0;
	}

	grab_next() { this.index = this.index.increment(true, this.total); }
	grab_previous() { this.index = this.index.increment(false, this.total); }

}