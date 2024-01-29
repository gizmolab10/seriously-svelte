import { s_dot_size, s_path_here, s_row_height, s_line_stretch, s_title_editing, s_paths_grabbed } from '../managers/State';
import { SvelteType, dbDispatch, Relationship, SeriouslyRange, AlteringParent } from '../common/GlobalImports';
import { s_paths_expanded, s_path_toolsGrab, s_altering_parent, s_tools_inWidgets } from '../managers/State';
import { k, u, get, Size, Thing, signals, Wrapper, Predicate, TitleState } from '../common/GlobalImports';
import { Writable } from 'svelte/store';

export default class Path {
	wrappers: { [type: string]: Wrapper } = {};
	selectionRange = new SeriouslyRange(0, 0);
	pathString: string;

	constructor(pathString: string = '') {
		this.pathString = pathString;
		if (pathString != '') {
			this.setup();
		} else {
			setTimeout(() => {
				this.setup();
			}, 100)
		}
		s_title_editing.subscribe(() => { this.thing()?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this.thing()?.updateColorAttributes(this); });
	}

	signal_rebuild()  { signals.signal_rebuild(this); }
	signal_relayout() { signals.signal_relayout(this); }
	addWrapper(wrapper: Wrapper, type: SvelteType) { this.wrappers[type] = wrapper; }
	setup() { this.selectionRange = new SeriouslyRange(0, this.thing()?.titleWidth ?? 0); }
	
	////////////////////////////////////
	//			properties			  //
	////////////////////////////////////

