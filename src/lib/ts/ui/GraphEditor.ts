import { k, get, Path, Thing, Widget, Hierarchy, dbDispatch, signal_rebuild_fromHere, signal_relayout_fromHere } from '../common/GlobalImports';
import { path_here, path_editing, paths_grabbed, path_toolsGrab } from '../managers/State';

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
		let pathGrab = h.grabs.latestPath(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const rootPath = h.rootPath;
			if (!pathGrab && rootPath) {
				rootPath.becomeHere();
				h.grabs.grabOnly(rootPath);		// update crumbs and dots
				pathGrab = rootPath;
			}
			if (k.allowGraphEditing) {
				if (pathGrab && k.allowTitleEditing) {
					switch (key) {
						case 'd':		await pathGrab.thing_edit_remoteDuplicate(); break;
						case ' ':		await this.thing_edit_remoteAddChildTo(pathGrab); break;
						case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(pathGrab); } break;
						case 'tab':		await this.thing_edit_remoteAddChildTo(pathGrab.firstParent); break; // Title editor also makes this call
						case 'enter':	pathGrab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await h.things_redraw_remoteTraverseDelete(h.things_getForIDs(get(paths_grabbed))); break;
				}
			}
			if (pathGrab) {
				switch (key) {
					case '/':			pathGrab.becomeHere(); break;
					case 'arrowright':	await this.widget_redraw_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.widget_redraw_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				h.rootPath?.becomeHere(); break;
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
		await parent.thing_edit_remoteAddAsChild(child);
	}

	async thing_edit_remoteAddLine(thing: Thing, below: boolean = true) {
		const parent = thing.firstParent;
		const order = thing.order + (below ? 0.5 : -0.5);
		const child = this.hierarchy.thing_runtimeCreate(thing.baseID, null, k.lineTitle, parent.color, '', order, false);
		await parent.thing_edit_remoteAddAsChild(child, false);
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

	async latestPath_redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const path = this.hierarchy.grabs.latestPath(up); // use thing_get for ancest
		path?.redraw_remoteMoveUp(up, SHIFT, OPTION, EXTREME);
	}

	async widget_redraw_remoteMoveRight(widget: Widget, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = widget.thing;
			if (thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await thing.redraw_bulkFetchAll_runtimeBrowseRight();
				} else {
					widget.path.redraw_runtimeBrowseRight(RIGHT, SHIFT, EXTREME, fromReveal);
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
			const clear = path == get(path_toolsGrab);
			path_toolsGrab.set(clear ? null : path);
			signal_rebuild_fromHere();
		}
	}

}

export const graphEditor = new GraphEditor();