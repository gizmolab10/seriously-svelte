import { T_Persistable } from '../common/Enumerations';
import S_Persistence from '../state/S_Persistence';
import Identifiable from '../runtime/Identifiable';
import { debug, T_Debug } from '../debug/Debug';
import { w_hierarchy } from '../common/Stores';
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
	log(option: T_Debug, message: string) { debug.log_maybe(option, message); }
	isInDifferentBulkThan(other: Persistable) { return this.idBase != other.idBase; }

	async persist() {
		await this.persistence.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

	static get t_persistables(): Array<T_Persistable> {
		return [T_Persistable.things,
			T_Persistable.traits,
			T_Persistable.predicates,
			T_Persistable.relationships,
			T_Persistable.tags]; }

}
