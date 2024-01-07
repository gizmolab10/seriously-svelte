import { get, debug, Thing, DebugFlag, dbDispatch, AlteringParent, signal_rebuild_fromHere } from '../common/GlobalImports';
import { ids_grabbed, id_toolsGrab, altering_parent } from '../managers/State'
import Airtable from 'airtable';
import Datum from './Datum';

export default class Relationship extends Datum {
	idTo: string;
	idFrom: string;
	db_type: string;
	idPredicate: string;
	toThing: Thing | null;
	fromThing: Thing | null;
	isGrabbed = false;
	order: number;

	constructor(baseID: string, id: string | null, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.idTo = idTo; // idTo is child
		this.idFrom = idFrom; // idFrom is parent
		this.idPredicate = idPredicate;
		this.db_type = dbDispatch.db.db_type;
		this.toThing = dbDispatch.db.hierarchy.thing_getForID(idTo);
		this.fromThing = dbDispatch.db.hierarchy.thing_getForID(idFrom);
		this.order = order;

		ids_grabbed.subscribe((idsGrab: string[]) => {
			const isGrabbed = idsGrab.includes(this.id);
			if (this.isGrabbed != isGrabbed) {
				this.isGrabbed  = isGrabbed;
			}
		});
	}

	get siblingRelationships(): Array<Relationship> { return this.toThing?.parentRelationships ?? []; }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '	+ dbDispatch.db.hierarchy.thing_getForID(this.idFrom)?.description + ' => ' + dbDispatch.db.hierarchy.thing_getForID(this.idTo)?.description; }
	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	grabOnly()	 { this.hierarchy.grabs.grabOnly(this); }
	toggleGrab() { this.hierarchy.grabs.toggleGrab(this); }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	ancestors(thresholdWidth: number): Array<Relationship> {
		let parent: Relationship | undefined = this;
		let totalWidth = 0;
		const array = [];
		while (parent) {
			totalWidth += parent.toThing?.titleWidth ?? 0;
			if (totalWidth > thresholdWidth) {
				break;
			}
			array.push(parent);
			parent = parent.fromThing?.parentRelationships[0];
		}
		array.reverse();
		return array;
	}

	async parent_alterMaybe() {
		const thing = this.toThing;
		const alteration = get(altering_parent);
		if (thing) {
			const other = thing.canAlterParentOf_toolsGrab;
			if (other) {
				altering_parent.set(null);
				id_toolsGrab.set(null);
				switch (alteration) {
					case AlteringParent.deleting: await other.parent_forget_remoteRemove(thing); break;
					case AlteringParent.adding: await thing.thing_remember_remoteAddAsChild(other); break;
				}
				signal_rebuild_fromHere();
			}
		}
	}

	clicked_dragDot(shiftKey: boolean) {
		if (this.toThing && !this.toThing.isExemplar) {
			if (get(altering_parent)) {
				this.parent_alterMaybe();
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
			}
		}
	}

	async order_setTo(newOrder: number, remoteWrite: boolean) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			const thing = dbDispatch.db.hierarchy.thing_getForID(this.idTo);
			await thing?.order_setTo(newOrder, remoteWrite);
		}
	}

	async remoteWrite() {
		if (!this.awaitingCreation) {
			if (this.isRemotelyStored) {
				await dbDispatch.db.relationship_remoteUpdate(this);
			} else {
				await dbDispatch.db.relationship_remember_remoteCreate(this);
			}
		}
	}

}