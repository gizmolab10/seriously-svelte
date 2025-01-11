import { g, k, u, Trait, Thing, ThingType, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { debug, signals, Startup_State, persistLocal, IDPersistent } from '../common/Global_Imports';
import { s_hierarchy, s_db_loadTime, s_startup_state } from '../state/Svelte_Stores';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';
import type { Dictionary } from '../common/Types';

export default class DBCommon {
	loadTime: string | null = null;
	idPersistence!: IDPersistent;
	hierarchy!: Hierarchy;
	isPersistent = false;
	baseID = k.empty;
	dbType = k.empty;
	isRemote = false;
	
	queryStrings_apply() {}
	setup_remote_handlers() {}
	async hierarchy_fetchForID(baseID: string) {}	// support for browsing multiple firebase bulks
	
	async fetch_all() { this.fetch_all_fromLocal(); }
	async remove_all() { this.remove_all_fromLocal(); }
	remove_all_fromLocal() { if (this.isPersistent) { persistLocal.writeDB_key(IDPersistent.local, null); } }
	persist_all_toLocal() { if (this.isPersistent) { persistLocal.writeDB_key(IDPersistent.local, u.stringify_object(this.hierarchy.all_data)); } }

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

	async persist_all() {
		if (this.isRemote) {
			const h = this.hierarchy;
			await this.persist_all_identifiables(h.things);
			await this.persist_all_identifiables(h.traits);
			await this.persist_all_identifiables(h.predicates);
			await this.persist_all_identifiables(h.relationships);
		}
		this.persist_all_toLocal();
	}

	async persist_all_identifiables(identifiables: Array<PersistentIdentifiable>) {
		for (const identifiable of identifiables) {
			if (identifiable.isDirty) {
				identifiable.isDirty = false;
				await identifiable.persist();
			}
		}
	}

	async fetch_all_fromLocal() {
		const json = persistLocal.readDB_key(IDPersistent.local);
		const h = this.hierarchy;
		if (!!json) {
			await h.extractFromDict(JSON.parse(json) as Dictionary);
		} else if (!this.isRemote) {
			h.predicate_defaults_remember_runtimeCreate();
			h.thing_remember_runtimeCreateUnique(this.baseID, Thing.newID(), 'click here to edit this title', 'limegreen', ThingType.root);
		}
	}
	
	async hierarchy_setup_fetch_andBuild() {
		this.queryStrings_apply();
		const h = this.hierarchy ?? new Hierarchy(this);
		this.hierarchy = h;
		s_hierarchy.set(h);
		if (h.hasRoot) {
			h.reset();
		} else {
			s_startup_state.set(Startup_State.fetch);
			await this.hierarchy_create_fetch_andBuild();
		}
		setTimeout( () => {
			s_startup_state.set(Startup_State.ready);
			signals.signal_rebuildGraph_fromFocus();
		}, 1);
	}
	
	async hierarchy_create_fetch_andBuild() {
		const h = this.hierarchy;
		if (g.eraseDB) {
			g.eraseDB = false;			// only apply on launch
			await this.remove_all();	// start fresh
		}
		h.forget_all();
		if (debug.fast_load) {
			await this.fetch_all_fromLocal();	// needs to set needs save && adjust ids during save
			if (h.hasRoot) {
				if (!this.isRemote) {
					await h.cleanup();
				} else {
					this.setup_remote_handlers();
					await this.persist_all();
				}
				return;
			}
		}
		const startTime = new Date().getTime();
		s_db_loadTime.set(null);
		await this.fetch_all();
		await h.cleanup();
		// await this.persist_all();
		this.set_loadTime_from(startTime);
	}
	
	set_loadTime_from(startTime: number) {
		const duration = (new Date().getTime()) - startTime;
		const adjusted = Math.trunc(duration / 100) / 10;
		const isInteger = adjusted == Math.trunc(adjusted);
		const places = isInteger ? 0 : 1;
		const suffix = isInteger ? '' : 's';
		const time = (duration / 1000).toFixed(places);
		const loadTime = `${time} second${suffix}`
		this.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

}
