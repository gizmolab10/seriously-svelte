import { T_Detail } from '../../ts/common/Global_Imports';

export class S_Hideable {
    t_detail!: T_Detail;
	hasBanner = false;
	isBottom = false;
	height = 22;

	constructor(t_detail: T_Detail) {
		this.isBottom = t_detail === T_Detail.database;
        this.hasBanner = t_detail !== T_Detail.header;
		this.t_detail = t_detail;
    }

}