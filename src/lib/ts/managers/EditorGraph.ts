import { get, Thing, Datum, signal, Signals, constants, Predicate, dbDispatch, CreationFlag, normalizeOrderOf, Hierarchy } from '../common/GlobalImports';
import { idsGrabbed } from './State';

//////////////////////////////////////
//									//
//	 		handle key events		//
//	 and compound CRUD operations	//
//									//
//////////////////////////////////////

export default class EditorGraph {
	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy }

	async handleKeyDown(event: KeyboardEvent) {
		const h = this.hierarchy;
		let grab = h.grabs.furthestGrab(true);
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
			if (constants.allowGraphEditing) {
				if (grab && constants.allowTitleEditing) {
					switch (key) {
						case '-':			await this.thing_redraw_remoteAddLine(grab); break;
						case 'd':			await this.thing_redraw_remoteDuplicate(grab); break;
						case ' ':			await this.thing_redraw_remoteAddChildTo(grab); break;
						case 'tab':			await this.thing_redraw_remoteAddChildTo(grab.firstParent); break; // Title editor also makes this call
						case 'enter':		grab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':		await this.grabs_redraw_remoteDelete(); break;
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
				case 'arrowup':			await this.furthestGrab_redraw_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.furthestGrab_redraw_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
		}
	}

	//////////////////
	//		ADD		//
	//////////////////

	async thing_redraw_remoteAddChildTo(parent: Thing) {
		const child = this.hierarchy.rememberThing_runtimeCreateAt(-1, parent.color);
		parent.expand();
		await this.thing_redraw_remoteAddAsChild(child, parent);
	}

	async thing_redraw_remoteDuplicate(thing: Thing) {
		const h = this.hierarchy;
		const sibling = h.rememberThing_runtimeCreateAt(thing.order + constants.orderIncrement, thing.color);
		const parent = thing.firstParent ?? h.root;
		sibling.title = thing.title;
		await this.thing_redraw_remoteAddAsChild(sibling, parent);
	}

	async thing_redraw_remoteAddLine(thing: Thing, below: boolean = true) {
		const parent = thing.firstParent;
		const order = thing.order + (below ? 0.5 : -0.5);
		const child = this.hierarchy.rememberThing_runtimeCreate(Datum.newID, constants.lineTitle, parent.color, '', order, false);
		parent.expand();
		await this.thing_redraw_remoteAddAsChild(child, parent, false);
	}

	async thing_redraw_remoteAddAsChild(child: Thing, parent: Thing, startEdit: boolean = true) {
		this.hierarchy.thing_remoteAddAsChild(child, parent);
		if (startEdit) {
			child.startEdit();
		}
		child.grabOnly();
		signal(Signals.childrenOf);
	}

	////////////////////
	//		MOVE	  //
	////////////////////

	async thing_redraw_remoteMoveRight(thing: Thing, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		if (!OPTION) {
			if (thing.needsBulkFetch) {
				await thing.redraw_fetchAll_browseRight();
			} else {
				thing.redraw_browseRight(RIGHT, SHIFT, EXTREME);
			}
		} else if (constants.allowGraphEditing) {
			await this.thing_redraw_remoteRelocateRight(thing, RIGHT, EXTREME);
		}
	}

	async thing_redraw_remoteRelocateRight(thing: Thing, RIGHT: boolean, EXTREME: boolean) {
		const newParent = RIGHT ? thing.nextSibling(false) : thing.grandparent;
		if (newParent) {
			const parent = thing.firstParent;

			// alter the 'to' in ALL [?] the matching 'from' relationships
			// simpler than adjusting children or parents arrays
			// TODO: also match against the 'to' to the current parent
			// TODO: pass predicate in ... to support editing different kinds of relationships
			//
			// TODO: detect if relocating from one db to another, and then
			// TODO: delete thing and add it to the destination's thing's collection

			const h = this.hierarchy;
			const relationship = h.getRelationship_whereIDEqualsTo(thing.id);
			if (relationship) {
				relationship.idFrom = newParent.id;
				thing.setOrderTo(parent.order + 0.5, true);
				await dbDispatch.db.relationship_remoteUpdate(relationship);
			}

			h.relationships_refreshKnowns();		// so children and parent will see the newly relocated things
			normalizeOrderOf(newParent.children);						// refresh knowns first
			normalizeOrderOf(parent.children);
			thing.grabOnly();
			newParent.expand();
			if (!newParent.isVisible) {
				newParent.becomeHere();
			}
			signal(Signals.childrenOf);					// so Children component will update
		}
	}

	async furthestGrab_redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const grab = this.hierarchy.grabs.furthestGrab(up);
		grab?.redraw_remoteMoveup(up, SHIFT, OPTION, EXTREME);
	}

	//////////////////////
	//		DELETE		//
	//////////////////////

	async grabs_redraw_remoteDelete() {
		const h = this.hierarchy;
		if (h.here) {
			for (const id of get(idsGrabbed)) {
				const grabbed = h.getThing_forID(id);
				if (grabbed && !grabbed.isEditing) {
					let newGrab = grabbed.firstParent;
					const siblings = grabbed.siblings;
					const grandparent = grabbed.grandparent;
					let index = siblings.indexOf(grabbed);
					siblings.splice(index, 1);
					if (siblings.length > 0) {
						if (index >= siblings.length) {
							index = siblings.length - 1;
						}
						newGrab = siblings[index];
						normalizeOrderOf(grabbed.siblings);
					} else if (!grandparent.isVisible) {
						grandparent.becomeHere();
					}
					await grabbed.traverse(async (child: Thing): Promise<boolean> => {
						await h.forgetRelationships_remoteDeleteAllForThing(child);
						await h.forgetThing_remoteDelete(child);
						return false; // continue the traversal
					});
					newGrab.grabOnly();
				}
			}
			signal(Signals.childrenOf);
		}
	}

}

export const editorGraph = new EditorGraph();