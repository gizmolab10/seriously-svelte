import { g, k, u, get, Rect, Size, Thing, debug, signals, Wrapper } from '../common/GlobalImports';
import { IDWrapper, Predicate, TitleState, Relationship, AlteringParent } from '../common/GlobalImports';
import { s_path_here, s_paths_grabbed, s_title_editing, s_layout_byClusters } from '../common/State';
import { s_paths_expanded, s_path_clusterTools, s_altering_parent } from '../common/State';
import { Writable } from 'svelte/store';

export default class Path {
	wrappers: { [type: string]: Wrapper } = {};
	_thing: Thing | null = null;
	predicateID: string;
	pathString: string;
	hashedPath: number;

	constructor(pathString: string = k.empty, predicateID: string = Predicate.idContains) {
		this.pathString = pathString;
		this.predicateID = predicateID;
		this.hashedPath = this.pathString.hash();
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
		s_title_editing.subscribe(() => { this.thing?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this.thing?.updateColorAttributes(this); });
	}
	
	static readonly $_PROPERTIES_$: unique symbol;
	
	get endID(): string { return this.idAt(); }
	get fromPath(): Path { return this.stripBack(); }
	get id_count():number { return this.ids.length; }
	get firstChild(): Thing { return this.children[0]; }
	get isRoot(): boolean { return this.hashedPath == 0; }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get order(): number { return this.relationship?.order ?? -1; }
	get isHere(): boolean { return this.matchesStore(s_path_here); }
	get isExemplar(): boolean { return this.pathString == 'exemplar'; }
	get title(): string { return this.thing?.title ?? 'missing title'; }
	get siblingPaths(): Array<Path> { return this.fromPath.childPaths; }
	get hashedIDs(): Array<number> { return this.ids.map(i => i.hash()); }
	get relationship(): Relationship | null { return this.relationshipAt(); }
	get idBridging(): string | null { return this.thing?.idBridging ?? null; }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get lineWrapper(): Wrapper | null { return this.wrappers[IDWrapper.line]; }
	get showsChildren(): boolean { return this.isExpanded && this.hasChildren; }
	get titleWrapper(): Wrapper | null { return this.wrappers[IDWrapper.title]; }
	get hasChildren(): boolean { return this.children_relationships.length > 0; }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_clusterTools); }
	get revealWrapper(): Wrapper | null { return this.wrappers[IDWrapper.reveal]; }
	get widgetWrapper(): Wrapper | null { return this.wrappers[IDWrapper.widget]; }
	get titleRect(): Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get things(): Array<Thing | null> { return g.hierarchy?.things_get_byPath(this); }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get children(): Array<Thing> { return g.hierarchy?.things_get_byPaths(this.childPaths); }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isEditing(): boolean { return this.matchesPath(get(s_title_editing)?.editing ?? null); }
	get titles(): Array<string> { return this.things?.map(t => ` \"${t ? t.title : 'null'}\"`) ?? []; }
	get isStoppingEdit(): boolean { return this.matchesPath(get(s_title_editing)?.stopping ?? null); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get showsReveal(): boolean { return !get(s_layout_byClusters) && (this.hasChildren || (this.thing?.isBulkAlias ?? false)); }
	
	get thing(): Thing | null {
		this._thing = this.thingAt() ?? null;	// always recompute, cache is for debugging
		return this._thing;
	}

	get isVisible(): boolean {
		const here = get(s_path_here);
		const incorporates = this.incorporates(here);
		const expanded = this.isAllExpandedFrom(here);
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
		return this.relationship?.idTo ?? k.id_unknown;
	}

	get children_relationships(): Array<Relationship> {
		const id = this.idBridging;				//  use idBridging in case thing is a bulk alias
		if (this.pathString != 'exemplar' && id && !['', 'k.id_unknown'].includes(id)) {
			return g.hierarchy.relationships_get_byPredicate_to_thing(this.predicateID, false, id);
		}
		return [];
	}

	get things_canAlter_asParentOf_toolsGrab(): boolean {
		const path_toolGrab = get(s_path_clusterTools);
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

	get next_siblingPath(): Path {
		let nextPath: Path = this;
		const hashedPath = this.hashedPath;
		const paths = this.thing?.parentPaths ?? [];
		const index = paths.map(p => p.hashedPath).indexOf(hashedPath);
		if (index == -1) {
			console.log(`no next for ${this.titles} of ${paths.map(p => k.newLine + p.titles)}`);
		} else {
			const next = index.increment(true, paths.length)
			nextPath = paths[next];
		}
		return nextPath;
	}

	get childPaths(): Array<Path> {
		let log = false;
		const paths: Array<Path> = [];
		const relationships = this.children_relationships;
		if (relationships.length > 0) {
			for (const relationship of relationships) {			// loop through all to relationships
				const path = this.appendID(relationship.id);	// add each relationship's id
				paths.push(path);								// and push onto the paths_to
				log = log || (path.pathString.length > 120);
			}
			u.paths_orders_normalize_remoteMaybe(paths);
		}
		if (log) {
			console.log(`${paths.length} childPaths: ${paths.map(p => p.titles)}`);
		}
		return paths;
	}

	matchesStore(store: Writable<Path | null>): boolean { return this.matchesPath(get(store)); }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matchesPath(path: Path | null): boolean { return !path ? false : this.hashedPath == path.hashedPath; }
	sharesAnID(path: Path | null): boolean { return !path ? false : this.ids.some(id => path.ids.includes(id)); }
	rect_ofWrapper(wrapper: Wrapper | null): Rect | null { return Rect.createFromDOMRect(wrapper?.component.getBoundingClientRect()); }
	relationshipAt(back: number = 1): Relationship | null { return g.hierarchy?.relationship_get_byHID(this.idAt(back).hash()) ?? null; }

	includedInPaths(paths: Array<Path>): boolean {
		return (paths?.filter(p => {
			const path = p as Path;
			return path && path.matchesPath(this);
		}).length > 0) ?? false;
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

	appendID(id: string): Path {
		let ids = this.ids;
		ids.push(id);
		return g.hierarchy.path_remember_unique(ids.join(k.pathSeparator));
	}

	idAt(back: number = 1): string {	// default 1 == last
		const ids = this.ids;
		if (back > ids.length) {
			return '';
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	thingAt(back: number = 1): Thing | null {			// default 1 == last
		const relationship = this.relationshipAt(back);
		if (this.pathString != k.empty && relationship) {
			return relationship.toThing;
		}
		return g.root;
	}

	thing_isImmediateParentOf(path: Path): boolean {
		const idThing = this.idThing;
		if (idThing != k.id_unknown) {
			const parentThings = path.thing?.parents;
			return parentThings?.map(t => t.id).includes(idThing) ?? false;
		}
		return false;
	}

	isAllExpandedFrom(path: Path | null): boolean {
		if (!this.matchesPath(path)) {
			let tweenPath: Path = this;
			let limit = path?.id_count ?? 0;
			while (limit < tweenPath.id_count) {
				tweenPath = tweenPath.stripBack();	// go backwards on this path
				if (!tweenPath.isExpanded) {		// stop when path is not expanded
					return false;
				}
			}
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

	path_isAProgenyOf(path: Path): boolean {
		let isAProgeny = false;
		path.traverse((progenyPath: Path) => {
			if (progenyPath.hashedPath == this.hashedPath) {
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
	
	visibleParentPaths(back: number = 1): Array<Path> {
		const paths: Array<Path> = [];
		for (const parentPath of (this.thing?.parentPaths ?? [])) {
			if (parentPath.stripBack(back).isVisible) {
				paths.push(parentPath);
			}
		}
		return paths;
	}

	stripBack(back: number = 1): Path {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return g.rootPath;
		}
		return g.hierarchy.path_remember_unique(ids.join(k.pathSeparator));
	}

	appendChild(thing: Thing | null): Path {
		const id = this.thing?.idBridging;
		if (thing && id) {
			const relationship = g.hierarchy?.relationship_get_byPredicate_from_to(Predicate.idContains, id, thing.id);
			if (relationship) {
				return this.appendID(relationship.id);
			}
		}
		return this;
	}

	things_ancestryWithin(thresholdWidth: number): [number, number, Array<Thing>] {
		const things = this.things?.reverse() ?? [];
		const array: Array<Thing> = [];
		let numberOfParents = 0;	// do not include fatPolygon separator in width of crumb of first thing
		let totalWidth = 0;
		let sum = 0;
		for (const thing of things) {
			if (thing) {
				const crumbWidth = thing.crumbWidth(numberOfParents);
				if ((totalWidth + crumbWidth) > thresholdWidth) {
					break;
				}
				numberOfParents = thing.parents.length;
				sum = sum * 10 + numberOfParents;
				totalWidth += crumbWidth;
				array.push(thing);
			}
		}
		return [sum, totalWidth, array.reverse()];
	}

	visibleProgeny_height(visited: Array<string> = []): number {
		const thing = this.thing;
		if (thing) {
			if (!visited.includes(this.pathString) && this.showsChildren) {
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
			const hashedPath = this.hashedPath;
			let width = special ? 0 : thing.titleWidth;
			if (!visited.includes(hashedPath) && this.showsChildren) {
				let progenyWidth = 0;
				for (const childPath of this.childPaths) {
					const childProgenyWidth = childPath.visibleProgeny_width(false, [...visited, hashedPath]);
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
		// debug.log_edit(`GRAB ${this.titles}`);
		// console.log(`grabOnly ${this.titles}`);
		s_paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	becomeHere(): boolean {
		const changed = !this.matchesPath(get(s_path_here));
		s_path_clusterTools.set(null);
		if (changed) {
			s_path_here.set(this);
			this.expand();
		}
		return changed;
	}

	toggleToolsGrab() {
		const toolsPath = get(s_path_clusterTools);
		if (toolsPath) { // ignore if clusterTools not in use
			if (this.matchesPath(toolsPath)) {
				s_path_clusterTools.set(null);
			} else if (!this.isRoot) {
				s_path_clusterTools.set(this);
			}
		}
	}

	async assureIsVisible() {
		// visit and expand each parent until this
		let path: Path | null = this;
		do {
			path = path?.fromPath;
			if (path) {
				if (path.isVisible) {
					path.becomeHere();
					return;
				}
				path.expand();
			}
		} while (!path);
		g.rootPath.expand();
		g.rootPath.becomeHere();
	}

	clicked_dotDrag(shiftKey: boolean) {
        if (!this.isExemplar) {
			s_title_editing?.set(null);
			if (get(s_layout_byClusters)) {
				this.becomeHere();
			} else {
				if (get(s_altering_parent)) {
					g.hierarchy.path_alterMaybe(this);
				} else if (shiftKey || this.isGrabbed) {
					this.toggleGrab();
				} else {
					this.grabOnly();
				}
			}
			signals.signal_rebuildWidgets_fromHere();
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
			this.toggleToolsGrab(); // do not show tools clusterTools for root
		}
	}

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hid = this.hashedPath;
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
			debug.log_edit(`EDIT ${this.titles}`)
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
