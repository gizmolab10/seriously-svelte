import { Ancestry, SvelteComponentType } from './GlobalImports';
import Identifiable from '../data/Identifiable';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class SvelteWrapper extends Identifiable {
    type: SvelteComponentType;
    ancestry: Ancestry;
    component: any;

    constructor(component: any, ancestry: Ancestry, type: SvelteComponentType) {
		super();
        this.type = type;
        this.ancestry = ancestry;
        this.component = component;
    	ancestry?.wrapper_add(this);
    }

}
