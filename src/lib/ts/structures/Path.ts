import { s_dot_size, s_path_here, s_row_height, s_line_stretch, s_title_editing, s_paths_grabbed } from '../managers/State';
import { s_paths_expanded, s_path_toolsCluster, s_altering_parent, s_tools_inWidgets } from '../managers/State';
import { TitleState, dbDispatch, Relationship, SeriouslyRange, AlteringParent } from '../common/GlobalImports';
import { k, u, get, Rect, Size, Thing, IDWrapper, signals, Wrapper, Predicate } from '../common/GlobalImports';
import { Writable } from 'svelte/store';

export default class Path {
	wrappers: { [type: string]: Wrapper } = {};
	selectionRange = new SeriouslyRange(0, 0);
	predicateID: string;
	pathString: string;
	hashedPath: number;

	constructor(pathString: string = '', predicateID: string = Predicate.idIsAParentOf) {
		this.hashedPath = pathString.hash()
		this.predicateID = predicateID;
		this.pathString = pathString;
		if (pathString != '') {			// root path is setup in persist local finish setup
			this.setup();
		}
		if (k.hierarchy.isAssembled) {
			this.subscriptions_setup();	// not needed during hierarchy assembly
		}
	}

	signal_rebuild()  { signals.signal_rebuild(this); }
	signal_relayout() { signals.signal_relayout(this); }
	setup() { this.selectionRange = new SeriouslyRange(0, this.thing?.titleWidth ?? 0); }

	wrapper_add(wrapper: Wrapper) {
		this.wrappers[wrapper.type] = wrapper;
        k.hierarchy.wrapper_add(wrapper);
	}

	subscriptions_setup() {
		s_title_editing.subscribe(() => { this.thing?.updateColorAttributes(this); });
		s_paths_grabbed.subscribe(() => { this.thing?.updateColorAttributes(this); });
	}
	
	////////////////////////////////////
	//			properties			  //
	////////////////////////////////////
	
