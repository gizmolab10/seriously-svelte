import { get, Thing, Datum, signal, Signals, constants, Predicate, dbDispatch, CreationFlag, normalizeOrderOf } from '../common/GlobalImports';
import { idsGrabbed } from './State';

//////////////////////////////////////
//									//
//	 		handle key events		//
//	 and compound CRUD operations	//
//									//
//////////////////////////////////////

export default class Editor {

	async handleKeyDown(event: KeyboardEvent) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		if (event.type == 'keydown') {
			const RELOCATE = event.altKey;
			const GENERATIONAL = event.shiftKey;
			const EXTREME = GENERATIONAL && RELOCATE;
			if (grab) {
				switch (event.key.toLowerCase()) {
					case 'delete':
					case ' ':			await this.thing_redraw_remoteAddChildTo(grab); break;
					case 'd':			await this.thing_redraw_remoteDuplicate(grab); break;
					case 'tab':			await this.thing_redraw_remoteAddChildTo(grab.firstParent); break; // Title also makes this call
					case 'arrowright':	await this.thing_redraw_remoteMoveRight(grab, true, GENERATIONAL, RELOCATE, EXTREME); break;
					case 'arrowleft':	await this.thing_redraw_remoteMoveRight(grab, false, GENERATIONAL, RELOCATE, EXTREME); break;
				}
			}
			switch (event.key.toLowerCase()) {
				case 'backspace':	await this.grabs_redraw_remoteDelete(); break;
				case 'arrowup':		await this.furthestGrab_redraw_remoteMoveUp(true, GENERATIONAL, RELOCATE, EXTREME); break;
				case 'arrowdown':	await this.furthestGrab_redraw_remoteMoveUp(false, GENERATIONAL, RELOCATE, EXTREME); break;
			}
		}
	}

	//////////////////
	//		ADD		//
	//////////////////

	async thing_redraw_remoteAddChildTo(parent: Thing) {
		const child = dbDispatch.db.hierarchy.rememberThing_runtimeCreateAt(-1);
		await this.thing_redraw_remoteAddAsChild(child, parent);
	}

	async thing_redraw_remoteDuplicate(thing: Thing) {
		const sibling = dbDispatch.db.hierarchy.rememberThing_runtimeCreateAt(thing.order + constants.orderIncrement);
		const parent = thing.firstParent ?? dbDispatch.db.hierarchy.root;
		thing.copyInto(sibling);
		sibling.order += constants.orderIncrement
		await this.thing_redraw_remoteAddAsChild(sibling, parent);
	}

	async thing_redraw_remoteAddAsChild(child: Thing, parent: Thing) {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const idRelationship = Datum.newID;
		await dbDispatch.db.thing_remoteCreate(child); // for everything below, need to await child.id fetched from dbDispatch
		dbDispatch.db.hierarchy.rememberThing(child);
		const relationship = await dbDispatch.db.hierarchy.rememberRelationship_remoteCreate(idRelationship, idPredicateIsAParentOf, parent.id, child.id, child.order, CreationFlag.getRemoteID)
		normalizeOrderOf(parent.children);
		parent.becomeHere();
		child.startEdit();
		child.grabOnly();
		await relationship.remoteWrite();
	}

	////////////////////
	//		MOVE	  //
	////////////////////

	async thing_redraw_remoteMoveRight(thing: Thing, right: boolean, generational: boolean, relocate: boolean, extreme: boolean) {
		if (relocate) {
			await this.thing_redraw_remoteRelocateRight(thing, right, extreme);
		} else {
			thing.redraw_browseRight(right, generational, extreme);
		}
	}

	async thing_redraw_remoteRelocateRight(thing: Thing, right: boolean, extreme: boolean) {
		const newParent = right ? thing.nextSibling(false) : thing.grandparent;
		if (newParent) {
			const parent = thing.firstParent;

			// alter the 'to' in ALL [?] the matching 'from' relationships
			// simpler than adjusting children or parents arrays
			// TODO: also match against the 'to' to the current parent
			// TODO: pass predicate in ... to support editing different kinds of relationships

			const relationship = dbDispatch.db.hierarchy.getRelationship_whereIDEqualsTo(thing.id);
			if (relationship) {
				relationship.idFrom = newParent.id;
				await dbDispatch.db.relationship_remoteUpdate(relationship);
				thing.setOrderTo(-1, true);
			}

			dbDispatch.db.hierarchy.relationships_refreshKnowns();		// so children and parent will see the newly relocated things
			normalizeOrderOf(newParent.children);						// refresh knowns first
			normalizeOrderOf(parent.children);
			thing.grabOnly();
			newParent.becomeHere();
			signal(Signals.childrenOf, newParent.id);					// so Children component will update
		}
	}

	async furthestGrab_redraw_remoteMoveUp(up: boolean, expand: boolean, relocate: boolean, extreme: boolean) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(up);
		grab?.redraw_remoteMoveup(up, expand, relocate, extreme);
	}

	//////////////////////
	//		DELETE		//
	//////////////////////

	async grabs_redraw_remoteDelete() {
		if (dbDispatch.db.hierarchy.here) {
			for (const id of get(idsGrabbed)) {
				const grabbed = dbDispatch.db.hierarchy.getThing_forID(id);
				if (grabbed && !grabbed.isEditing) {
					let newGrab = grabbed.firstParent;
					const siblings = grabbed.siblings;
					let index = siblings.indexOf(grabbed);
					siblings.splice(index, 1);
					if (siblings.length == 0) {
						grabbed.grandparent.becomeHere();
					} else {
						if (index >= siblings.length) {
							index = siblings.length - 1;
						}
						newGrab = siblings[index];
						normalizeOrderOf(grabbed.siblings);
					}
					await grabbed.traverse(async (child: Thing): Promise<boolean> => {
						await dbDispatch.db.hierarchy.forgetRelationships_remoteDeleteAllForThing(child);
						await dbDispatch.db.hierarchy.forgetThing_remoteDelete(child);
						return false; // continue the traversal
					});
					newGrab.grabOnly();
					signal(Signals.childrenOf, newGrab.firstParent.id); 
				}
			}
		}
	}

}

export const editor = new Editor();