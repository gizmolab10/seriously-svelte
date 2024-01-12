import { k, Thing, dbDispatch, PersistID, persistLocal } from './GlobalImports';
import { path_here, path_toolsGrab } from '../managers/State';

export default class Path {
	path: string;

	constructor(path: string) {
		this.path = path;
	}

	// extracts
	get thing(): Thing | null { return dbDispatch.db.hierarchy.thing_getForPath(this); }
	lastIDOf(back: number = 1): string { return this.path.split(k.pathSeparator).slice(-back)[0]; }
	
	// operations
	stripPath(by: number) { return !this.path ? null : this.path.split(k.pathSeparator).slice(0, -by).join(k.pathSeparator); }
	appendPath(thing: Thing): string | null {
		const elements = this.path.split(k.pathSeparator);
		elements.push(thing.id);
		return elements.join(k.pathSeparator);
	}

	becomeHere() {
		const thing = this.thing;
		if (thing && thing.hasChildren) {
			path_here.set(this);
			thing.expand();
			path_toolsGrab.set(null);
		};
	}
	
}