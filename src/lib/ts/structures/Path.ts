import { s_dot_size, s_path_here, s_row_height, s_line_stretch, s_title_editing, s_paths_grabbed } from '../managers/State';
import { s_paths_expanded, s_path_toolsCluster, s_altering_parent, s_tools_inWidgets } from '../managers/State';
import { TypeW, dbDispatch, Relationship, SeriouslyRange, AlteringParent } from '../common/GlobalImports';
import { k, u, get, Size, Thing, signals, Wrapper, Predicate, TitleState } from '../common/GlobalImports';
import { Writable } from 'svelte/store';

export default class Path {
	wrappers: { [type: string]: Wrapper } = {};
	selectionRange = new SeriouslyRange(0, 0);
	predicateID = Predicate.idIsAParentOf;
	paths_to: Array<Path> = [];
	pathString: string;

	constructor(pathString: string = '') {
		this.pathString = pathString;
		if (pathString != '') {
			this.setup();
		} else {
			setTimeout(() => {
				this.setup();
			}, 100);				// TODO: why?
		}
		s_title_editing.subscribe(() => { this.thing()?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this.thing()?.updateColorAttributes(this); });
	}
	
	async paths_recursive_assemble() {
		const thing = this.thing();
		const hierarchy = dbDispatch.db.hierarchy;
		this.predicateID = Predicate.idIsAParentOf;
		if (thing) {
			const toRelationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicateID, false, thing.id);
			for (const toRelationship of toRelationships) {				// loop through all to relationships
				const path_to = this.appendID(toRelationship.id);		// add each toRelationship's id
				this.paths_to.push(path_to);							// and push onto the paths_to
				await u.paths_orders_normalize_remoteMaybe(this.paths_to);
				await path_to.paths_recursive_assemble();				// recurse with each to path
			}
			thing.parentRelations.assemble_from(this);					// assemble during the traversal's return
		}
	}

	signal_rebuild()  { signals.signal_rebuild(this); }
	signal_relayout() { signals.signal_relayout(this); }
	addWrapper(wrapper: Wrapper, type: TypeW) { this.wrappers[type] = wrapper; }
	setup() { this.selectionRange = new SeriouslyRange(0, this.thing()?.titleWidth ?? 0); }
	
	////////////////////////////////////
	//			properties			  //
	////////////////////////////////////
	
	get endID(): string { return this.idAt(); }
	get parentPath(): Path { return this.stripBack(); }
	get parent(): Thing | null { return this.thing(2); }
	get firstChild(): Thing { return this.children[0]; }
	get childPaths(): Array<Path> { return this.paths_to; }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get isRoot(): boolean { return this.matchesPath(k.rootPath); }
	get order(): number { return this.relationship()?.order ?? -1; }
	get isHere(): boolean { return this.matchesStore(s_path_here); }
	get hasChildren(): boolean { return this.childPaths.length > 0; }
	get siblingPaths(): Array<Path> { return this.parentPath.childPaths; }
	get hashedIDs(): Array<number> { return this.ids.map(i => i.hash()); }
	get isExemplar(): boolean { return this.thing()?.isExemplar ?? false; }
	get parentPaths(): Array<Path> { return this.thing()?.parentPaths ?? []; }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get thingTitle(): string { return this.thing()?.title ?? 'missing title'; }
	get lineWrapper(): Wrapper | null { return this.wrappers[TypeW.line]; }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_toolsCluster); }
	get titleWrapper(): Wrapper | null { return this.wrappers[TypeW.title]; }
	get revealWrapper(): Wrapper | null { return this.wrappers[TypeW.reveal]; }
	get widgetWrapper(): Wrapper | null { return this.wrappers[TypeW.widget]; }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isEditing(): boolean { return this.pathString == get(s_title_editing)?.editing?.pathString; }
	get children(): Array<Thing> { return dbDispatch.db.hierarchy?.things_getForPaths(this.childPaths); }
	get isStoppingEdit(): boolean { return this.pathString == get(s_title_editing)?.stopping?.pathString; }
	get things_allAncestors(): Array<Thing> { return this.things_ancestryWithin(Number.MAX_SAFE_INTEGER); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get thingTitles(): Array<string> { return dbDispatch.db.hierarchy?.things_getForPath(this).map(t => `\"${t.title}\"`) ?? []; }

	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.pathString.split(k.pathSeparator);
	}

	get thingID(): string {
		if (this.isRoot) {
			return dbDispatch.db.hierarchy?.idRoot ?? 'missing root id';
		}
		return this.relationship()?.idTo ?? 'missing id';
	}

	get isVisible(): boolean {
		const herePath = dbDispatch.db.hierarchy?.herePath;
		if (herePath) {
			return herePath.isRoot ? true : this.ids.includes(herePath.endID);
		}
		return false;
	}

	get things_canAlter_asParentOf_toolsGrab(): boolean {
		const path_toolsGrab = get(s_path_toolsCluster);
		if (path_toolsGrab && !this.matchesPath(path_toolsGrab)) {
			const includesToolsGrab = this.thing_isParentOf(path_toolsGrab);
			return (get(s_altering_parent) == AlteringParent.deleting) == includesToolsGrab;
		}
		return false;
	}

	get hasGrandChildren(): boolean {
		if (this.hasChildren) {
			for (const childPath of this.childPaths) {
				if (childPath.hasChildren) {
					return true;
				}
			}
		}
		return false;
	}

	get next_siblingPath(): Path | null {
		let nextPath: Path | null = null
		const parentPaths = this.parentPaths;
		const index = parentPaths.map(p => p.thingID).indexOf(this.parentPath.thingID);
		if (index != -1) {
			const next = index.increment(true, parentPaths.length)
			nextPath = parentPaths[next].appendID(this.endID);
		}
		return nextPath;
	}

	matchesStore(store: Writable<Path | null>): boolean { return this.matchesPath(get(store)); }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matchesPath(path: Path | null): boolean { return !path ? false : this.pathString == path.pathString; }
	includedInPaths(paths: Array<Path>): boolean { return paths.filter(p => p.matchesPath(this)).length > 0; }
	relationship(back: number = 1): Relationship | null { return dbDispatch.db.hierarchy?.relationship_getForHID(this.idAt(back).hash()) ?? null; }

	sharesAnID(path: Path | null): boolean {
		const rootID = dbDispatch.db.hierarchy?.idRoot;
		return !path ? false : this.ids.some(id => id != rootID && path.ids.includes(id));
	}

	appendID(id: string): Path {
		let ids = this.ids;
		ids.push(id);
		return dbDispatch.db.hierarchy.path_unique(ids.join(k.pathSeparator));
	}

	idAt(back: number = 1): string {
		const ids = this.ids;
		if (back > ids.length) {
			return '';
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	thing_isParentOf(path: Path): boolean {
		const parentRelationships = dbDispatch.db.hierarchy?.relationships_getByPredicateIDToAndID(Predicate.idIsAParentOf, true, path.thingID)
		if (parentRelationships) {
			return parentRelationships.filter(r => r.idFrom == this.thingID).length > 0;
		}
		return false;
	}

	thing(back: number = 1): Thing | null {
		const relationship = this.relationship(back);
		if (this.pathString != '' && relationship) {
			return !relationship ? null : dbDispatch.db.hierarchy?.thing_getForHID(relationship.idTo.hash()) ?? null;
		}
		return dbDispatch.db.hierarchy?.root ?? null;
	}

	becomeHere() {
		const thing = this.thing();
		if (thing && this.hasChildren) {
			s_path_here.set(this);
			this.expand();
			s_path_toolsCluster.set(null);
		};
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

	stripBack(back: number = 1): Path {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return k.rootPath;
		}
		return dbDispatch.db.hierarchy.path_unique(ids.join(k.pathSeparator));
	}

	appendChild(thing: Thing | null): Path {
		if (thing) {
			const relationship = dbDispatch.db.hierarchy?.relationship_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, this.thingID, thing.id);
			if (relationship) {
				return this.appendID(relationship.id);
			}
		}
		return this;
	}

	ancestors_include(thing: Thing): boolean {
		const parentPaths = this.thing()?.parentRelations.parentPathsFor(Predicate.idIsAParentOf.hash());
		if (parentPaths) {
			for (const parentPath of parentPaths) {
				if (parentPath.things_allAncestors.map(t => t.id).includes(thing.id)) {
					return true;
				}
			}
		}
		return false;
	}

	things_ancestryWithin(thresholdWidth: number): Array<Thing> {
		const root = dbDispatch.db.hierarchy?.root;
		let totalWidth = 0;
		const array = root ? [root] : [];
		for (const hID of this.hashedIDs) {
			const thing = dbDispatch.db.hierarchy?.thing_to_getForRelationshipHID(hID);
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
			if (!visited.includes(this.pathString) && this.hasChildren && this.isExpanded) {
				let height = 0;
				for (const childPath of this.childPaths) {
					height += childPath.visibleProgeny_height([...visited, this.pathString]);
				}
				return Math.max(height, rowHeight);
			}
			return rowHeight;
		}
		return 0;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<number> = []): number {
		const thing = dbDispatch.db.hierarchy?.thing_getForPath(this);
		if (thing) {
			let width = isFirst ? 0 : thing.titleWidth;
			if (!visited.includes(this.pathString.hash()) && this.isExpanded && this.hasChildren) {
				let progenyWidth = 0;
			for (const childPath of this.childPaths) {
					const childProgenyWidth = childPath.visibleProgeny_width(false, [...visited, this.pathString.hash()]);
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

	async order_setTo(order: number, remoteWrite: boolean = true) {
		await this.relationship()?.order_setTo(order, remoteWrite);
	}

	toggleToolsGrab(update: boolean = true) {
		if (get(s_path_toolsCluster)) { // ignore if no reveal dot set s_path_toolsCluster
			if (this.toolsGrabbed) {
				s_path_toolsCluster.set(null);
			} else if (!this.isRoot) {
				s_path_toolsCluster.set(this);
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

	async assureIsVisible() {
		console.log('assureIsVisible is not done');
	}

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hID = this.pathString.hash();
		const childPaths = this.childPaths;
		if (!visited.includes(hID) && childPaths && childPaths.length > 1) {
			await u.paths_orders_normalize_remoteMaybe(childPaths, remoteWrite);
			for (const childPath of childPaths) {
				childPath.order_normalizeRecursive_remoteMaybe(remoteWrite, [...visited, hID]);
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

	async traverse_async(applyTo: (path: Path) => Promise<boolean>) {
		if (!await applyTo(this)) {
			for (const childPath of this.childPaths) {
				await childPath.traverse_async(applyTo);
			}
		}
	}

	traverse(applyTo: (path: Path) => boolean) {
		if (!applyTo(this)) {
			for (const childPath of this.childPaths) {
				childPath.traverse(applyTo);
			}
		}
	}

	////////////////////////////////////
	//			operations			  //
	////////////////////////////////////

	async relationship_forget_remoteRemove(path: Path) {
		const h = dbDispatch.db.hierarchy;
		const thing = this.thing();
		const parentPath = this.parentPath;
		const relationship = h.relationship_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, path.thingID, this.thingID);
		if (parentPath && relationship && (thing?.parents.length ?? 0) > 1) {
			h.relationship_forget(relationship);
			if (path.hasChildren) {
				parentPath.order_normalizeRecursive_remoteMaybe(true);
			} else {
				path.collapse();
			}
			await dbDispatch.db.relationship_remoteDelete(relationship);
		}
	}

	async parent_alterMaybe() {
		const alteration = get(s_altering_parent);
		if (this.things_canAlter_asParentOf_toolsGrab) {
			const toolsPath = get(s_path_toolsCluster);
			const toolsThing = toolsPath?.thing();
			if (toolsPath && toolsThing) {
				s_altering_parent.set(null);
				s_path_toolsCluster.set(null);
				switch (alteration) {
					case AlteringParent.deleting:
						await toolsPath.relationship_forget_remoteRemove(this);
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
