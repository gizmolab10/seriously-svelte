import { T_Startup } from '../common/Enumerations';
import { Hierarchy } from '../managers/Hierarchy';
import { writable } from 'svelte/store';

export class Stores {

	w_t_startup			  = writable<T_Startup>(T_Startup.start);
	w_hierarchy			  = writable<Hierarchy>();

}

export const s  = new Stores();
