import { dot_size, path_here, row_height, line_stretch, path_editing, paths_grabbed, paths_expanded, path_toolsGrab } from '../managers/State';
import { k, get, Size, Thing, signals, Hierarchy, dbDispatch, graphEditor, getWidthOf } from './GlobalImports';

export default class Path {
	showToolsCluster = false;
	pathString: string;

	constructor(path: string) {
		this.pathString = path;

		path_editing.subscribe(() => { this.thing()?.updateColorAttributes(this); });
		paths_grabbed.subscribe(() => { this.thing()?.updateColorAttributes(this); });

		path_toolsGrab.subscribe((toolsClusterPath: Path | null) => {
			const herePath = get(path_here);
			if (herePath && toolsClusterPath) {
				const shouldShow = toolsClusterPath == this && herePath == this;
				if (this.showToolsCluster != shouldShow) {
					this.showToolsCluster = shouldShow;
					signals.signal_relayout_fromHere();
				}
			}
		});
	}

	// ////////// //
	// properties //
	// ////////// //

	get parent(): Thing | null { return this.thing(1); }
	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy; }
	get isRoot(): boolean { return this == this.hierarchy.rootPath; }
	get ids(): Array<string> { return this.pathString.split(k.pathSeparator); }
	get isGrabbed(): boolean { return this.pathStringIncludedIn(get(paths_grabbed)); }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get isEditing(): boolean { return this.pathString == get(path_editing)?.pathString; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get toolsGrabbed(): boolean { return this.pathString == get(path_toolsGrab)?.pathString; }
	get isExpanded(): boolean { return this.isRoot || this.pathStringIncludedIn(get(paths_expanded)); }
	get singleRowHeight(): number { return this.showToolsCluster ? k.toolsClusterHeight : get(row_height); }
	get isVisible(): boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	thing(back: number = 0): Thing | null { return this.hierarchy.thing_getForID(this.pluckID(back)); }
	pluckID(back: number = 1): string | null { return this.ids.slice(-back)[0]; }
	endsWithID(id: string): boolean { return id == this.pluckID() ?? ''; }
	endsWith(thing: Thing): boolean { return this.endsWithID(thing.id); }
	
	pathStringIncludedIn(paths: Array<Path> | null): boolean {
		if (paths) {
			return paths.filter(p => p.pathString == this.pathString).length > 0;
		} else {
			return false;
		}
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

	get siblingPaths(): Array<Path> {
		const thing = this.thing()
		const parentPath = this.stripPath(1);
		let paths = Array<Path>();
		if (thing && parentPath) {
			for (const child of thing.children) {
				paths.push(parentPath.appendThing(child));
			}
		}
		return paths;
	}

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

	visibleProgeny_height(only: boolean = false, visited: Array<string> = []): number {
		const thing = dbDispatch.db.hierarchy.thing_getForPath(this);
		if (thing) {
			const singleRowHeight = only ? get(row_height) : this.singleRowHeight;
			if (!visited.includes(this.pathString) && thing.hasChildren && this.isExpanded) {
				let height = 0;
				for (const child of thing.children) {
					const childpath = this.appendThing(child);
					height += childpath.visibleProgeny_height(only, [...visited, this.pathString]);
				}
				return Math.max(height, singleRowHeight);
			}
			return singleRowHeight;
		}
		return 0;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<string> = []): number {
		const thing = dbDispatch.db.hierarchy.thing_getForPath(this);
		if (thing) {
			let width = isFirst ? 0 : thing.titleWidth;
			if (!visited.includes(this.pathString) && this.isExpanded && thing.hasChildren) {
				let progenyWidth = 0;
				for (const child of thing.children) {
					const childpath = this.appendThing(child);
					const childProgenyWidth = childpath.visibleProgeny_width(false, [...visited, this.pathString]);
					if (progenyWidth < childProgenyWidth) {
						progenyWidth = childProgenyWidth;
					}
				}
				width += progenyWidth + get(line_stretch) + get(dot_size) * (isFirst ? 2 : 1);
			}
			return width;
		}
		return 0;
	}
		
	// ////////// //
	// operations //
	// ////////// //

	expand() { this.expanded_setTo(true); }
	collapse() { this.expanded_setTo(false); }
	toggleExpand() { this.expanded_setTo(!this.isExpanded) }

	stripPath(back: number): Path | null {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return this.hierarchy.rootPath;
		}
		return new Path(ids.join(k.pathSeparator));
	}

	appendThing(thing: Thing | null): Path {
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

	toggleToolsGrab() {
		const grab = get(path_toolsGrab);
		if (grab) {
			if (grab.pathString == this.pathString) {
				path_toolsGrab.set(null);
			} else {
				path_toolsGrab.set(this);
			}
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
			this.toggleToolsGrab(); // do not show tools toolsCluster for root
		}
	}

	async thing_edit_remoteDuplicate() {
		const h = this.hierarchy;
		const id = this.pluckID();
		const thing = this.thing();
		const parent = this.parent ?? h.root;
		if (parent && thing && id) {
			const sibling = await h.thing_remember_runtimeCopy(id, thing);
			parent?.thing_edit_remoteAddAsChild(sibling);
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
			if (parentPath && !OPTION) {
				const grabPath = parentPath.appendThing(siblings[newIndex]);
				if (SHIFT) {
					this.hierarchy.grabs.toggleGrab(grabPath);
				} else {
					grabPath.grabOnly();
				}
			} else if (k.allowGraphEditing && OPTION) {
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				thing.order_setTo(newOrder, true);
				parent.order_normalizeRecursive_remoteMaybe(true);
			}
			signals.signal_rebuild_fromHere();
		}
	}

	async path_redraw_remoteMoveRight(RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = this.thing();
			if (thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await thing.redraw_bulkFetchAll_runtimeBrowseRight();
				} else {
					this.redraw_runtimeBrowseRight(RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (k.allowGraphEditing) {
			await graphEditor.widget_redraw_remoteRelocateRight(RIGHT, EXTREME);
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const thing = this.hierarchy.thing_getForPath(this);
		if (thing) {
			const newParentPath = this.stripPath(1);
			const childPath = this.appendThing(thing?.firstChild);
			let newGrabPath: Path | null = RIGHT ? childPath : newParentPath;
			const newGrabIsNotHere = newGrabPath?.toolsGrabbed;
			const newHerePath = newParentPath;
			if (RIGHT) {
				if (thing.hasChildren) {
					if (SHIFT) {
						newGrabPath = null;
					}
					this.expand();
				} else {
					return;
				}
			} else {
				const rootPath = this.hierarchy.rootPath;
				if (EXTREME) {
					rootPath?.becomeHere();	// tells graph to update line rects
				} else {
					if (!SHIFT) {
						if (fromReveal) {
							this.expand();
						} else {
							if (newGrabIsNotHere && newGrabPath && !newGrabPath.isExpanded) {
								newGrabPath?.expand();
							}
						}
					} else if (newGrabPath) { 
						if (this.isExpanded) {
							this.collapse();
							newGrabPath = null;
						} else if (newGrabPath == rootPath) {
							newGrabPath = null;
						} else {
							newGrabPath.collapse();
						}
					}
				}
			}
			path_editing.set(null);
			newGrabPath?.grabOnly();
			const allowToBecomeHere = (!SHIFT || newGrabPath == this.parent) && newGrabIsNotHere; 
			const shouldBecomeHere = !newHerePath?.isVisible || newHerePath.isRoot;
			if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
				newHerePath?.becomeHere();
			}
			signals.signal_rebuild_fromHere();
		}
	}
	
}
