import { get, Path, Thing, dbDispatch } from '../common/GlobalImports';
import { s_altering_parent } from '../managers/State';
import Identifiable from "../common/Identifiable";

export default class WidgetWrapper extends Identifiable {
    thing: Thing | null;
    component: any;
    path: Path;

    constructor(component: any, path: Path, thing: Thing) {
		super(null);
        this.path = path;
        this.thing = thing;
        this.component = component;
        path.widget = this;
    }

    grab() { this.path.grab(); }
    ungrab() { this.path.ungrab(); }
    grabOnly() { this.path.grabOnly(); }
    toggleGrab() { this.path.toggleGrab(); }

}
