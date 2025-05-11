import { E_Persistable } from '../database/DBCommon';
import S_Persistence from '../state/S_Persistence';
import Identifiable from '../runtime/Identifiable';
import { w_hierarchy } from '../common/Stores';
import { E_Debug } from '../debug/Debug';
import { get } from 'svelte/store';

export default class Persistable extends Identifiable {
	e_persistable: E_Persistable;
	persistence!: S_Persistence;
	idBase: string;

	constructor(e_database: string, idBase: string, e_persistable: E_Persistable, id: string, already_persisted: boolean = false) {
		super(id);
		this.persistence = new S_Persistence(e_database, e_persistable, id, already_persisted, false);
		this.e_persistable = e_persistable;
		this.idBase = idBase;
		get(w_hierarchy).signal_storage_redraw();
	}

	async persistent_create_orUpdate(already_persisted: boolean) {}
	set_isDirty() { this.persistence.isDirty = true; }		// TODO: set global
	log(option: E_Debug, message: string) {}
	isInDifferentBulkThan(other: Persistable) { return this.idBase != other.idBase; }

	async persist() {
		await this.persistence.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

}
