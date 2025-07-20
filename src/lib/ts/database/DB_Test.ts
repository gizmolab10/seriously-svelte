import { h, k, T_Thing, T_Trait, Predicate, T_Predicate } from '../common/Global_Imports';
import { T_Persistence } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Test extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.test;
	idBase = k.id_base.test;
	
	get details_forStorage(): Object { return ['data', 'recreated on launch'] }

	async fetch_all_fromLocal() {
		const idTa = 'a';
		const idTb = 'b';
		const idTc = 'c';
		const idTd = 'd';
		const idTe = 'e';
		const idTf = 'f';
		const idTr = 'r';
		const kindC = T_Predicate.contains;
		const kindR = T_Predicate.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Active', 'green');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Brilliant', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Curious', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Diligent', 'mediumvioletred');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Excellent', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTf, 'Friendly', 'coral');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTr, 'Life', 'limegreen', T_Thing.root);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cra', kindC, idTr, idTa, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crb', kindC, idTr, idTb, [1, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crc', kindC, idTr, idTc, [2, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cab', kindC, idTa, idTb, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cac', kindC, idTa, idTc, [1, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cad', kindC, idTa, idTd, [2, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cae', kindC, idTa, idTe, [3, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbc', kindC, idTb, idTc, [0, 2]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbd', kindC, idTb, idTd, [1, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbe', kindC, idTb, idTe, [2, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbf', kindC, idTd, idTf, [3, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'ccd', kindC, idTc, idTd, [0, 2]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cce', kindC, idTc, idTe, [1, 2]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cef', kindC, idTe, idTf, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rrb', kindR, idTr, idTb, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rbd', kindR, idTb, idTd, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rac', kindR, idTa, idTc, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'raf', kindR, idTa, idTf, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rce', kindR, idTc, idTe, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cfd', kindC, idTd, idTe, [0, 3]);
		h.trait_remember_runtimeCreateUnique(this.idBase, 'ttc', idTc, T_Trait.text, 'Carrumba Tinga!', {});
		h.trait_remember_runtimeCreateUnique(this.idBase, 'tlb', idTb, T_Trait.link, 'http://www.webseriously.org', {});
		h.trait_remember_runtimeCreateUnique(this.idBase, 'ttb', idTb, T_Trait.text, 'What a brilliant idea you have!', {});
		h.tag_remember_runtimeCreateUnique_byType(this.idBase, 'Fruity', [idTd.hash(), idTc.hash()]);
		h.tag_remember_runtimeCreateUnique_byType(this.idBase, 'Moody', [idTf.hash(), idTd.hash(), idTb.hash()]);
		h.tag_remember_runtimeCreateUnique_byType(this.idBase, 'Study', [idTc.hash(), idTe.hash()]);
		// this.makeMore(3, 'c', kindC, idTf, true);	// children of Friendly
		this.makeMore(2, 'g', kindC, idTb, true, 4);	// children of Brilliant
		this.makeMore(4, 'e', kindR, idTb, true, 2);	// related to  "
		// this.makeMore(2, 'c', kindC, idTb, false);	// parents of  "
	}

	makeMore(count: number, first: string, kind: T_Predicate, idRef: string, asChild: boolean, order: number = 0) {
		const isBidirectional = Predicate.isBidirectional_for(kind);
		const prefix = isBidirectional ? 'r' : 'c';
		const charCode = first.charCodeAt(0);
		for (let i = 0; i < count; i++) {
			const idCode = String.fromCharCode(charCode + i);
			const id_thing = asChild ? idRef + idCode : idCode + idRef;
			const title = asChild ? idCode : id_thing;
			const idParent = asChild ? idRef : idCode;
			const idChild = asChild ? idCode : idRef;
			const idRelationahip = prefix + id_thing;
			h.thing_remember_runtimeCreateUnique(this.idBase, idCode, title, 'grey');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kind, idParent, idChild, [i + order, 0]);
		}
	}

}
