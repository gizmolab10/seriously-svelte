import { Thing, TypeDB, IDTrait, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class DBLocal implements DBInterface {
	_hierarchy: Hierarchy | null = null;
	baseID = 'handcrafted';
	dbType = TypeDB.local;
	hasData = false;
	loadTime = null;

	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
	}

	setHasData(flag: boolean) { this.hasData = flag; }

	async fetch_all() {
		const h = this.hierarchy;
		const idTa = 'A';
		const idTb = 'B';
		const idTc = 'C';
		const idTd = 'D';
		const idTe = 'E';
		const idTr = 'Root';
		const idPc = 'Pc';
		const idPr = 'Pr';
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'isRelated', false, 2);
		h.thing_remember_runtimeCreateUnique('', idTa, 'first', 'red', '1', false);
		h.thing_remember_runtimeCreateUnique('', idTc, 'third', 'blue', '3', false);
		h.thing_remember_runtimeCreateUnique('', idTd, 'fourth', 'green', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idTe, 'fifth', 'orchid', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idTb, 'second', 'darkred', '2', false);
		h.thing_remember_runtimeCreateUnique('', idTr, 'zeroth', 'orange', IDTrait.root, false);
		h.relationship_remember_runtimeCreateUnique('', 'Ra', idPc, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique('', 'Rb', idPc, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique('', 'Rc', idPc, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique('', 'Rd', idPc, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique('', 'Re', idPc, idTa, idTd, 1);
		h.relationship_remember_runtimeCreateUnique('', 'Rf', idPc, idTa, idTe, 2);
		h.relationship_remember_runtimeCreateUnique('', 'Rg', idPc, idTb, idTc, 1);
		h.relationship_remember_runtimeCreateUnique('', 'Rh', idPc, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique('', 'Ri', idPc, idTe, idTd, 0);
		h.relationship_remember_runtimeCreateUnique('', 'Rj', idPc, idTe, idTb, 1);
		h.relationship_remember_runtimeCreateUnique('', 'Rk', idPc, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique('', 'Rl', idPr, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique('', 'Rm', idPr, idTc, idTa, 2);
		h.relationship_remember_runtimeCreateUnique('', 'Rn', idPr, idTd, idTa, 2);
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