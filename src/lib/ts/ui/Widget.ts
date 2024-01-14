import { get, Path, Thing, dbDispatch } from '../common/GlobalImports';
import { altering_parent } from '../managers/State';
import Identifiable from "../common/Identifiable";

export default class Widget extends Identifiable {
    thing: Thing | null;
    component: any;
    path: Path;

    constructor(component: any, path: Path, thing: Thing) {
		super(null);
        this.path = path;
        this.thing = thing;
        this.component = component;
    }

    grab() { this.path.grab(); }
    ungrab() { this.path.ungrab(); }
    grabOnly() { this.path.grabOnly(); }
    toggleGrab() { this.path.toggleGrab(); }

}