	get parent(): Thing | null { return this.thing(2); }
	get parentPath(): Path | null { return this.stripBack(); }
	get isHere(): boolean { return this.matchesStore(s_path_here); }
	get endID(): string { return this.ancestorRelationshipID(); }
	get isExemplar(): boolean { return this.thing()?.isExemplar ?? false; }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_toolsGrab); }
	get lineWrapper(): Wrapper | null { return this.wrappers[SvelteType.line]; };
	get titleWrapper(): Wrapper | null { return this.wrappers[SvelteType.title]; };
	get revealWrapper(): Wrapper | null { return this.wrappers[SvelteType.reveal]; };
	get widgetWrapper(): Wrapper | null { return this.wrappers[SvelteType.widget]; };
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isEditing(): boolean { return this.pathString == get(s_title_editing)?.editing?.pathString; }
	get isStoppingEdit(): boolean { return this.pathString == get(s_title_editing)?.stopping?.pathString; }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	
	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.pathString.split(k.pathSeparator);
	}

	get thingID(): string {
		if (this.isRoot) {
			return dbDispatch.db.hierarchy?.idRoot ?? '';
		}
		return this.relationship()?.idTo ?? '';
	}

	get isRoot(): boolean {
		if (dbDispatch.db.hierarchy) {
			return this.matchesPath(k.rootPath);
		}
		return false;
	}

	get isVisible(): boolean {
		const herePath = dbDispatch.db.hierarchy?.herePath;
		if (herePath) {
			return herePath.isRoot ? true : this.ids.includes(herePath.endID);
		}
		return false;
	}

	get siblingPaths(): Array<Path> {
		const parentPath = this.parentPath;
		const parent = parentPath?.thing()
		let paths = Array<Path>();
		if (parent && parentPath) {
			for (const child of parent.children) {
				paths.push(parentPath.appendChild(child));
			}
		}
		return paths;
	}

	get things_canAlter_asParentOf_toolsGrab(): boolean {
		const path_toolsGrab = get(s_path_toolsGrab);
		if (path_toolsGrab && !this.matchesPath(path_toolsGrab)) {
			const includesToolsGrab = this.thing_isParentOf(path_toolsGrab);
			return (get(s_altering_parent) == AlteringParent.deleting) == includesToolsGrab;
		}
		return false;
	}

	thing_isParentOf(path: Path): boolean {
		const parentRelationships = dbDispatch.db.hierarchy?.relationships_getByPredicateIDToAndID(Predicate.idIsAParentOf, true, path.thingID)
		if (parentRelationships) {
			return parentRelationships.filter(r => r.idFrom == this.thingID).length > 0;
		}
		return false;
	}

	relationship(back: number = 1): Relationship | null { return dbDispatch.db.hierarchy?.relationship_getForID(this.ancestorRelationshipID(back)) ?? null; }
	includedInPaths(paths: Array<Path>): boolean { return paths.filter(p => p.matchesPath(this)).length > 0; }
	matchesPath(path: Path | null): boolean { return !path ? false : this.pathString == path.pathString; }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matchesStore(store: Writable<Path | null>): boolean { return this.matchesPath(get(store)); }

	ancestorRelationshipID(back: number = 1): string {
		const ids = this.ids;
		if (back > ids.length) {
			return '';
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	thing(back: number = 1): Thing | null {
		const relationship = this.relationship(back);
		if (this.pathString != '' && relationship) {
			return !relationship ? null : dbDispatch.db.hierarchy?.thing_getForID(relationship.idTo) ?? null;
		}
		return dbDispatch.db.hierarchy?.root ?? null;
	}

	sharesAnID(path: Path | null): boolean {
		const rootID = dbDispatch.db.hierarchy?.idRoot;
		return !path ? false : this.ids.some(id => id != rootID && path.ids.includes(id));
	}

	path_ofNextSibling(increment: boolean): Path | null {
		const array = this.siblingPaths;
		const index = array.map(p => p.pathString).indexOf(this.pathString);
		if (index != -1) {
			let siblingIndex = index.increment(increment, array.length)
			if (index == 0) {
				siblingIndex = 1;
			}
			return array[siblingIndex];
		}
		return null;
	}

	stripBack(back: number = 1): Path | null {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return k.rootPath;
		}
		return dbDispatch.db.hierarchy.uniquePath(ids.join(k.pathSeparator));
	}

	appendChild(thing: Thing | null): Path {
		if (thing) {
			const relationship = dbDispatch.db.hierarchy?.relationships_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, this.thingID, thing.id);
			if (relationship) {
				return this.appendChildRelationship(relationship);
			}
		}
		return this;
	}

	appendChildRelationship(relationship: Relationship | null): Path {
		if (relationship) {
			let ids = this.ids;
			ids.push(relationship.id);
			return dbDispatch.db.hierarchy.uniquePath(ids.join(k.pathSeparator));
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

	things_ancestry(thresholdWidth: number): Array<Thing> {
		const root = dbDispatch.db.hierarchy?.root;
		const ids = this.ids;
		let totalWidth = 0;
		const array = root ? [root] : [];
		for (const id of ids) {
			const thing = dbDispatch.db.hierarchy?.thing_to_getForRelationshipID(id);
			if (thing && thing != root) {
				totalWidth += u.getWidthOf(thing.title);
				if (totalWidth > thresholdWidth) {
					break;
				}
				array.push(thing);
			}
		}
		return array;
	}

	visibleProgeny_height(visited: Array<string> = []): number {
		const thing = dbDispatch.db.hierarchy?.thing_getForPath(this);
		if (thing) {
			const useToolHeight = this.toolsGrabbed && get(s_tools_inWidgets);
			const rowHeight = useToolHeight ? k.toolsClusterHeight : get(s_row_height);
			if (!visited.includes(this.pathString) && thing.hasChildren && this.isExpanded) {
				let height = 0;
				for (const child of thing.children) {
					const childpath = this.appendChild(child);
					height += childpath.visibleProgeny_height([...visited, this.pathString]);
				}
				return Math.max(height, rowHeight);
			}
			return rowHeight;
		}
		return 0;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<string> = []): number {
		const thing = dbDispatch.db.hierarchy?.thing_getForPath(this);
		if (thing) {
			let width = isFirst ? 0 : thing.titleWidth;
			if (!visited.includes(this.pathString) && this.isExpanded && thing.hasChildren) {
				let progenyWidth = 0;
				for (const child of thing.children) {
					const childpath = this.appendChild(child);
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
	//			mutate state		  //
	////////////////////////////////////

	expand() { this.expanded_setTo(true); }
	collapse() { this.expanded_setTo(false); }
	toggleExpand() { this.expanded_setTo(!this.isExpanded) }	
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	toggleToolsGrab(update: boolean = true) {
		if (get(s_path_toolsGrab)) { // ignore if no reveal dot set s_path_toolsGrab
			if (this.toolsGrabbed) {
				s_path_toolsGrab.set(null);
			} else if (!this.isRoot) {
				s_path_toolsGrab.set(this);
			}
		}
	}

	grabOnly() {
		console.log(`GRAB ${this.thing()?.title}`);
		s_paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	grab() {
		s_paths_grabbed.update((array) => {
			const index = array.indexOf(this);
			if (index != -1) {
				// remove, then push
			} else {
				array.push(this);	// add last
			}
			return array;
		});
		this.toggleToolsGrab();
	}

	ungrab() {
		const rootPath = k.rootPath;
		s_paths_grabbed.update((array) => {
			const index = array.indexOf(this);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0) {
				array.push(rootPath);
			}
			return array;
		});
		let paths = get(s_paths_grabbed);
		if (paths.length == 0) {
			rootPath.grabOnly();
		} else {
			this.toggleToolsGrab(); // do not show tools toolsCluster for root
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

	startEdit() {
		if (!this.isRoot) {
			console.log(`EDIT ${this.thing()?.title}`)
			this.grabOnly();
			let editState = get(s_title_editing);
			if (!editState) {
				s_title_editing.set(new TitleState(this));
			} else {
				editState.stopping = editState.editing;
				editState.editing = this;
			}
			signals.signal_relayout_fromHere();
		}
	}

	////////////////////////////////////
	//			operations			  //
	////////////////////////////////////

	async parentRelationship_forget_remoteRemove(parentPath: Path) {
		const h = dbDispatch.db.hierarchy;
		const thing = this.thing();
		const parent = this.parent;
		const relationship = h.relationships_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, parentPath.thingID, this.thingID);
		if (parent && relationship && (thing?.parents.length ?? 0) > 1) {
			h.relationship_forget(relationship);
			if (parentPath.thing()?.hasChildren) {
				parent.order_normalizeRecursive_remoteMaybe(true);
			} else {
				parentPath.collapse();
			}
			await dbDispatch.db.relationship_remoteDelete(relationship);
		}
	}

	async parent_alterMaybe() {
		const alteration = get(s_altering_parent);
		if (this.things_canAlter_asParentOf_toolsGrab) {
			const toolsPath = get(s_path_toolsGrab);
			const toolsThing = toolsPath?.thing();
			if (toolsPath && toolsThing) {
				s_altering_parent.set(null);
				s_path_toolsGrab.set(null);
				switch (alteration) {
					case AlteringParent.deleting:
						await toolsPath.parentRelationship_forget_remoteRemove(this);
						break;
					case AlteringParent.adding:
						await dbDispatch.db.hierarchy?.path_remember_remoteAddAsChild(this, toolsThing);
						signals.signal_rebuild_fromHere();
						break;
				}
			}
		}
	}

	clicked_dragDot(shiftKey: boolean) {
        if (!this.isExemplar) {
			s_title_editing?.set(null);
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
}
