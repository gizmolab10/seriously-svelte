import { w_t_filter, w_t_search } from '../../ts/managers/Stores';
import { p, T_Preference } from "../common/Global_Imports";

class S_Search {
	search_string: string;

	constructor() {
		this.search_string = p.read_key(T_Preference.search_text);
	}

	search_for(string: string) {
		this.search_string = string;
		p.write_key(T_Preference.search_text, string);
	}
}

export const search = new S_Search();
