import { k, E_Thing, Predicate, E_Predicate } from '../common/Global_Imports';
import { E_Database, E_Persistence } from './DBCommon';
import type { Dictionary } from '../common/Types';
import DBCommon from './DBCommon';

export default class DBTest extends DBCommon {
	kind_persistence = E_Persistence.none;
	e_database = E_Database.test;
	idBase = k.id_base.test;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'recreated on launch'} }

	async fetch_all_fromLocal() {
		const idTa = 'a';
		const idTb = 'b';
		const idTc = 'c';
		const idTd = 'd';
		const idTe = 'e';
		const idTf = 'f';
		const idTr = 'r';
		const h = this.hierarchy;
		const kindC = E_Predicate.contains;
		const kindR = E_Predicate.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Active', 'green');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Big', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Curiosity', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Diligent', 'mediumvioletred');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Energy', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTf, 'Friends', 'coral');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTr, 'Life', 'limegreen', E_Thing.root);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cra', kindC, idTr, idTa, 0, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crb', kindC, idTr, idTb, 1, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crc', kindC, idTr, idTc, 2, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cab', kindC, idTa, idTb, 0, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cac', kindC, idTa, idTc, 1, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cad', kindC, idTa, idTd, 2, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cae', kindC, idTa, idTe, 3, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbc', kindC, idTb, idTc, 0, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbd', kindC, idTb, idTd, 1, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbe', kindC, idTb, idTe, 2, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbf', kindC, idTb, idTf, 3, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'ccd', kindC, idTc, idTd, 0, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cce', kindC, idTc, idTe, 1, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cef', kindC, idTe, idTf, 0, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cfd', kindC, idTf, idTd, 0, 3);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rrb', kindR, idTr, idTb, 0, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rbd', kindR, idTb, idTd, 0, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rac', kindR, idTa, idTc, 0, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'raf', kindR, idTa, idTf, 0, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rce', kindR, idTc, idTe, 0, 1);
		// this.makeMore(3, 'c', kindC, idTf, true);	// children of Friends
		this.makeMore(2, 'g', kindC, idTb, true, 4);	// children of Big
		this.makeMore(4, 'e', kindR, idTb, true, 2);	// related to  "
		// this.makeMore(2, 'c', kindC, idTb, false);	// parents of  "
	}

	makeMore(count: number, first: string, kind: E_Predicate, idRef: string, asChild: boolean, order: number = 0) {
		const isBidirectional = Predicate.isBidirectional(kind);
		const prefix = isBidirectional ? 'r' : 'c';
		const charCode = first.charCodeAt(0);
		const h = this.hierarchy;
		for (let i = 0; i < count; i++) {
			const idCode = String.fromCharCode(charCode + i);
			const id_thing = asChild ? idRef + idCode : idCode + idRef;
			const title = asChild ? idCode : id_thing;
			const idParent = asChild ? idRef : idCode;
			const idChild = asChild ? idCode : idRef;
			const idRelationahip = prefix + id_thing;
			h.thing_remember_runtimeCreateUnique(this.idBase, idCode, title, 'grey');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kind, idParent, idChild, i + order, 0);
		}
	}

}

export const dbTest = new DBTest();