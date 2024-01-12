import { Path, Grabs, Thing, Hierarchy, dbDispatch } from '../common/GlobalImports';
import Identifiable from "../common/Identifiable";

export default class Widget extends Identifiable {
    path: Path;
    thing: Thing | null;
    component: any;

    constructor(component: any, path: Path) {
		super(null);
        this.component = component;
        this.path = new Path(path);
        this.thing = this.hierarchy.thing_getForPath(this.path)
    }

    get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy; }
    get grabs(): Grabs { return this.hierarchy.grabs; }

    toggleGrab() { this.grabs.toggleGrab(this.path); }
    grabOnly() { this.grabs.grabOnly(this.path); }
    ungrab() { this.grabs.ungrab(this.path); }
    grab() { this.grabs.grab(this.path); }
}
