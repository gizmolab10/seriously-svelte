import { T_Details } from '../common/Global_Imports';

// one for each detail type
// relatively useless

export class S_Banner_Hideable {
	slot_isVisible = false;
    t_detail!: T_Details;
	hasBanner = false;
	isBottom = false;

	constructor(t_detail: T_Details) {
		this.hasBanner = t_detail !== T_Details.header;
		this.isBottom = t_detail === T_Details.data;
		this.t_detail = t_detail;
    }

}