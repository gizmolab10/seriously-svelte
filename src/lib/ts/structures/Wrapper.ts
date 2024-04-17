import { Path } from '../common/GlobalImports';
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
    path: Path;

    constructor(component: any, path: Path, type: IDWrapper) {
		super(null);
        this.component = component;
        this.type = type;
        this.path = path;
    	path.wrapper_add(this);
    }

}
