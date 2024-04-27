import { Thing, IDTrait, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';
import { DBType } from './DBInterface';
import { h } from '../db/DBDispatch';

export default class DBLocal implements DBInterface {
	baseID = 'handcrafted';
	dbType = DBType.local;
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
		const idPr = 'related';
		const idPc = 'contains';
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'isRelated', false, 2);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTa, 'Arkane', 'red', 'a', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTb, 'Butress', 'blue', 'b', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTc, 'Claustrophobia', 'green', 'c', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTd, 'Dictionary', 'purple', 'f', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTe, 'Essential', 'mediumvioletred', 'e', false);
		h.thing_remember_runtimeCreateUnique(this.baseID, idTr, 'Routine', 'limegreen', IDTrait.root, false);
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
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Ccd', idPc, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cce', idPc, idTc, idTe, 1);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Cde', idPc, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rrb', idPr, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rac', idPr, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rbd', idPr, idTb, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.baseID, 'Rce', idPr, idTc, idTe, 2);
	};

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