import { g, k, u, get, Rect, Size, Thing, debug, signals, Wrapper, IDWrapper } from '../common/GlobalImports';
import { Predicate, TitleState, Relationship, PredicateKind, AlteringParent } from '../common/GlobalImports';
import { s_path_focus, s_paths_grabbed, s_title_editing, s_layout_byClusters } from '../common/State';
import { s_paths_expanded, s_path_graphTools, s_altering_parent } from '../common/State';
import { Writable } from 'svelte/store';

export default class Path {
	wrappers: { [type: string]: Wrapper } = {};
	_thing: Thing | null = null;
	idPredicate: string;
	pathString: string;
	pathHash: number;

	constructor(pathString: string = k.empty, idPredicate: string = Predicate.idContains) {
		this.pathHash = pathString.hash();
		this.idPredicate = idPredicate;
		this.pathString = pathString;
		if (g.hierarchy.isAssembled) {
			this.subscriptions_setup();			// not needed during hierarchy assembly
		}
	}

	signal_rebuildWidgets()  { signals.signal_rebuildWidgets(this); }
	signal_relayoutWidgets() { signals.signal_relayoutWidgets(this); }

	wrapper_add(wrapper: Wrapper) {
		this.wrappers[wrapper.type] = wrapper;
        g.hierarchy.wrapper_add(wrapper);
	}

	subscriptions_setup() {
		s_title_editing.subscribe(() => { this._thing?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this._thing?.updateColorAttributes(this); });
	}
	
	static readonly $_PROPERTIES_$: unique symbol;
	
