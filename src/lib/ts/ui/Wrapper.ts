import Identifiable from "../common/Identifiable";
import { Path } from '../common/GlobalImports';

export enum WrapperType {
	widget	= 'widget',
	title	= 'title',
	line	= 'line',
}

export default class Wrapper extends Identifiable {
    type: WrapperType;
    component: any;
    path: Path;

    constructor(component: any, path: Path, type: WrapperType) {
		super(null);
        this.path = path;
        this.type = type;
        this.component = component;
        this.path.addWrapper(this, type);
    }

}
