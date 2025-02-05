import S_Persistence from '../../state/S_Persistence';
import { w_hierarchy } from '../../state/S_Stores';
import { T_Debug } from '../../common/Debug';
import Identifiable from './Identifiable';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';

export default class Persistable extends Identifiable {
	persistence!: S_Persistence;
	type_datum: T_Datum;
	idBase: string;

	constructor(t_database: string, idBase: string, type_datum: T_Datum, id: string, already_persisted: boolean = false) {
		super(id);
		this.persistence = new S_Persistence(t_database, type_datum, id, already_persisted, false);
		this.type_datum = type_datum;
		this.idBase = idBase;
		get(w_hierarchy).signal_storage_redraw();
	}

	async persistent_create_orUpdate(already_persisted: boolean) {}
	set_isDirty() { this.persistence.isDirty = true; }		// TODO: set global
	log(option: T_Debug, message: string) {}
	isInDifferentBulkThan(other: Persistable) { return this.idBase != other.idBase; }

	async persist() {
		await this.persistence.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

}
