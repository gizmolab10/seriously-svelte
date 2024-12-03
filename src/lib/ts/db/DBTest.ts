import { k, Thing, Trait, ThingType, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import DBCommon from './DBCommon';
import { get } from 'svelte/store';

export default class DBTest extends DBCommon {
	baseID = k.baseID_test;
	hierarchy!: Hierarchy;
	isPersistent = false;
	dbType = DBType.test;
	hasData = false;
	loadTime = null;

	setHasData(flag: boolean) { this.hasData = flag; }

	async fetch_all() {
		const idTr = 'R';
		const idTa = 'A';
		const idTb = 'B';
		const idTc = 'C';
		const idTd = 'D';
		const idTe = 'E';
		const idTf = 'F';
		const idPr = 'related';
		const idPc = 'contains';
		const h = get(s_hierarchy);
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false, false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'isRelated', true, false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTa, 'Active', 'red', 'a');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTb, 'Maintain', 'blue', 'b');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTc, 'Curiosity', '#d96726', 'c');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTd, 'Autonomy', 'purple', 'd');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTe, 'Aesthetics', 'mediumvioletred', 'e');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTf, 'Connections', 'coral', 'f');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTr, 'Life', 'limegreen', ThingType.root);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cra', idPc, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crb', idPc, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crc', idPc, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crd', idPc, idTr, idTd, 3);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cre', idPc, idTr, idTe, 4);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cab', idPc, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cac', idPc, idTa, idTc, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cad', idPc, idTa, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cae', idPc, idTa, idTe, 3);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbc', idPc, idTb, idTc, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbd', idPc, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbe', idPc, idTb, idTe, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbf', idPc, idTb, idTf, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Ccd', idPc, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cce', idPc, idTc, idTe, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cde', idPc, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rrb', idPr, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rbd', idPr, idTb, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rac', idPr, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rce', idPr, idTc, idTe, 2);
		this.makeMore(20, 'G', idPc, idTb, true);	// contained by B
		this.makeMore(5, 'G', idPc, idTb, false);	// containing B
		this.makeMore(5, 'G', idPr, idTb, false);	// related to B
	};

	makeMore(count: number, first: string, idPredicate: string, idOther: string, asChild: boolean) {
		for (let i = 0; i < count; i++) {
			const h = get(s_hierarchy);
			const code = first.charCodeAt(0) + i;
			const idUpper = String.fromCharCode(code);
			const type = String.fromCharCode(code + 32);
			const predicate = h.predicate_forID(idPredicate);
			const isBidirectional = predicate?.isBidirectional ?? false;
			const idThing = asChild ? idOther + idUpper : idUpper + idOther;
			const title = asChild ? idUpper : idThing;
			const prefix = isBidirectional ? 'R' : 'C';
			const idRelationahip = prefix + idThing;
			const idChild = asChild ? idThing : idOther;
			const idParent = asChild ? idOther : idThing;
			h.thing_remember_runtimeCreateUnique(this.baseID, idThing, title, 'red', type);
			h.relationship_remember_runtimeCreateUnique(this.baseID, idRelationahip, idPredicate, idParent, idChild, 1);
			if (asChild || isBidirectional) {	// needs to be child of root
				const idParentRelationship = 'CR' + idUpper;
				h.relationship_remember_runtimeCreateUnique(this.baseID, idParentRelationship, Predicate.idContains, h.root.id, idThing, 1);
			}
		}
	}

	queryStrings_apply() {}
	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async fetch_hierarchy_from(baseID: string) {}
	async trait_remember_persistentCreate(trait: Trait) {}
	async thing_remember_persistentCreate(thing: Thing) {}
	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship | null) {};
	async crudAction_onThing(crudAction: string, thing: Thing) {};
	async crudAction_onTrait(crudAction: string, trait: Trait) {};
	async crudAction_onRelationship(crudAction: string, relationship: Relationship) {};
}

export const dbTest = new DBTest();