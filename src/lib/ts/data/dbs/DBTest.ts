import { k, T_Thing, Predicate, T_Predicate } from '../../common/Global_Imports';
import type { Dictionary } from '../../../ts/common/Types';
import { T_Database, T_Persistence } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBTest extends DBCommon {
	kind_persistence = T_Persistence.none;
	idBase = k.idBase_test;
	t_database = T_Database.test;
	
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
		const kindC = T_Predicate.contains;
		const kindR = T_Predicate.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Active', 'green');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Big', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Curiosity', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Diligent', 'mediumvioletred');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Energy', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTf, 'Friends', 'coral');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTr, 'Life', 'limegreen', T_Thing.root);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cra', kindC, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crb', kindC, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crc', kindC, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crd', kindC, idTr, idTd, 3);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cre', kindC, idTr, idTe, 4);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cab', kindC, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cac', kindC, idTa, idTc, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cad', kindC, idTa, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cae', kindC, idTa, idTe, 3);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbc', kindC, idTb, idTc, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbd', kindC, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbe', kindC, idTb, idTe, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbf', kindC, idTb, idTf, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'ccd', kindC, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cce', kindC, idTc, idTe, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cde', kindC, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rrb', kindR, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rbd', kindR, idTb, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rac', kindR, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rce', kindR, idTc, idTe, 2);
		this.makeMore(3, 'c', kindC, idTf, true);	// children of Friends
		// this.makeMore(2, 'e', kindC, idTb, true);	// children of Big
		// this.makeMore(4, 'e', kindR, idTb, true);	// related to  "
		// this.makeMore(2, 'c', kindC, idTb, false);	// parents of  "
	}

	makeMore(count: number, first: string, kindPredicate: T_Predicate, idRef: string, asChild: boolean) {
		const isBidirectional = Predicate.isBidirectional(kindPredicate);
		const prefix = isBidirectional ? 'r' : 'c';
		const charCode = first.charCodeAt(0);
		const h = this.hierarchy;
		for (let i = 0; i < count; i++) {
			const idCode = String.fromCharCode(charCode + i);
			const id_thing = asChild ? idRef + idCode : idCode + idRef;
			const title = asChild ? idCode : id_thing;
			const idRelationahip = prefix + id_thing;
			const idChild = asChild ? idCode : idRef;
			const idParent = asChild ? idRef : idCode;
			// h.thing_remember_runtimeCreateUnique(this.idBase, id_thing, title, 'grey');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kindPredicate, idParent, idChild, i);
		}
	}

}

export const dbTest = new DBTest();