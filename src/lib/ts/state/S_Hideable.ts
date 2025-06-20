import { T_Details } from '../../ts/common/Global_Imports';

export class S_Hideable {
    t_detail!: T_Details;
	hasBanner = false;
	isBottom = false;
	height = 22;

	constructor(t_detail: T_Details) {
		this.isBottom = t_detail === T_Details.database;
        this.hasBanner = t_detail !== T_Details.header;
		this.t_detail = t_detail;
    }

}