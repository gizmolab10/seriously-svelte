import { k, Thing, IDTrait, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import DBInterface from './DBInterface';
import { DBType } from './DBInterface';
import { h } from '../db/DBDispatch';

export default class DBLocal implements DBInterface {
	baseID = k.baseID_local;
	dbType = DBType.local;
	hierarchy!: Hierarchy;
	isRemote = false;
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
		const idPq = 'question';
		const idPo = 'option';
		const idPn = 'consequence';
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false, false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'isRelated', true, false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTa, 'Active', 'red', 'a', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTb, 'Maintain', 'blue', 'b', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTc, 'Curiosity', '#d96726', 'c', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTd, 'Autonomy', 'purple', 'd', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTe, 'Aesthetics', 'mediumvioletred', 'e', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTf, 'Connections', 'coral', 'f', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTr, 'Life', 'limegreen', IDTrait.root, false);
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
			const code = first.charCodeAt(0) + i;
			const idUpper = String.fromCharCode(code);
			const trait = String.fromCharCode(code + 32);
			const predicate = h.predicate_forID(idPredicate);
			const isBidirectional = predicate?.isBidirectional ?? false;
			const idThing = asChild ? idOther + idUpper : idUpper + idOther;
			const title = asChild ? idUpper : idThing;
			const prefix = isBidirectional ? 'R' : 'C';
			const idRelationahip = prefix + idThing;
			const idChild = asChild ? idThing : idOther;
			const idParent = asChild ? idOther : idThing;
			h.thing_remember_runtimeCreateUnique(this.baseID, idThing, title, 'red', trait, false);
			h.relationship_remember_runtimeCreateUnique(this.baseID, idRelationahip, idPredicate, idParent, idChild, 1);
			if (asChild || isBidirectional) {	// needs to be child of root
				const idParentRelationship = 'CR' + idUpper;
				h.relationship_remember_runtimeCreateUnique(this.baseID, idParentRelationship, Predicate.idContains, h.root.id, idThing, 1);
			}
		}
	}

	queryStrings_apply() {}
	async fetch_allFrom(baseID: string) {}
	async thing_remoteUpdate(thing: Thing) {}
	async thing_remoteDelete(thing: Thing) {}
	async thing_remember_remoteCreate(thing: Thing) {}
	async relationship_remoteUpdate(relationship: Relationship) {}
	async relationship_remoteDelete(relationship: Relationship) {}
	async relationship_remember_remoteCreate(relationship: Relationship | null) {}
}

export const dbLocal = new DBLocal();