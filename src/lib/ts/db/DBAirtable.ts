import { DebugFlag, Hierarchy, Relationship, CreationOptions } from '../common/Global_Imports';
import { g, k, u, debug, Thing, Trait, TraitType } from '../common/Global_Imports';
import { DBType, DatumType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import DBCommon from './DBCommon';
import { get } from 'svelte/store';
import Airtable from 'airtable';

//////////////////////////////
//							//
//		users				//
//		things				//
//		access				//
//		predicates			//
//		relationships		//
//							//
//////////////////////////////

export default class DBAirtable extends DBCommon {
	personalAccessToken = 'patGTiWbebGZTw0fh.dd17a194aea98f9e4e918d333babde7bcd39903b4179b139ac8866a5f3cfe5b6';
	baseCatalist = new Airtable({ apiKey: this.personalAccessToken }).base('apphGUCbYIEJLvRrR');
	basePublic = new Airtable({ apiKey: this.personalAccessToken }).base('appq1IjzmiRdlZi3H');
	base = this.basePublic;
	relationships_table = this.base(DatumType.relationships);
	predicates_table = this.base(DatumType.predicates);
	things_table = this.base(DatumType.things);
	traits_table = this.base(DatumType.traits);
	access_table = this.base(DatumType.access);
	users_table = this.base(DatumType.users);
	dbType = DBType.airtable;
	hierarchy!: Hierarchy;
	baseID = k.empty;
	isPersistent = true;
	hasData = false;
	loadTime = null;

	relationships_errorMessage = 'Error in Relationships:';
	setHasData(flag: boolean) { this.hasData = flag; }
	async fetch_hierarchy_from(baseID: string) {}
	things_errorMessage = 'Error in Things:';
	traits_errorMessage = 'Error in Traits:';

	queryStrings_apply() {
		const string = g.queryStrings.get('name') ?? g.queryStrings.get('dbid');
		if (!!string) {
			const names = string.split(k.comma);
			if (names.length > 1) {
				const tableID = names[0]
				this.personalAccessToken = names[1];
				this.base = new Airtable({ apiKey: this.personalAccessToken }).base(tableID);
				this.relationships_table = this.base(DatumType.relationships);
				this.predicates_table = this.base(DatumType.predicates);
				this.things_table = this.base(DatumType.things);
				this.access_table = this.base(DatumType.access);
				this.users_table = this.base(DatumType.users);
			}
		}
	}

	async fetch_all() {
		await this.things_readAll();
		await this.traits_readAll();
		await this.predicates_readAll();
		await this.relationships_readAll();
		await this.access_readAll();
		await this.users_readAll();
	}

	async crudAction_onThing(crudAction: string, thing: Thing) {};
	async crudAction_onTrait(crudAction: string, trait: Trait) {};
	async crudAction_onRelationship(crudAction: string, relationship: Relationship) {};

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	async things_readAll() {
		get(s_hierarchy).things_forgetAll(); // clear

		try {
			const select = this.things_table.select();
			await select.all().then((records) => {
				const remoteThings = records;
				for (const remoteThing of remoteThings) {
					const id = remoteThing.id;
					const fields = remoteThing.fields;
					get(s_hierarchy).thing_remember_runtimeCreate(k.empty, id, fields.title as string, fields.color as string, (fields.type as string) ?? fields.trait as string, true, !fields.type);
				}
			})
		} catch (error) {
			debug.log_error(this.things_errorMessage + ' (things_readAll) ' + error);
		}
	}

	static readonly $_THING_$: unique symbol;
	
	async thing_remember_persistentCreate(thing: Thing) {
		try {
			const fields = await this.things_table.create(thing.fields);
			const id = fields['id'];		// need id for update, delete and things_byHID (to get parent from relationship)
			thing.setID(id);
			thing.already_persisted = true;		// was saved by create, above
			get(s_hierarchy).thing_remember(thing);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	async thing_persistentUpdate(thing: Thing) {
		try {
			await this.things_table.update(thing.id, thing.fields);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	async thing_persistentDelete(thing: Thing) {
		try {
			await this.things_table.destroy(thing.id);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	static readonly $_TRAIT_$: unique symbol;

	//////////////////////////////
	//			TRAITS			//
	//////////////////////////////

	async traits_readAll() {
		get(s_hierarchy).traits_forgetAll();
		try {
			const records = await this.traits_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const text = record.fields.text as string;
				const type = record.fields.type as TraitType;
				const ownerIDs = record.fields.ownerID as (Array<string>);
				get(s_hierarchy).trait_remember_runtimeCreateUnique(k.empty, id, ownerIDs[0], type, text, true);
			}
		} catch (error) {
			debug.log_error(this.traits_errorMessage + error);
		}
	}

	async trait_persistentUpdate(trait: Trait) {
		try {
			await this.traits_table.update(trait.id, trait.fields);
		} catch (error) {
			trait.log(DebugFlag.remote, this.traits_errorMessage + error);
		}
	}

	async trait_persistentDelete(trait: Trait) {
		try {
			await this.traits_table.destroy(trait.id);
		} catch (error) {
			trait.log(DebugFlag.remote, this.traits_errorMessage + error);
		}
	}

	async trait_remember_persistentCreate(trait: Trait) {
		try {
			const fields = await this.traits_table.create(trait.fields);
			const id = fields['id'];	//	// need for update, delete and traits_byHID (to get parent from relationship)
			trait.setID(id);
			trait.already_persisted = true;
			get(s_hierarchy).trait_remember(trait);
		} catch (error) {
			trait.log(DebugFlag.remote, this.traits_errorMessage + error);
		}
	}

	static readonly $_RELATIONSHIPS_$: unique symbol;

	async relationships_readAll() {
		get(s_hierarchy).relationships_forgetAll();
		try {
			const records = await this.relationships_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const order = record.fields.order as number;
				const parents = record.fields.parent as (Array<string>);
				const children = record.fields.child as (Array<string>);
				const predicates = record.fields.predicate as (Array<string>);
				get(s_hierarchy).relationship_remember_runtimeCreateUnique(k.empty, id, predicates[0], parents[0], children[0], order, CreationOptions.isFromPersistent);
			}
		} catch (error) {
			debug.log_error(this.relationships_errorMessage + error);
		}
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

	async relationship_remember_persistentCreate(relationship: Relationship | null) {
		if (!!relationship && !relationship.already_persisted) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.setID(id);
				relationship.already_persisted = true;
				get(s_hierarchy).relationships_refreshKnowns();
			} catch (error) {
				relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
			}
		}
	}

	async relationship_persistentUpdate(relationship: Relationship) {
		this.relationships_table.update(relationship.id, relationship.fields);
	}

	async relationship_persistentDelete(relationship: Relationship) {
		try {
			get(s_hierarchy).relationships = u.strip_invalid(get(s_hierarchy).relationships);
			get(s_hierarchy).relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
		}
	}

	static readonly $_ANCILLARY_$: unique symbol;

	async predicates_readAll() {
		try {
			const records = await this.predicates_table.select().all()

			for (const record of records) {
				const fields = record.fields;
				const id = record.id as string; // do not yet need this
				const kind = fields.kind as string;
				const isBidirectional = fields.isBidirectional as boolean ?? false;
				get(s_hierarchy).predicate_remember_runtimeCreate(id, kind, isBidirectional);
			}

		} catch (error) {
			debug.log_error('Error in Predicates:' + error);
		}
	}

	async access_readAll() {
		try {
			const records = await this.access_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				const kind = record.fields.kind as string;
				get(s_hierarchy).access_runtimeCreate(id, kind);
			}

		} catch (error) {
			debug.log_error('Error in Access:' + error);
		}
	}

	async users_readAll() {
		try {
			const records = await this.users_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				get(s_hierarchy).user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
			}

		} catch (error) {
			debug.log_error('Error in Users:' + error);
		}
	}

}

export const dbAirtable = new DBAirtable();