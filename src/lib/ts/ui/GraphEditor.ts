import { k, get, Thing, signals, Hierarchy, dbDispatch } from '../common/GlobalImports';
import { paths_grabbed, path_toolsGrab } from '../managers/State';

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
		let pathGrab = h.grabs.latestPathGrabbed(true);
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
					case 'arrowright':	await pathGrab.path_redraw_remoteMoveRight(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await pathGrab.path_redraw_remoteMoveRight(false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				h.rootPath?.becomeHere(); break;
				case '`':               event.preventDefault(); this.latestPathGrabbed_toggleToolsCluster(); break;
				case 'arrowup':			await this.latestPathGrabbed_redraw_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPathGrabbed_redraw_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
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
		signals.signal_rebuild_fromHere();
		newParent.grabOnly();
		setTimeout(() => {
			newParent.startEdit();
		}, 200);
	}

	////////////////////
	//		MOVE	  //
	////////////////////

	async latestPathGrabbed_redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const path = this.hierarchy.grabs.latestPathGrabbed(up); // use thing_get for ancest
		path?.redraw_remoteMoveUp(up, SHIFT, OPTION, EXTREME);
	}

	async widget_redraw_remoteRelocateRight(RIGHT: boolean, EXTREME: boolean) {
		const h = this.hierarchy;
		const pathGrab = h.grabs.latestPathGrabbed(true);
		const thing = pathGrab?.thing();
		const newParentPath = RIGHT ? pathGrab?.nextSiblingPath(false) : pathGrab?.thing(2);
		const newParent = newParentPath?.thing();
		if (thing && pathGrab && newParent) {
			const parent = pathGrab.parent;
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
				pathGrab.grabOnly();
				newParent.expand();
				if (!newParent.isVisible) {
					newParent.becomeHere();
				}
			}
			signals.signal_rebuild_fromHere();					// so Children component will update
		}
	}

	latestPathGrabbed_toggleToolsCluster() {
		const path = this.hierarchy.grabs.latestPathGrabbed(true);
		if (path) {
			path_toolsGrab.set(path.toolsGrabbed ? null : path);
			signals.signal_rebuild_fromHere();
		}
	}

}

export const graphEditor = new GraphEditor();