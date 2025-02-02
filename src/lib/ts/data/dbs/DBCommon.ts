import { g, k, u, Trait, Thing, T_Thing, Hierarchy, Predicate, Relationship } from '../../common/Global_Imports';
import { debug, signals, T_Startup, p, T_Preference } from '../../common/Global_Imports';
import Persistent_Identifiable from '../basis/Persistent_Identifiable';
import { w_hierarchy, w_t_startup } from '../../state/S_Stores';
import type { Dictionary } from '../../common/Types';

export enum T_Persistence {
	remote = 'remote',
	local  = 'local',
	none   = 'none',
}

export enum T_Database {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	plugin	 = 'plugin',
	local	 = 'local',
	test	 = 'test',
}

export enum T_Datum {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	hierarchy	  = 'Hierarchy',	// includes parent contains and relateds
	progeny		  = 'Progeny',		// only child contains
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
}

export default class DBCommon {
	kind_persistence!: T_Persistence;
	loadTime: string | null = null;
	hierarchy!: Hierarchy;
	t_database = k.empty;
	idBase = k.empty;
	
	queryStrings_apply() {}
	setup_remote_handlers() {}
	get dict_forStorageDetails(): Dictionary { return {'fetch took' : this.loadTime} }
	get isRemote(): boolean { return this.kind_persistence == T_Persistence.remote; }
	get isPersistent(): boolean { return this.kind_persistence != T_Persistence.none; }
	async hierarchy_fetchForID(idBase: string) {}	// support for browsing multiple firebase bulks
	
	async fetch_all() { this.fetch_all_fromLocal(); }
	async remove_all() { this.remove_all_fromLocal(); }
	remove_all_fromLocal() { if (this.isPersistent) { p.writeDB_key(T_Preference.local, null); } }
	persist_all_toLocal() { if (this.isPersistent) { p.writeDB_key(T_Preference.local, u.stringify_object(this.hierarchy.all_data)); } }

	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async thing_remember_persistentCreate(thing: Thing) {}

	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async trait_remember_persistentCreate(trait: Trait) {}

	async predicate_persistentUpdate(predicate: Predicate) {}
	async predicate_persistentDelete(predicate: Predicate) {}
	async predicate_remember_persistentCreate(predicate: Predicate) {}

	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship) {}

	async persist_all(force: boolean = false) {
		if (this.isRemote) {
			const h = this.hierarchy;
			await this.persist_maybe_all_identifiables(force, h.things);
			await this.persist_maybe_all_identifiables(force, h.traits);
			await this.persist_maybe_all_identifiables(force, h.predicates);
			await this.persist_maybe_all_identifiables(force, h.relationships);
		}
		this.persist_all_toLocal();
	}

	async persist_maybe_all_identifiables(force: boolean = false, identifiables: Array<Persistent_Identifiable>) {
		for (const identifiable of identifiables) {
			if (identifiable.persistence.isDirty || force) {
				await identifiable.persist();
				identifiable.persistence.isDirty = false;
			}
		}
	}

	async fetch_all_fromLocal() {
		const json = p.readDB_key(T_Preference.local);
		const h = this.hierarchy;
		if (!!json) {
			await h.extract_fromDict(JSON.parse(json) as Dictionary);
		} else if (!this.isRemote) {
			h.predicate_defaults_remember_runtimeCreate();
			h.thing_remember_runtimeCreateUnique(this.idBase, Thing.newID(), 'click here to edit this title', 'limegreen', T_Thing.root);
		}
	}
	
	async hierarchy_setup_fetch_andBuild() {
		this.queryStrings_apply();
		const h = this.hierarchy ?? new Hierarchy(this);
		this.hierarchy = h;
		w_hierarchy.set(h);
		if (h.hasRoot) {
			h.restore_fromPersistLocal();
		} else {
			w_t_startup.set(T_Startup.fetch);
			await this.hierarchy_create_fastLoad_or_fetch_andBuild();
		}
		setTimeout( () => {
			w_t_startup.set(T_Startup.ready);
			signals.signal_rebuildGraph_fromFocus();
		}, 1);
	}
	
	async hierarchy_create_fastLoad_or_fetch_andBuild() {
		const h = this.hierarchy;
		if (g.eraseDB > 0) {
			g.eraseDB -= 1;
			await this.remove_all();	// start fresh
		}
		h.forget_all();
		if (debug.fast_load) {
			await this.fetch_all_fromLocal();	// needs to set needs save && adjust ids during save
			if (h.hasRoot) {
				if (!this.isRemote) {
					await h.wrapUp_data_forUX();
				} else {
					this.setup_remote_handlers();
					await this.persist_all();
				}
				return;
			}
		}
		const startTime = new Date().getTime();
		this.loadTime = null;
		await this.fetch_all();
		await h.wrapUp_data_forUX();
		// await this.persist_all();
		this.set_loadTime_from(startTime);
	}
	
	set_loadTime_from(startTime: number | null = null) {
		if (startTime != null) {
			const duration = (new Date().getTime()) - startTime;
			const adjusted = Math.trunc(duration / 100) / 10;
			const isInteger = adjusted == Math.trunc(adjusted);
			const places = isInteger ? 0 : 1;
			const suffix = isInteger ? '' : 's';
			const time = (duration / 1000).toFixed(places);
			if (time != '0') {
				const loadTime = `${time} second${suffix}`
				this.loadTime = loadTime;
				return;
			}
		}
		this.loadTime = null;
	}

}