	get endID(): string { return this.idAt(); }
	get fromPath(): Path { return this.stripBack(); }
	get thing(): Thing | null { return this.thingAt(); }
	get firstChild(): Thing { return this.children[0]; }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get isRoot(): boolean { return this.matchesPath(k.rootPath); }
	get order(): number { return this.relationship?.order ?? -1; }
	get isHere(): boolean { return this.matchesStore(s_path_here); }
	get hasChildren(): boolean { return this.childPaths.length > 0; }
	get isExemplar(): boolean { return this.pathString == 'exemplar'; }
	get siblingPaths(): Array<Path> { return this.fromPath.childPaths; }
	get hashedIDs(): Array<number> { return this.ids.map(i => i.hash()); }
	get relationship(): Relationship | null { return this.relationshipAt(); }
	get thingTitle(): string { return this.thing?.title ?? 'missing title'; }
	get isGrabbed(): boolean { return this.includedInStore(s_paths_grabbed); }
	get lineWrapper(): Wrapper | null { return this.wrappers[IDWrapper.line]; }
	get titleWrapper(): Wrapper | null { return this.wrappers[IDWrapper.title]; }
	get toolsGrabbed(): boolean { return this.matchesStore(s_path_toolsCluster); }
	get revealWrapper(): Wrapper | null { return this.wrappers[IDWrapper.reveal]; }
	get widgetWrapper(): Wrapper | null { return this.wrappers[IDWrapper.widget]; }
	get thingTitleRect(): Rect | null { return this.wrapperRectFor(IDWrapper.title); }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get children(): Array<Thing> { return k.hierarchy?.things_getForPaths(this.childPaths); }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_paths_expanded); }
	get isEditing(): boolean { return this.matchesPath(get(s_title_editing)?.editing ?? null); }
	get isStoppingEdit(): boolean { return this.matchesPath(get(s_title_editing)?.stopping ?? null); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get thingTitles(): Array<string> { return k.hierarchy?.things_getForPath(this).map(t => `\"${t.title}\"`) ?? []; }

	get isVisible(): boolean {
		const here = k.hierarchy?.herePath;
		return this.incorporates(here) && this.isExpandedFrom(here);
	}

	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.pathString.split(k.pathSeparator);
	}

	get thingID(): string {
		if (this.isRoot) {
			return k.hierarchy?.idRoot ?? k.unknownID;
		}
		return this.relationship?.idTo ?? k.unknownID;
	}
	
	get things_canAlter_asParentOf_toolsGrab(): boolean {
		const path_toolsGrab = get(s_path_toolsCluster);
		if (path_toolsGrab && !this.matchesPath(path_toolsGrab) && this.thing != path_toolsGrab.thing) {
			const isParentOfTools = this.thing_isImmediateParentOf(path_toolsGrab);
			const isAProgenyOfTools = this.thing_isAProgenyOf(path_toolsGrab)
			const isDeleting = get(s_altering_parent) == AlteringParent.deleting;
			return isDeleting ? isParentOfTools : !(isParentOfTools || isAProgenyOfTools);
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
			console.log(`no next for ${this.thingTitles} of ${paths.map(p => '\n' + p.thingTitles)}`);
		} else {
			const next = index.increment(true, paths.length)
			nextPath = paths[next];
		}
		return nextPath;
	}

	get childPaths(): Array<Path> {
		const paths: Array<Path> = [];
		const thingID = this.thingID;
		if (thingID == k.unknownID) {
			console.log(`child paths unavailable for ID: ${k.unknownID}`);
		} else if (thingID) {
			const hierarchy = k.hierarchy;
			const toRelationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicateID, false, thingID);
			for (const toRelationship of toRelationships) {			// loop through all to relationships
				const path = this.appendID(toRelationship.id);		// add each toRelationship's id
				paths.push(path);									// and push onto the paths_to
			}
			u.paths_orders_normalize_remoteMaybe(paths);
		}
		return paths;
	}

	matchesStore(store: Writable<Path | null>): boolean { return this.matchesPath(get(store)); }
	includedInStore(store: Writable<Array<Path>>): boolean { return this.includedInPaths(get(store)); }
	matchesPath(path: Path | null): boolean { return !path ? false : this.pathString == path.pathString; }
	includedInPaths(paths: Array<Path>): boolean { return paths.filter(p => p.matchesPath(this)).length > 0; }
	sharesAnID(path: Path | null): boolean { return !path ? false : this.ids.some(id => path.ids.includes(id)); }
	wrapperRectFor(id: IDWrapper): Rect | null { return Rect.createFromDOMRect(this.wrappers[id]?.component.getBoundingClientRect()); }
	relationshipAt(back: number = 1): Relationship | null { return k.hierarchy?.relationship_getForHID(this.idAt(back).hash()) ?? null; }

	appendID(id: string): Path {
		let ids = this.ids;
		ids.push(id);
		return k.hierarchy.path_remember_unique(ids.join(k.pathSeparator));
	}

	idAt(back: number = 1): string {
		const ids = this.ids;
		if (back > ids.length) {
			return '';
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	thingAt(back: number = 1): Thing | null {
		const isEmpthPathString = this.pathString == '';
		const relationship = this.relationshipAt(back);
		if (!isEmpthPathString && relationship) {
			return !relationship ? null : k.hierarchy?.thing_getForHID(relationship.idTo.hash()) ?? null;
		}
		return k.hierarchy?.root ?? null;
	}

	thing_isImmediateParentOf(path: Path): boolean {
		const thingID = this.thingID;
		if (thingID != k.unknownID) {
			const parentThings = path.thing?.parents;
			return parentThings?.map(t => t.id).includes(thingID) ?? false;
		}
		return false;
	}

	isExpandedFrom(path: Path | null): boolean {
		let index = path?.ids.length ?? 0;
		const ids = this.ids;
		while (index < ids.length) {
			const tweenPath = this.stripBack(ids.length - index);
			if (tweenPath.hasChildren && !tweenPath.isExpanded) {
				return false;
			}
			index++;
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

	thing_isAProgenyOf(path: Path): boolean {
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

	stripBack(back: number = 1): Path {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return k.rootPath;
		}
		return k.hierarchy.path_remember_unique(ids.join(k.pathSeparator));
	}

	appendChild(thing: Thing | null): Path {
		if (thing) {
			const relationship = k.hierarchy?.relationship_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, this.thingID, thing.id);
			if (relationship) {
				return this.appendID(relationship.id);
			}
		}
		return this;
	}

	things_ancestryWithin(thresholdWidth: number): [number, Array<Thing>] {
		const root = k.hierarchy?.root;
		let totalWidth = 0;
		let sum = 0;
		const array = root ? [root] : [];
		for (const hID of this.hashedIDs) {
			const thing = k.hierarchy?.thing_to_getForRelationshipHID(hID);
			if (thing && thing != root) {
				totalWidth += u.getWidthOf(thing.title);
				if (totalWidth > thresholdWidth) {
					break;
				}
				sum = sum * 10 + thing.parentPaths.length;
				array.push(thing);
			}
		}
		return [sum, array];
	}

	visibleProgeny_height(visited: Array<string> = []): number {
		const thing = k.hierarchy?.thing_getForPath(this);
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
		const thing = k.hierarchy?.thing_getForPath(this);
		if (thing) {
			let width = isFirst ? 0 : thing.titleWidth;
			if (!visited.includes(this.hashedPath) && this.isExpanded && this.hasChildren) {
				let progenyWidth = 0;
			for (const childPath of this.childPaths) {
					const childProgenyWidth = childPath.visibleProgeny_width(false, [...visited, this.hashedPath]);
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

	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		// console.log(`GRAB ${this.thingTitles}`);
		s_paths_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	becomeHere() {
		if (this.hasChildren) {
			s_path_here.set(this);
			s_path_toolsCluster.set(null);
			this.expand();
			return true;
		}
		return false;
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
		k.rootPath.expand();
		k.rootPath.becomeHere();
	}

	clicked_dragDot(shiftKey: boolean) {
        if (!this.isExemplar) {
			s_title_editing?.set(null);
			if (get(s_altering_parent)) {
				k.hierarchy.path_alterMaybe(this);
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
            }
			signals.signal_rebuild_fromHere();
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

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hID = this.hashedPath;
		const childPaths = this.childPaths;
		if (!visited.includes(hID) && childPaths && childPaths.length > 1) {
			await u.paths_orders_normalize_remoteMaybe(childPaths, remoteWrite);
			for (const childPath of childPaths) {
				childPath.order_normalizeRecursive_remoteMaybe(remoteWrite, [...visited, hID]);
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
		if (!this.isRoot) {
			console.log(`EDIT ${this.thingTitles}`)
			this.grabOnly();
			let editState = get(s_title_editing);
			if (!editState) {
				s_title_editing.set(new TitleState(this));
			} else {
				editState.stopping = editState.editing;
				editState.editing = this;
			}
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
