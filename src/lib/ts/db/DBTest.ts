import { k, Thing, Trait, ThingType, Relationship, PredicateKind } from '../common/Global_Imports';
import { DBType } from '../basis/Persistent_Identifiable';
import DBCommon from './DBCommon';

export default class DBTest extends DBCommon {
	baseID = k.baseID_test;
	dbType = DBType.test;

	async fetch_all_fromLocal() {
		const idTa = 'A';
		const idTb = 'B';
		const idTc = 'C';
		const idTd = 'D';
		const idTe = 'E';
		const idTf = 'F';
		const idTr = 'R';
		const h = this.hierarchy;
		const kindC = PredicateKind.contains;
		const kindR = PredicateKind.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.baseID, idTa, 'Active', 'red', 'a');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTb, 'Maintain', 'blue', 'b');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTc, 'Curiosity', '#d96726', 'c');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTd, 'Autonomy', 'purple', 'd');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTe, 'Aesthetics', 'mediumvioletred', 'e');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTf, 'Connections', 'coral', 'f');
		h.thing_remember_runtimeCreateUnique(this.baseID, idTr, 'Life', 'limegreen', ThingType.root);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cra', kindC, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crb', kindC, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crc', kindC, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Crd', kindC, idTr, idTd, 3);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cre', kindC, idTr, idTe, 4);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cab', kindC, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cac', kindC, idTa, idTc, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cad', kindC, idTa, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cae', kindC, idTa, idTe, 3);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbc', kindC, idTb, idTc, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbd', kindC, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbe', kindC, idTb, idTe, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cbf', kindC, idTb, idTf, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Ccd', kindC, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cce', kindC, idTc, idTe, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cde', kindC, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rrb', kindR, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rbd', kindR, idTb, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rac', kindR, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rce', kindR, idTc, idTe, 2);
		this.makeMore(20, 'G', kindC, idTb, true);	// contained by B
		this.makeMore(5, 'G', kindC, idTb, false);	// containing B
		this.makeMore(5, 'G', kindR, idTb, false);	// related to B
	}

	makeMore(count: number, first: string, kindPredicate: string, idOther: string, asChild: boolean) {
		for (let i = 0; i < count; i++) {
			const h = this.hierarchy;
			const code = first.charCodeAt(0) + i;
			const idUpper = String.fromCharCode(code);
			const type = String.fromCharCode(code + 32);
			const predicate = h.predicate_forKind(kindPredicate);
			const isBidirectional = predicate?.isBidirectional ?? false;
			const idThing = asChild ? idOther + idUpper : idUpper + idOther;
			const title = asChild ? idUpper : idThing;
			const prefix = isBidirectional ? 'R' : 'C';
			const idRelationahip = prefix + idThing;
			const idChild = asChild ? idThing : idOther;
			const idParent = asChild ? idOther : idThing;
			h.thing_remember_runtimeCreateUnique(this.baseID, idThing, title, 'red', type);
			h.relationship_remember_runtimeCreateUnique(this.baseID, idRelationahip, kindPredicate, idParent, idChild, 1);
			if (asChild || isBidirectional) {	// needs to be child of root
				const idParentRelationship = 'CR' + idUpper;
				h.relationship_remember_runtimeCreateUnique(this.baseID, idParentRelationship, PredicateKind.contains, h.root.id, idThing, 1);
			}
		}
	}

	async thing_remember_persistentCreate(thing: Thing) { this.hierarchy.thing_remember(thing); }
	async trait_remember_persistentCreate(trait: Trait) { this.hierarchy.trait_remember(trait); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.hierarchy.relationship_remember_ifValid(relationship); }

}

export const dbTest = new DBTest();