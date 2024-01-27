import Identifiable from "../common/Identifiable";
import { Path } from '../common/GlobalImports';

export enum SvelteType {
	widget	= 'widget',
	reveal	= 'reveal',
	title	= 'title',
	line	= 'line',
}

export default class Wrapper extends Identifiable {
    type: SvelteType;
    component: any;
    path: Path;

    constructor(component: any, path: Path, type: SvelteType) {
		super(null);
        this.path = path;
        this.type = type;
        this.component = component;
        this.path.addWrapper(this, type);
    }

}
