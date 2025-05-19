import { Trait, Thing, Hierarchy, Predicate, Relationship, Persistable } from '../common/Global_Imports';
import { T_Thing, T_Startup, T_Preference } from '../common/Global_Imports';
import { c, p, debug, layout, databases } from '../common/Global_Imports';
import { T_Persistence, T_Persistable } from '../common/Global_Imports';
import { w_hierarchy, w_t_startup } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { k } from '../common/Constants';

export enum T_Database {
	airtable = 'airtable',
	firebase = 'firebase',
	plugin	 = 'plugin',
	local	 = 'local',
	test	 = 'test',
}

export default class DBCommon {
	t_persistence = T_Persistence.none;
	loadTime: string | null = null;
	hierarchy!: Hierarchy;
	t_database = k.empty;
	idBase = k.empty;
	
	queryStrings_apply() {}
	setup_remote_handlers() {}
	get displayName(): string { return this.t_database; }
	get isRemote(): boolean { return this.t_persistence == T_Persistence.remote; }
	get isPersistent(): boolean { return this.t_persistence != T_Persistence.none; }
	get dict_forStorageDetails(): Dictionary { return {'fetch took' : this.loadTime} }
	async hierarchy_fetch_forID(idBase: string) {}	// support for browsing multiple firebase bulks
	
	async fetch_all() { this.fetch_all_fromLocal(); }
	async remove_all() { this.remove_all_fromLocal(); }

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
	
	remove_all_fromLocal() {
		if (this.isPersistent) {
			for (const t_persistable of Persistable.t_persistables) {
				p.writeDB_key(t_persistable, null);
			}
		}
	}

	async persist_all(force: boolean = false) {
		if (!databases.defer_persistence) {
			for (const t_persistable of Persistable.t_persistables) {
				await this.persistAll_identifiables_maybe(t_persistable, force);
			}
		}
	}

	async persistAll_identifiables_maybe(t_persistable: T_Persistable, force: boolean = false) {
		const h = this.hierarchy;
		const identifiables = h.persistables_forKey(t_persistable);
		if (this.isRemote) {
			for (const identifiable of identifiables) {
				if (identifiable.persistence.isDirty || force) {
					await identifiable.persist();
					identifiable.persistence.isDirty = false;
				}
			}
		} else if (this.isPersistent && t_persistable != T_Persistable.traits) {
			p.writeDB_key(t_persistable, identifiables);
		}
	}

	fetch_all_fromLocal() {
		const h = this.hierarchy;
		for (const t_persistable of Persistable.t_persistables) {
			const array = p.readDB_key(t_persistable) as Array<Dictionary>;
			if (!!array) {
				for (const dict of array) {
					h.extract_objects_ofType_fromDict(t_persistable, dict);
				}
			} else if (!this.isRemote) {			// no such preference, create empty hierarchy
				switch (t_persistable) {
					case T_Persistable.predicates:
						h.predicate_defaults_remember_runtimeCreate();
						break;
					case T_Persistable.things:
						h.thing_remember_runtimeCreateUnique(this.idBase, Thing.newID(), 'click here to edit this title', 'limegreen', T_Thing.root);
						break;
				}
			}
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
			w_t_startup.set(T_Startup.fetch);
			await this.hierarchy_create_fastLoad_or_fetch_andBuild();
		}
		setTimeout( () => {
			w_t_startup.set(T_Startup.ready);
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
