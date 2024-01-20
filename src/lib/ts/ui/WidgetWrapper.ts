import Identifiable from "../common/Identifiable";
import { Path } from '../common/GlobalImports';

export default class WidgetWrapper extends Identifiable {
    component: any;
    path: Path;

    constructor(component: any, path: Path) {
		super(null);
        this.path = path;
        this.component = component;
        this.path.widgetWrapper = this;
    }

}
