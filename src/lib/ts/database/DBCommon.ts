import { Trait, Thing, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { c, p, u, debug, layout, databases } from '../common/Global_Imports';
import { E_Thing, E_Startup, E_Preference } from '../common/Global_Imports';
import { w_hierarchy, w_e_startup } from '../common/Stores';
import Persistable from '../persistable/Persistable';
import type { Dictionary } from '../common/Types';
import { k } from '../common/Constants';

export enum E_Persistence {
	remote = 'remote',
	local  = 'local',
	none   = 'none',
}

export enum E_Database {
	airtable = 'airtable',
	firebase = 'firebase',
	plugin	 = 'plugin',
	local	 = 'local',
	test	 = 'test',
}

export enum E_Persistable {
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
	loadTime: string | null = null;
	e_persistence!: E_Persistence;
	hierarchy!: Hierarchy;
	e_database = k.empty;
	idBase = k.empty;
	
	queryStrings_apply() {}
	setup_remote_handlers() {}
	get displayName(): string { return this.e_database; }
	get dict_forStorageDetails(): Dictionary { return {'fetch took' : this.loadTime} }
	get isRemote(): boolean { return this.e_persistence == E_Persistence.remote; }
	get isPersistent(): boolean { return this.e_persistence != E_Persistence.none; }
	async hierarchy_fetch_forID(idBase: string) {}	// support for browsing multiple firebase bulks
	
	async fetch_all() { this.fetch_all_fromLocal(); }
	async remove_all() { this.remove_all_fromLocal(); }
	remove_all_fromLocal() { if (this.isPersistent) { p.writeDB_key(E_Preference.local, null); } }
	persist_all_toLocal() { if (this.isPersistent) { p.writeDB_key(E_Preference.local, u.stringify_object(this.hierarchy.all_data)); } }

	async thing_persistentUpdate(thing: Thing) { this.persist_all(); }
	async thing_persistentDelete(thing: Thing) { this.persist_all(); }
	async thing_remember_persistentCreate(thing: Thing) { this.hierarchy.thing_remember(thing); this.persist_all(); }

	async trait_persistentUpdate(trait: Trait) { this.persist_all(); }
	async trait_persistentDelete(trait: Trait) { this.persist_all(); }
	async trait_remember_persistentCreate(trait: Trait) { this.hierarchy.trait_remember(trait); this.persist_all(); }
	
	async predicate_persistentUpdate(predicate: Predicate) { this.persist_all(); }
	async predicate_persistentDelete(predicate: Predicate) { this.persist_all(); }
	async predicate_remember_persistentCreate(predicate: Predicate) { this.hierarchy.predicate_remember(predicate); this.persist_all(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.persist_all(); }
	async relationship_persistentDelete(relationship: Relationship) { this.persist_all(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.hierarchy.relationship_remember_ifValid(relationship); this.persist_all(); }

	async persist_all(force: boolean = false) {
		if (this.isRemote) {
			const h = this.hierarchy;
			await this.persist_maybe_all_identifiables(force, h.things);
			await this.persist_maybe_all_identifiables(force, h.traits);
			await this.persist_maybe_all_identifiables(force, h.predicates);
			await this.persist_maybe_all_identifiables(force, h.relationships);
		}
		if (!databases.defer_persistence) {
			this.persist_all_toLocal();
		}
	}

	async persist_maybe_all_identifiables(force: boolean = false, identifiables: Array<Persistable>) {
		for (const identifiable of identifiables) {
			if (identifiable.persistence.isDirty || force) {
				await identifiable.persist();
				identifiable.persistence.isDirty = false;
			}
		}
	}

	async fetch_all_fromLocal() {
		const json = p.readDB_key(E_Preference.local);
		const h = this.hierarchy;
		if (!!json) {
			await h.extract_fromDict(JSON.parse(json) as Dictionary);
		} else if (!this.isRemote) {
			h.predicate_defaults_remember_runtimeCreate();
			h.thing_remember_runtimeCreateUnique(this.idBase, Thing.newID(), 'click here to edit this title', 'limegreen', E_Thing.root);
		}
	}
	
	async hierarchy_setup_fetch_andBuild() {
		this.queryStrings_apply();
		const h = this.hierarchy ?? new Hierarchy(this);
		this.hierarchy = h;
		w_hierarchy.set(h);
		if (h.hasRoot) {
			h.restore_fromPreferences();
		} else {
			w_e_startup.set(E_Startup.fetch);
			await this.hierarchy_create_fastLoad_or_fetch_andBuild();
		}
		setTimeout( () => {
			w_e_startup.set(E_Startup.ready);
			layout.grand_build();
		}, 1);
	}
	
	async hierarchy_create_fastLoad_or_fetch_andBuild() {
		const h = this.hierarchy;
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
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
			const suffix = (isInteger && (adjusted != 1)) ? '' : 's';
			const places = isInteger ? 0 : 1;
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
