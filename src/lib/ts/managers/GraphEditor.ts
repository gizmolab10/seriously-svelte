import { k, get, Thing, Hierarchy, dbDispatch, signalRelayout } from '../common/GlobalImports';
import { ids_grabbed, id_showRevealCluster } from './State';

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
		let grab = h.grabs.latestGrab(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			if (!grab) {
				const root = h.root;
				root?.becomeHere();
				root?.grabOnly(); // to update crumbs and dots
				grab = root;
			}
			if (k.allowGraphEditing) {
				if (grab && k.allowTitleEditing) {
					switch (key) {
						case '-':		await this.thing_edit_remoteAddLine(grab); break;
						case 'd':		await this.thing_edit_remoteDuplicate(grab); break;
						case ' ':		await this.thing_edit_remoteAddChildTo(grab); break;
						case 'tab':		await this.thing_edit_remoteAddChildTo(grab.firstParent); break; // Title editor also makes this call
						case 'enter':	grab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await h.things_redraw_remoteTraverseDelete(h.things_getForIDs(get(ids_grabbed))); break;
				}
			}
			if (grab) {
				switch (key) {
					case 'arrowright':	await this.thing_redraw_remoteMoveRight(grab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	await this.thing_redraw_remoteMoveRight(grab, false, SHIFT, OPTION, EXTREME); break;
					case '/':			grab.becomeHere(); break;
				}
			}
			switch (key) {
				case '`':               event.preventDefault(); this.latestGrabToggleRevealCluster(); break;
				case '!':				dbDispatch.db.hierarchy.root?.becomeHere(); break;
				case 'arrowup':			await this.latestGrab_redraw_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestGrab_redraw_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
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
		await this.hierarchy.thing_remember_remoteAddAsChild(child, parent);
		signalRelayout();
		parent.expand();
		child.grabOnly();
		if (startEdit) {
			setTimeout(() => {
				child.startEdit();
			}, 200);
		}
	}

	////////////////////
	//		MOVE	  //
	////////////////////

	async thing_redraw_remoteMoveRight(thing: Thing, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			if (RIGHT && thing.needsBulkFetch) {
				await thing.redraw_bulkFetchAll_runtimeBrowseRight();
			} else {
				thing.redraw_runtimeBrowseRight(RIGHT, SHIFT, EXTREME, fromReveal);
			}
		} else if (k.allowGraphEditing) {
			await this.thing_redraw_remoteRelocateRight(thing, RIGHT, EXTREME);
		}
	}

	async thing_redraw_remoteRelocateRight(thing: Thing, RIGHT: boolean, EXTREME: boolean) {
		const newParent = RIGHT ? thing.nextSibling(false) : thing.grandparent;
		if (newParent) {
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
				h.root?.order_normalizeRecursive(true);
				thing.grabOnly();
				newParent.expand();
				if (!newParent.isVisible) {
					newParent.becomeHere();
				}
			}
			signalRelayout();					// so Children component will update
		}
	}

	latestGrabToggleRevealCluster() {
		const id = this.hierarchy.grabs.latestGrab(true)?.id;
		if (id) {
			const clear = id == get(id_showRevealCluster);
			id_showRevealCluster.set(clear ? null : id);
		}

	}

	async latestGrab_redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const grab = this.hierarchy.grabs.latestGrab(up);
		grab?.redraw_remoteMoveup(up, SHIFT, OPTION, EXTREME);
	}

}

export const graphEditor = new GraphEditor();