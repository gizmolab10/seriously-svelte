import { k, get, Thing, Hierarchy, dbDispatch, getWidthOf, signal_rebuild_fromHere, signal_relayout_fromHere } from './GlobalImports';
import { path_here, path_editing, paths_grabbed, paths_expanded, path_toolsGrab } from '../managers/State';

export default class Path {
	path: string;

	constructor(path: string) {
		this.path = path;
	}

	// extracts
	get parent(): Thing | null { return this.thing(1); }
	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy; }
	get isRoot(): boolean { return this == this.hierarchy.rootPath; }
	get ids(): Array<string> { return this.path.split(k.pathSeparator); }
	get isExpanded(): boolean { return this.isRoot || get(paths_expanded)?.includes(this.stripPath(1)); }
	thing(back: number = 0): Thing | null { return this.hierarchy.thing_getForID(this.pluckID(back)); }
	pluckID(back: number = 1): string { return this.ids.slice(-back)[0]; }

	ancestors(thresholdWidth: number): Array<Thing> {
		const ids = this.ids.reverse();
		let totalWidth = 0;
		const array = [];
		for (const id of ids) {
			const thing = this.hierarchy.thing_getForID(id);
			if (thing) {
				totalWidth += getWidthOf(thing.title);
				if (totalWidth > thresholdWidth) {
					break;
				}
				array.push(thing);
			}
		}
		array.reverse(); // TODO: is this needed?
		return array;
	}
		
	// operations
	expand() { this.expanded_setTo(true); }
	collapse() { this.expanded_setTo(false); }
	toggleExpand() { this.expanded_setTo(!this.isExpanded) }

	stripPath(back: number): Path {
		const ids = this.path.split(k.pathSeparator);
		return new Path(ids.slice(0, -back).join(k.pathSeparator));
	}

	appendThing(thing: Thing): Path {
		const elements = this.path.split(k.pathSeparator);
		elements.push(thing.id);
		return new Path(elements.join(k.pathSeparator));
	}

	becomeHere() {
		const thing = this.thing();
		if (thing && thing.hasChildren) {
			path_here.set(this);
			this.expand();
			path_toolsGrab.set(null);
		};
	}
	
	expanded_setTo(expand: boolean) {
		if (!this.isRoot) {
			let mutated = false;
			paths_expanded.update((array) => {
				if (array) {
					const index = array.indexOf(this);
					if (expand) {
						if (index == -1) {
							array.push(this);	// only add if not already added
							mutated = true;
						}
					} else if (index != -1) {					// only splice array when item is found
						array.splice(index, 1);			// 2nd parameter means 'remove one item only'
						mutated = true;
					}
				}
				return array;
			});
			if (mutated) {			// avoid disruptive rebuild
				signal_rebuild_fromHere();
			}
		}
	}

	toggleToolsGrab() {
		if (get(path_toolsGrab) == this) {
			path_toolsGrab.set(null);
		} else {
			path_toolsGrab.set(this);
		}
	}

	grabOnly() {
		paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	grab() {
		paths_grabbed.update((array) => {
			if (array.indexOf(this) == -1) {
				array.push(this);	// only add if not already added
			}
			return array;
		});
		this.toggleToolsGrab();
	}

	ungrab() {
		const rootPath = this.hierarchy.rootPath;
		paths_grabbed.update((array) => {
			const index = array.indexOf(this);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootPath) {
				array.push(rootPath);
			}
			return array;
		});
		let paths = get(paths_grabbed);
		if (paths.length == 0 && rootPath) {
			rootPath.grabOnly();
		} else {
			this.toggleToolsGrab(); // do not show tools cluster for root
		}
	}

	async thing_edit_remoteDuplicate() {
		const h = this.hierarchy;
		const thing = h.thing_getForPath(this);
		if (thing) {
			const sibling = await h.thing_remember_runtimeCopy(this.pluckID(), thing);
			const parent = thing.firstParent ?? h.root;
			parent.thing_edit_remoteAddAsChild(sibling);
		}
	}

	redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const thing = this.hierarchy.thing_getForPath(this);
		const parentPath = this.stripPath(1);
		const parent = this.hierarchy.thing_getForPath(parentPath);
		const siblings = parent?.children;
		if (!siblings || siblings.length == 0) {
			this.redraw_runtimeBrowseRight(true, EXTREME, up);
		} else if (thing) {
			const index = siblings.indexOf(thing);
			const newIndex = index.increment(!up, siblings.length);
			if (!OPTION) {
				const grabPath = parentPath.appendThing(siblings[newIndex]);
				if (SHIFT) {
					this.hierarchy.grabs.toggleGrab(grabPath);
				} else {
					grabPath.grabOnly();
				}
			} else if (k.allowGraphEditing) {
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				const order = thing.order;
				thing.order_setTo(newOrder, true);
				parent.order_normalizeRecursive_remoteMaybe(true);
				signal_relayout_fromHere();
			}
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const thing = this.hierarchy.thing_getForPath(this);
		if (thing) {
			const parentPath = this.stripPath(RIGHT ? 1 : 3);
			const childPath = this.appendThing(thing.firstChild);
			const newHere = parentPath;
			let newGrab: Path | null = RIGHT ? childPath : parentPath;
			const newGrabIsNotHere = get(path_here) != newGrab;
			if (!RIGHT) {
				const rootPath = this.hierarchy.rootPath;
				if (EXTREME) {
					rootPath?.becomeHere();	// tells graph to update line rects
				} else {
					if (!SHIFT) {
						if (fromReveal) {
							this.expand();
						} else if (newGrabIsNotHere && newGrab && !newGrab.isExpanded) {
							newGrab?.expand();
						}
					} else if (newGrab) { 
						if (this.isExpanded) {
							this.collapse();
							newGrab = null;
						} else if (newGrab == rootPath) {
							newGrab = null;
						} else {
							newGrab.collapse();
						}
					}
				}
			} else if (thing.hasChildren) {
				if (SHIFT) {
					newGrab = null;
				}
				this.expand();
			} else {
				return;
			}
			path_editing.set(null);
			newGrab?.grabOnly();
			const allowToBecomeHere = (!SHIFT || newGrab == this.parent) && newGrabIsNotHere; 
			const shouldBecomeHere = !newHere.isVisible || newHere.isRoot;
			if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
				newHere.becomeHere();
			}
		}
	}
	
}