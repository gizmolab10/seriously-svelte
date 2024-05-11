import { Ancestry } from '../common/GlobalImports';
import Identifiable from "./Identifiable";

export enum IDWrapper {
	widget	= 'widget',
	reveal	= 'reveal',
	title	= 'title',
	line	= 'line',
}

export default class Wrapper extends Identifiable {
    type: IDWrapper;
    component: any;
    ancestry: Ancestry;

    constructor(component: any, ancestry: Ancestry, type: IDWrapper) {
		super(null);
        this.component = component;
        this.type = type;
        this.ancestry = ancestry;
        if (!ancestry) {
            console.log('ick!');
        }
    	ancestry?.wrapper_add(this);
    }

}
