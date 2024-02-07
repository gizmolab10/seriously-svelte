import { Path } from '../common/GlobalImports';
import Identifiable from "./Identifiable";

export enum TypeW {
	widget	= 'widget',
	reveal	= 'reveal',
	title	= 'title',
	line	= 'line',
}

export default class Wrapper extends Identifiable {
    type: TypeW;
    component: any;
    path: Path;

    constructor(component: any, path: Path, type: TypeW) {
		super(null);
        this.path = path;
        this.type = type;
        this.component = component;
		path.wrapper_add(this);
    }

}
