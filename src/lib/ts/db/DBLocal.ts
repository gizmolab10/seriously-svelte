import { k, Thing, TypeDB, IDTrait, Hierarchy, Relationship } from '../common/GlobalImports';
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
		const idPc = 'contains';
		const idPr = 'related';
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'isRelated', false, 2);
		h.thing_remember_runtimeCreateUnique(k.empty, idTa, 'anyone', 'red', '1', false);
		h.thing_remember_runtimeCreateUnique(k.empty, idTc, 'calamity', 'blue', '3', false);
		h.thing_remember_runtimeCreateUnique(k.empty, idTd, 'doorknob', 'green', 'a', false);
		h.thing_remember_runtimeCreateUnique(k.empty, idTe, 'excellent', 'orchid', 'a', false);
		h.thing_remember_runtimeCreateUnique(k.empty, idTb, 'boistrous', 'darkred', '2', false);
		h.thing_remember_runtimeCreateUnique(k.empty, idTr, 'rutabegga', 'orange', IDTrait.root, false);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cra', idPc, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Crb', idPc, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Crc', idPc, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cab', idPc, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cad', idPc, idTa, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cae', idPc, idTa, idTe, 2);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cbc', idPc, idTb, idTc, 1);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cbd', idPc, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Ccd', idPc, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Cde', idPc, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Rrb', idPr, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Rac', idPr, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(k.empty, 'Rbe', idPr, idTb, idTe, 2);
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