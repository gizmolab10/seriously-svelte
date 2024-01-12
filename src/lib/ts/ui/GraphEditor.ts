import { k, get, Thing, Widget, Hierarchy, dbDispatch, stripPath, appendPath, signal_rebuild_fromHere, signal_relayout_fromHere } from '../common/GlobalImports';
import { id_here, id_editing, ids_grabbed, id_toolsGrab } from '../managers/State';

//////////////////////////////////////
//									//
//	 		handle key events		//
//	 and compound CRUD operations	//
//									//
//////////////////////////////////////

export default class GraphEditor {
	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy }

	async handleKeyDown(event: KeyboardEvent) {
		const h = this.hierarchy;
		let idGrab = h.grabs.latestPath(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const idRoot = h.idRoot;
			if (!idGrab && idRoot) {
				root.becomeHere();
				h.grabs.grabOnly(idRoot);		// update crumbs and dots
				idGrab = idRoot;
			}
			if (k.allowGraphEditing) {
				if (idGrab && k.allowTitleEditing) {
					switch (key) {
						case 'd':		await this.thing_edit_remoteDuplicate(idGrab); break;
						case ' ':		await this.thing_edit_remoteAddChildTo(idGrab); break;
						case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(idGrab); } break;
						case 'tab':		await this.thing_edit_remoteAddChildTo(idGrab.firstParent); break; // Title editor also makes this call
						case 'enter':	idGrab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await h.things_redraw_remoteTraverseDelete(h.things_getForIDs(get(ids_grabbed))); break;
				}
			}
			if (idGrab) {
				switch (key) {
					case '/':			idGrab.becomeHere(); break;
					case 'arrowright':	await this.widget_redraw_remoteMoveRight(idGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.widget_redraw_remoteMoveRight(idGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				h.root?.becomeHere(); break;
				case '`':               event.preventDefault(); this.latestPath_toggleToolsCluster(); break;
				case 'arrowup':			await this.latestPath_redraw_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPath_redraw_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
		}
	}

	//////////////////
	//		ADD		//
	//////////////////

	async thing_edit_remoteAddChildTo(parent: Thing) {
		const child = await this.hierarchy.thing_remember_runtimeCopy(parent.baseID, parent);
		parent.expand();
		await this.thing_edit_remoteAddAsChild(child, parent);
	}

	async thing_edit_remoteDuplicate(thing: Thing) {
		const h = this.hierarchy;
		const sibling = await h.thing_remember_runtimeCopy(thing.baseID, thing);
		const parent = thing.firstParent ?? h.root;
		this.thing_edit_remoteAddAsChild(sibling, parent);
	}

	async thing_edit_remoteAddLine(thing: Thing, below: boolean = true) {
		const parent = thing.firstParent;
		const order = thing.order + (below ? 0.5 : -0.5);
		const child = this.hierarchy.thing_runtimeCreate(thing.baseID, null, k.lineTitle, parent.color, '', order, false);
		await this.thing_edit_remoteAddAsChild(child, parent, false);
	}

	async thing_edit_remoteAddAsChild(child: Thing, parent: Thing, startEdit: boolean = true) {
		await parent.thing_remember_remoteAddAsChild(child);
		parent.expand();
		signal_rebuild_fromHere();
		child.grabOnly();
		if (startEdit) {
			setTimeout(() => {
				child.startEdit();
			}, 200);
		}
	}

	async thing_edit_remoteInsertParent(child: Thing) {
		const parent = child.firstParent;
		const newParent = await this.hierarchy.thing_remember_runtimeCopy(child.baseID, child);
		parent.expand();
		await parent.thing_remember_remoteAddAsChild(newParent);
		await this.hierarchy.thing_remember_remoteRelocateChild(child, parent, newParent);
		newParent.expand();
		signal_rebuild_fromHere();
		newParent.grabOnly();
		setTimeout(() => {
			newParent.startEdit();
		}, 200);
	}

	////////////////////
	//		MOVE	  //
	////////////////////

	async widget_redraw_remoteMoveRight(widget: Widget, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = widget.thing;
			if (thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await thing.redraw_bulkFetchAll_runtimeBrowseRight();
				} else {
					thing.redraw_runtimeBrowseRight(RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (k.allowGraphEditing) {
			await this.widget_redraw_remoteRelocateRight(widget, RIGHT, EXTREME);
		}
	}

	async widget_redraw_remoteRelocateRight(widget: Widget, RIGHT: boolean, EXTREME: boolean) {
		const thing = widget.thing;
		const newParent = RIGHT ? thing?.nextSibling(false) : thing?.grandparent;
		if (newParent && thing) {
			const h = this.hierarchy;
			const parent = thing.firstParent;
			const relationship = h.relationship_getWhereIDEqualsTo(thing.id);
			const changingBulk = thing.thing_isInDifferentBulkThan(newParent);
			if (changingBulk) {		// test if should move across bulks
				h.thing_remember_bulk_remoteRelocateRight(thing, newParent);
			} else {
				// alter the 'to' in ALL [?] the matching 'from' relationships
				// simpler than adjusting children or parents arrays
				// TODO: also match against the 'to' to the current parent
				// TODO: pass predicate in ... to support editing different kinds of relationships

				if (relationship) {
					const order = RIGHT ? parent.order : 0;
					relationship.idFrom = newParent.id;
					await thing.order_setTo(order + 0.5, false);
				}

				h.relationships_refreshKnowns();		// so children and parent will see the newly relocated things
				h.root?.order_normalizeRecursive_remoteMaybe(true);
				thing.grabOnly();
				newParent.expand();
				if (!newParent.isVisible) {
					newParent.becomeHere();
				}
			}
			signal_rebuild_fromHere();					// so Children component will update
		}
	}

	latestPath_toggleToolsCluster() {
		const path = this.hierarchy.grabs.latestPath(true);
		if (path) {
			const clear = path == get(id_toolsGrab);
			id_toolsGrab.set(clear ? null : path);
			signal_rebuild_fromHere();
		}
	}

	async latestPath_redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const path = this.hierarchy.grabs.latestPath(up); // use thing_get for ancest
		this.redraw_remoteMoveUp(path, up, SHIFT, OPTION, EXTREME);
	}

	redraw_remoteMoveUp(path: string | null, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const thing = this.hierarchy.thing_getForPath(path);
		const parent = this.hierarchy.thing_getForPath(path, -2);
		const siblings = parent?.children;
		if (!siblings || siblings.length == 0) {
			this.redraw_runtimeBrowseRight(path, true, EXTREME, up);
		} else if (thing) {
			const index = siblings.indexOf(thing);
			const newIndex = index.increment(!up, siblings.length);
			if (!OPTION) {
				const newGrab = siblings[newIndex];
				if (SHIFT) {
					newGrab?.toggleGrab()
				} else {
					newGrab?.grabOnly();
				}
			} else if (k.allowGraphEditing) {
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				const order = this.order;
				this.order_setTo(newOrder, true);
				parent.order_normalizeRecursive_remoteMaybe(true);
				signal_relayout_fromHere();
			}
		}
	}

	redraw_runtimeBrowseRight(path: string | null, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const by = RIGHT ? 1 : 3;
		const thing = this.hierarchy.thing_getForPath(path);
		if (thing && path) {
			const parentPath = stripPath(path, by);
			const childPath = appendPath(path, thing.firstChild);
			const newHere = parentPath;
			let newGrab: string | null | undefined = RIGHT ? childPath : parentPath;
			const newGrabIsNotHere = get(id_here) != newGrab;
			if (!RIGHT) {
				const root = this.hierarchy.root;
				if (EXTREME) {
					root?.becomeHere();	// tells graph to update line rects
				} else {
					if (!SHIFT) {
						if (fromReveal) {
							thing.expand();
						} else if (newGrabIsNotHere && newGrab && !newGrab.isExpanded) {
							newGrab?.expand();
						}
					} else if (newGrab) { 
						if (thing.isExpanded) {
							thing.collapse();
							newGrab = null;
						} else if (newGrab == root) {
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
				thing.expand();
			} else {
				return;
			}
			id_editing.set(null);
			newGrab?.grabOnly();
			const allowToBecomeHere = (!SHIFT || newGrab == this.firstParent) && newGrabIsNotHere; 
			const shouldBecomeHere = !newHere.isVisible || newHere.isRoot;
			if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
				newHere.becomeHere();
			}
		}
	}

}

export const graphEditor = new GraphEditor();