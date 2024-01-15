import { k, get, noop, Size, Thing, signals, Hierarchy, dbDispatch, getWidthOf, Predicate, AlteringParent } from './GlobalImports';
import { s_db_type, s_dot_size, s_path_here, s_row_height, s_path_editing, s_line_stretch } from '../managers/State';
import { s_paths_grabbed, s_paths_expanded, s_path_toolsGrab, s_altering_parent } from '../managers/State';
import { Writable } from 'svelte/store';

export default class Path {
	hierarchy: Hierarchy;
	pathString: string;

	constructor(path: string) {
		this.pathString = path;
		this.hierarchy = dbDispatch.db.hierarchy;

		s_path_editing.subscribe(() => { this.thing()?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this.thing()?.updateColorAttributes(this); });
		
		s_db_type.subscribe((type: string) => {
			if (this.hierarchy.db.s_db_type != type) {
				this.hierarchy = dbDispatch.dbForType(type).hierarchy;
			}
		});
	}

	////////////////////////////////////
	//			properties			  //
	////////////////////////////////////

	get thingID(): string { return this.ancestorID(); }
	get parent(): Thing | null { return this.thing(2); }
	get parentPath(): Path | null { return this.stripBack(); }
	get isHere(): boolean { return this.matchesStore(s_path_here); }
	get isEditing(): boolean { return this.matchesStore(s_path_editing); }
	get isRoot(): boolean { return this.matches(this.hierarchy.rootPath); }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_toolsGrab); }
	get ids(): Array<string> { return this.pathString.split(k.pathSeparator); }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height / 2; }
	get visibleProgeny_height(): number { return this.visibleProgenyRecursive_height(); }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isVisible(): boolean { return this.ids.includes(this.hierarchy.herePath?.thingID ?? ''); }
	get singleRowHeight(): number { return this.toolsGrabbed ? k.toolsClusterHeight : get(s_row_height); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height); }
	includedInPaths(paths: Array<Path>): boolean { return paths.filter(p => p.matches(this)).length > 0; }
	thing(back: number = 1): Thing | null { return this.hierarchy.thing_getForID(this.ancestorID(back)); }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matches(path: Path | null): boolean { return !path ? false : this.pathString == path.pathString; }
	matchesStore(store: Writable<Path | null>): boolean { return this.matches(get(store)); }
	ancestorID(back: number = 1): string { return this.ids.slice(-(Math.max(1, back)))[0]; }
	endsWith(thing: Thing): boolean { return this.endsWithID(thing.id); }
	endsWithID(id: string): boolean { return id == this.thingID; }

	sharesAnID(path: Path | null): boolean {
		const rootID = this.hierarchy.idRoot;
		return !path ? false : this.ids.some(id => id != rootID && path.ids.includes(id));
	}

	nextSiblingPath(increment: boolean): Path {
		const array = this.siblingPaths;
		const index = array.indexOf(this);
		let siblingIndex = index.increment(increment, array.length)
		if (index == 0) {
			siblingIndex = 1;
		}
		return array[siblingIndex];
	}

	stripBack(back: number = 1): Path | null {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return this.hierarchy.rootPath;
		}
		return new Path(ids.join(k.pathSeparator));
	}

	get siblingPaths(): Array<Path> {
		const thing = this.thing()
		const parentPath = this.parentPath;
		let paths = Array<Path>();
		if (thing && parentPath) {
			for (const child of thing.children) {
				paths.push(parentPath.appendingThing(child));
			}
		}
		return paths;
	}

	progeny_includesID(id: string | null): boolean {
		let found = false;
		const thing = this.thing();
		if (thing && id) {
			thing.traverse((descendant: Thing): boolean => {
				if (!found) {
					found = descendant.id == id;
				}
				return found;
			});
		}
		return found;
	}

	get canAlter_asParentOf_toolsGrab(): boolean {
		const path_showingTools = get(s_path_toolsGrab);
		const id_toolsGrab = path_showingTools?.thingID;
		const thing = this.thing();
		if (thing && id_toolsGrab) {
			if (thing.title == 'has four parents') {
				noop();
			}
			const includesToolsGrab = this.progeny_includesID(id_toolsGrab);
			switch (get(s_altering_parent)) {
				case AlteringParent.adding: return !includesToolsGrab;
				case AlteringParent.deleting: return includesToolsGrab && thing.id != id_toolsGrab;
			}
		}
		return false;
	}

	ancestralThings(thresholdWidth: number): Array<Thing> {
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

	visibleProgenyRecursive_height(visited: Array<string> = []): number {
		const thing = this.hierarchy.thing_getForPath(this);
		if (thing) {
			const singleRowHeight = this.singleRowHeight;
			if (!visited.includes(this.pathString) && thing.hasChildren && this.isExpanded) {
				let height = 0;
				for (const child of thing.children) {
					const childpath = this.appendingThing(child);
					height += childpath.visibleProgenyRecursive_height([...visited, this.pathString]);
				}
				return Math.max(height, singleRowHeight);
			}
			return singleRowHeight;
		}
		return 0;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<string> = []): number {
		const thing = this.hierarchy.thing_getForPath(this);
		if (thing) {
			let width = isFirst ? 0 : thing.titleWidth;
			if (!visited.includes(this.pathString) && this.isExpanded && thing.hasChildren) {
				let progenyWidth = 0;
				for (const child of thing.children) {
					const childpath = this.appendingThing(child);
					const childProgenyWidth = childpath.visibleProgeny_width(false, [...visited, this.pathString]);
					if (progenyWidth < childProgenyWidth) {
						progenyWidth = childProgenyWidth;
					}
				}
				width += progenyWidth + get(s_line_stretch) + get(s_dot_size) * (isFirst ? 2 : 1);
			}
			return width;
		}
		return 0;
	}

	////////////////////////////////////
	//			operations			  //
	////////////////////////////////////

	expand() { this.expanded_setTo(true); }
	collapse() { this.expanded_setTo(false); }
	toggleExpand() { this.expanded_setTo(!this.isExpanded) }	
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		s_paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	startEdit() {
		if (!this.isRoot) {
			s_path_editing.set(this);
		}
	}

	appendingThing(thing: Thing): Path {
		if (thing) {
			const ids = this.ids;
			ids.push(thing.id);
			return new Path(ids.join(k.pathSeparator));
		}
		return this;
	}

	becomeHere() {
		const thing = this.thing();
		if (thing && thing.hasChildren) {
			s_path_here.set(this);
			this.expand();
			s_path_toolsGrab.set(null);
		};
	}

	grab() {
		s_paths_grabbed.update((array) => {
			if (array.indexOf(this) == -1) {
				array.push(this);	// only add if not already added
			}
			return array;
		});
		this.toggleToolsGrab();
	}

	async parentRelationship_forget_remoteRemove(parentPath: Path) {
		const h = dbDispatch.db.hierarchy;
		const thing = this.thing();
		const parent = this.parent;
		const relationship = h.relationships_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, parentPath.thingID, this.thingID);
		if (parent && relationship && (thing?.parents.length ?? 0) > 1) {
			h.relationship_forget(relationship);
			parent.order_normalizeRecursive_remoteMaybe(true);
			await dbDispatch.db.relationship_remoteDelete(relationship);
		}
	}

	async parent_alterMaybe() {
		const alteration = get(s_altering_parent);
		if (this.canAlter_asParentOf_toolsGrab) {
			const toolsPath = get(s_path_toolsGrab);
			const toolsThing = toolsPath?.thing();
			if (toolsPath && toolsThing) {
				s_altering_parent.set(null);
				s_path_toolsGrab.set(null);
				switch (alteration) {
					case AlteringParent.deleting: await toolsPath.parentRelationship_forget_remoteRemove(this); break;
					case AlteringParent.adding: await this.hierarchy.path_remember_remoteAddAsChild(this, toolsThing); break;
				}
			}
		}
	}

	clicked_dragDot(shiftKey: boolean) {
		const thing = this.thing();
        if (thing && !thing.isExemplar) {
			if (get(s_altering_parent)) {
				this.parent_alterMaybe();
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
            }
			signals.signal_rebuild_fromHere();
        }
	}

	toggleToolsGrab() {
		if (get(s_path_toolsGrab)) { // ignore if no reveal dot set s_path_toolsGrab
			if (this.toolsGrabbed) {
				s_path_toolsGrab.set(null);
			} else {
				s_path_toolsGrab.set(this);
			}
		}
	}
	
	expanded_setTo(expand: boolean) {
		if (!this.isRoot) {
			let mutated = false;
			s_paths_expanded.update((array) => {
				if (array) {
					const index = array.map(e => e.pathString).indexOf(this.pathString);
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
				signals.signal_rebuild_fromHere();
			}
		}
	}

	ungrab() {
		const rootPath = this.hierarchy.rootPath;
		s_paths_grabbed.update((array) => {
			const index = array.indexOf(this);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootPath) {
				array.push(rootPath);
			}
			return array;
		});
		let paths = get(s_paths_grabbed);
		if (paths.length == 0 && rootPath) {
			rootPath.grabOnly();
		} else {
			this.toggleToolsGrab(); // do not show tools toolsCluster for root
		}
	}
	
}
