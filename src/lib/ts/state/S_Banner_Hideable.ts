import { T_Detail } from '../common/Global_Imports';

// one for each detail type
// relatively useless

export class S_Banner_Hideable {
	slot_isVisible = false;
    t_detail!: T_Detail;
	hasBanner = false;
	isBottom = false;

	constructor(t_detail: T_Detail) {
		this.hasBanner = t_detail !== T_Detail.header;
		this.isBottom = t_detail === T_Detail.data;
		this.t_detail = t_detail;
    }

}