	get endID(): string { return this.idAt(); }
	get id_count():number { return this.ids.length; }
	get firstChild(): Thing { return this.children[0]; }
	get isRoot(): boolean { return this.pathHash == 0; }
	get parentPath(): Path | null { return this.stripBack(); }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get order(): number { return this.relationship?.order ?? -1; }
	get isFocus(): boolean { return this.matchesStore(s_path_focus); }
	get isExemplar(): boolean { return this.pathString == 'exemplar'; }
	get title(): string { return this.thing?.title ?? 'missing title'; }
	get ids_hashed(): Array<number> { return this.ids.map(i => i.hash()); }
	get relationship(): Relationship | null { return this.relationshipAt(); }
	get idBridging(): string | null { return this.thing?.idBridging ?? null; }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get childPaths(): Array<Path> { return this.childPaths_for(); }
	get lineWrapper(): Wrapper | null { return this.wrappers[IDWrapper.line]; }
	get siblingPaths(): Array<Path> { return this.parentPath?.childPaths ?? []; }
	get titleWrapper(): Wrapper | null { return this.wrappers[IDWrapper.title]; }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_graphTools); }
	get revealWrapper(): Wrapper | null { return this.wrappers[IDWrapper.reveal]; }
	get widgetWrapper(): Wrapper | null { return this.wrappers[IDWrapper.widget]; }
	get titleRect(): Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get things(): Array<Thing | null> { return g.hierarchy?.things_forPath(this); }
	get hasChildRelationships(): boolean { return this.childRelationships.length > 0; }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get description(): string { return `${this.idPredicate} ${this.titles.join(':')}`; }
	get hasParentRelationships(): boolean { return this.parentRelationships.length > 0; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get children(): Array<Thing> { return g.hierarchy?.things_forPaths(this.childPaths); }
	get idPredicates(): Array<string> { return this.relationships.map(r => r.idPredicate); }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isEditing(): boolean { return this.matchesPath(get(s_title_editing)?.editing ?? null); }
	get showsChildRelationships(): boolean { return this.isExpanded && this.hasChildRelationships; }
	get isStoppingEdit(): boolean { return this.matchesPath(get(s_title_editing)?.stopping ?? null); }
	get titles(): Array<string> { return this.things?.map(t => ` \"${t ? t.title : 'null'}\"`) ?? []; }
	get hasRelationships(): boolean { return this.hasParentRelationships || this.hasChildRelationships; }
	get childRelationships(): Array<Relationship> { return this.parentRelationships_for(this.idPredicate, false); }
	get parentRelationships(): Array<Relationship> { return this.parentRelationships_for(this.idPredicate, true); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get showsReveal(): boolean { return !get(s_layout_byClusters) && (this.hasChildRelationships || (this.thing?.isBulkAlias ?? false)); }

	get relationships(): Array<Relationship> {
		const relationships = this.ids_hashed.map(h => g.hierarchy?.relationship_forHID(h)) ?? [];
		return u.strip_falsies(relationships);
	}
	
	get thing(): Thing | null {
		this._thing = this.thingAt() ?? null;	// always recompute, cache is for debugging
		return this._thing;
	}

	get isVisible(): boolean {
		const focus = get(s_path_focus);
		const incorporates = this.incorporates(focus);
		const expanded = this.isAllExpandedFrom(focus);
		return incorporates && expanded;
	}

	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.pathString.split(k.pathSeparator);
	}

	get idThing(): string {
		if (this.isRoot) {
			return g.hierarchy?.idRoot ?? k.id_unknown;
		}
		return this.relationship?.idChild ?? k.id_unknown;
	}

	get hasGrandChildren(): boolean {
		if (this.hasChildRelationships) {
			for (const childPath of this.childPaths) {
				if (childPath.hasChildRelationships) {
					return true;
				}
			}
		}
		return false;
	}

	get things_canAlter_asParentOf_toolsGrab(): boolean {
		const path_toolGrab = get(s_path_graphTools);
		const toolThing = path_toolGrab?.thing;
		const thing = this.thing;
		if (toolThing && !this.matchesPath(path_toolGrab) && thing && thing != toolThing) {
			const isParentOfTool = this.thing_isImmediateParentOf(path_toolGrab);
			const isAProgenyOfTool = this.path_isAProgenyOf(path_toolGrab);
			const toolIsAnAncestor = thing.parentIDs.includes(toolThing.id);
			const isDeleting = get(s_altering_parent) == AlteringParent.deleting;
			return isDeleting ? isParentOfTool : !(isParentOfTool || isAProgenyOfTool || toolIsAnAncestor);
		}
		return false;
	}

	get next_siblingPath(): Path {
		let nextPath: Path = this;
		const pathHash = this.pathHash;
		const paths = this.thing?.parentPaths ?? [];
		const index = paths.map(p => p.pathHash).indexOf(pathHash);
		if (index == -1) {
			console.log(`no next for ${this.description} of ${paths.map(p => k.newLine + p.description)}`);
		} else {
			const next = index.increment(true, paths.length)
			nextPath = paths[next];
		}
		return nextPath;
	}

	matchesStore(store: Writable<Path | null>): boolean { return this.matchesPath(get(store)); }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matchesPath(path: Path | null): boolean { return !path ? false : this.pathHash == path.pathHash; }
	sharesAnID(path: Path | null): boolean { return !path ? false : this.ids.some(id => path.ids.includes(id)); }
	includesPredicateID(idPredicate: string): boolean { return this.thing?.hasParentsFor(idPredicate) ?? false; }
	showsClusterFor(predicate: Predicate): boolean { return this.includesPredicateID(predicate.id) && this.hasThings(predicate); }
	rect_ofWrapper(wrapper: Wrapper | null): Rect | null { return Rect.createFromDOMRect(wrapper?.component.getBoundingClientRect()); }
	relationshipAt(back: number = 1): Relationship | null { return g.hierarchy?.relationship_forHID(this.idAt(back).hash()) ?? null; }
	
	parentRelationships_for(idPredicate: string, parent: boolean) {
		const id = this.idBridging;				//  use idBridging in case thing is a bulk alias
		if (id && this.pathString != 'exemplar' && ![k.empty, 'k.id_unknown'].includes(id)) {
			return g.hierarchy.relationships_forPredicateThingIsChild(idPredicate, id, parent);
		}
		return [];
	}

	path_isAProgenyOf(path: Path): boolean {
		let isAProgeny = false;
		path.traverse((progenyPath: Path) => {
			if (progenyPath.pathHash == this.pathHash) {
				isAProgeny = true;
				return true;	// stop traversal
			}
			return false;
		})
		return isAProgeny;
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

	uniqueParentPaths_for(idPredicate: string): Array<Path> {
		let parentPaths: Array<Path> = [];
		const things = this.thing?.parentThings_for(idPredicate) ?? [];
		for (const thing of things) {
			const paths = thing.isRoot ? [g.rootPath] : thing.parentPaths;
			parentPaths = u.concatenateArrays(parentPaths, paths);
		}
		if (idPredicate == Predicate.idIsRelated) {
			const childPaths = this.childPaths_for(idPredicate);
			parentPaths = u.concatenateArrays(parentPaths, childPaths);
		}
		const purgedPaths = u.strip_falsies(parentPaths);
		return u.strip_thingDuplicates(purgedPaths);
	}

	childPaths_for(idPredicate: string = Predicate.idContains): Array<Path> {
		let paths: Array<Path> = [];
		const childRelationships = this.parentRelationships_for(idPredicate, false);
		if (childRelationships.length > 0) {
			for (const childRelationship of childRelationships) {		// loop through all child relationships
				if (childRelationship.idPredicate == idPredicate) {
					const path = this.uniquelyAppendID(childRelationship.id);	// add each relationship's id
					if (path) {
						paths.push(path);								// and push onto the paths
					}
				}
			}
			if (idPredicate == Predicate.idContains) {					// normalize order of children only
				u.paths_orders_normalize_remoteMaybe(paths);
			}
		}
		return paths;
	}

	thingAt(back: number = 1): Thing | null {			// default 1 == last
		const relationship = this.relationshipAt(back);
		if (this.pathString != k.empty && relationship) {
			return relationship.childThing;
		}
		return g.hierarchy.root;	// N.B., g.root is wrong immediately after switching db type
	}

	thing_isImmediateParentOf(path: Path): boolean {
		const idThing = this.idThing;
		if (idThing != k.id_unknown) {
			const parentThings = path.thing?.parents;
			return parentThings?.map(t => t.id).includes(idThing) ?? false;
		}
		return false;
	}

	things_ancestryWithin(thresholdWidth: number): [number, number, Array<Thing>] {
		const things = this.things?.reverse() ?? [];
		const array: Array<Thing> = [];
		let distributedParentCount = 0;
		let numberOfParents = 0;	// do not include fat_polygon separator in width of crumb of first thing
		let totalWidth = 0;
		for (const thing of things) {
			if (thing) {
				const crumbWidth = thing.crumbWidth(numberOfParents);
				if ((totalWidth + crumbWidth) > thresholdWidth) {
					break;
				}
				distributedParentCount = distributedParentCount * 10 + thing.parents.length;
				totalWidth += crumbWidth;
				array.push(thing);
			}
		}
		return [distributedParentCount, totalWidth, array.reverse()];
	}

	things_childrenFor(idPredicate: string): Array<Thing> {
		const relationships = this.thing?.parentRelationships_for(idPredicate);
		let children: Array<Thing> = [];
		if (!this.isRoot && relationships) {
			for (const relationship of relationships) {
				const thing = relationship.parentThing;
				if (thing) {
					children.push(thing);
				}
			}
		}
		return children;
	}

	uniquelyAppendID(id: string): Path | null {
		let ids = this.ids;
		ids.push(id);
		return g.hierarchy.path_remember_createUnique(ids.join(k.pathSeparator));
	}

	includedInPaths(paths: Array<Path>): boolean {
		return (paths?.filter(p => {
			const path = p as Path;
			return path && path.matchesPath(this);
		}).length > 0) ?? false;
	}

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case PredicateKind.contains:  return this.thing?.hasParentsFor(predicate.id) ?? false;
			case PredicateKind.isRelated: return this.hasRelationships;
			default:					  return false;
		}
	}

	idAt(back: number = 1): string {	// default 1 == last
		const ids = this.ids;
		if (back > ids.length) {
			return k.empty;
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	dotColor(isInverted: boolean): string {
		const thing = this.thing;
		if (thing) {
			const showBorder = this.isGrabbed || this.isEditing || thing.isExemplar;
			if (isInverted != showBorder) {
				return thing.color;
			}
		}
		return k.color_background;
	}

	visibleParentPaths(back: number = 1): Array<Path> {
		const paths: Array<Path> = [];
		const parentPaths = this.thing?.parentPaths ?? [];
		for (const parentPath of parentPaths) {
			const ancestorPath = parentPath.stripBack(back);
			if (ancestorPath && ancestorPath.isVisible) {
				paths.push(parentPath);
			}
		}
		return paths;
	}

	stripBack(back: number = 1): Path | null {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return g.rootPath;
		}
		return g.hierarchy.path_remember_createUnique(ids.join(k.pathSeparator));
	}

	appendChild(child: Thing | null): Path | null {
		const idParent = this.thing?.idBridging;
		if (child && idParent) {
			const relationship = g.hierarchy?.relationship_forPredicate_parent_child(Predicate.idContains, idParent, child.id);
			if (relationship) {
				return this.uniquelyAppendID(relationship.id);
			}
		}
		return this;
	}

	isAllExpandedFrom(path: Path | null): boolean {
		if (!this.matchesPath(path)) {
			let tweenPath: Path = this;
			do {
				const maybe = tweenPath.parentPath;	// go backwards on this path
				if (maybe) {
					tweenPath = maybe;
					if (!tweenPath.isExpanded) {		// stop when path is not expanded
						return false;
					}
				}
			} while (tweenPath?.id_count > 0);
		}
		return true;
	}

	incorporates(path: Path | null): boolean {
		if (path) {
			const ids = this.ids;
			const pathIDs = path.ids;
			let index = 0;
			while (index < pathIDs.length) {
				if (ids[index] != pathIDs[index]) {
					return false;
				}
				index++;
			}
			return true;
		}
		return false;		
	}

	visibleProgeny_height(visited: Array<string> = []): number {
		const thing = this.thing;
		if (thing) {
			if (!visited.includes(this.pathString) && this.showsChildRelationships) {
				let height = 0;
				for (const childPath of this.childPaths) {
					height += childPath.visibleProgeny_height([...visited, this.pathString]);
				}
				return Math.max(height, k.row_height);
			}
			return k.row_height;
		}
		return 0;
	}

	visibleProgeny_width(special: boolean = k.titleIsAtTop, visited: Array<number> = []): number {
		const thing = this.thing;
		if (thing) {
			const pathHash = this.pathHash;
			let width = special ? 0 : thing.titleWidth;
			if (!visited.includes(pathHash) && this.showsChildRelationships) {
				let progenyWidth = 0;
				for (const childPath of this.childPaths) {
					const childProgenyWidth = childPath.visibleProgeny_width(false, [...visited, pathHash]);
					if (progenyWidth < childProgenyWidth) {
						progenyWidth = childProgenyWidth;
					}
				}
				width += progenyWidth + k.line_stretch + k.dot_size * (special ? 2 : 1);
			}
			return width;
		}
		return 0;
	}

	static readonly $_MUTATION_$: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		// debug.log_edit(`GRAB ${this.description}`);
		// console.log(`grabOnly ${this.description}`);
		s_paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	becomeFocus(): boolean {
		const changed = !this.matchesPath(get(s_path_focus));
		s_path_graphTools.set(null);
		if (changed) {
			s_path_focus.set(this);
			this.expand();
			if (get(s_layout_byClusters)) {
				this.grabOnly();
			}
		}
		return changed;
	}

	toggleToolsGrab() {
		const toolsPath = get(s_path_graphTools);
		if (toolsPath) { // ignore if graphTools not in use
			if (this.matchesPath(toolsPath)) {
				s_path_graphTools.set(null);
			} else if (!this.isRoot) {
				s_path_graphTools.set(this);
			}
		}
	}

	async assureIsVisible() {
		// visit and expand each parent until this
		let path: Path | null = this;
		do {
			path = path?.parentPath ?? null;
			if (path) {
				if (path.isVisible) {
					path.becomeFocus();
					return;
				}
				path.expand();
			}
		} while (!path);
		g.rootPath.expand();
		g.rootPath.becomeFocus();
	}

	clicked_dotDrag(shiftKey: boolean) {
        if (!this.isExemplar) {
			s_title_editing?.set(null);
			if (get(s_layout_byClusters)) {
				this.becomeFocus();
			} else {
				const childPaths = this.childPaths;
				const childPath = childPaths.length == 0 ? this : childPaths[0];
				if (get(s_altering_parent)) {
					g.hierarchy.path_alterMaybe(childPath);
				} else if (shiftKey || childPath.isGrabbed) {
					childPath.toggleGrab();
				} else {
					childPath.grabOnly();
				}
			}
			signals.signal_rebuildWidgets_fromFocus();
        }
	}

	grab() {
		s_paths_grabbed.update((array) => {
			const index = array.indexOf(this);
			if (array.length == 0) {
				array.push(this);
			} else if (index != array.length - 1) {	// not already last?
				if (index != -1) {					// found: remove
					array.splice(index, 1);
				}
				array.push(this);					// always add last
			}
			return array;
		});
		this.toggleToolsGrab();
	}

	ungrab() {
		const rootPath = g.rootPath;
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
			this.toggleToolsGrab(); // do not show tools graphTools for root
		}
	}

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hid = this.pathHash;
		const childPaths = this.childPaths;
		if (!visited.includes(hid) && childPaths && childPaths.length > 1) {
			await u.paths_orders_normalize_remoteMaybe(childPaths, remoteWrite);
			for (const childPath of childPaths) {
				childPath.order_normalizeRecursive_remoteMaybe(remoteWrite, [...visited, hid]);
			}
		}
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		if (!this.isRoot) {
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
		}
		return mutated;
	}

	startEdit() {
		if (!this.isRoot && k.allow_TitleEditing) {
			debug.log_edit(`EDIT ${this.description}`)
			this.grabOnly();
			s_title_editing.set(new TitleState(this));
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

}
