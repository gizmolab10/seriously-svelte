import S_Persistence from '../../state/S_Persistence';
import Identifiable from '../runtime/Identifiable';
import { w_hierarchy } from '../../state/S_Stores';
import { T_Persistable } from '../dbs/DBCommon';
import { T_Debug } from '../../debug/Debug';
import { get } from 'svelte/store';

export default class Persistable extends Identifiable {
	t_persistable: T_Persistable;
	persistence!: S_Persistence;
	idBase: string;

	constructor(t_database: string, idBase: string, t_persistable: T_Persistable, id: string, already_persisted: boolean = false) {
		super(id);
		this.persistence = new S_Persistence(t_database, t_persistable, id, already_persisted, false);
		this.t_persistable = t_persistable;
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
