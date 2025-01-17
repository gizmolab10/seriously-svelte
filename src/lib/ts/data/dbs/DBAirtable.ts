import { DebugFlag, Relationship, CreationOptions } from '../../common/Global_Imports';
import { g, k, u, debug, Thing, Trait, TraitType } from '../../common/Global_Imports';
import { DBType, DatumType } from '../basis/Persistent_Identifiable';
import { Persistence_Kind } from './DBCommon';
import DBCommon from './DBCommon';
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
	kind_persistence = Persistence_Kind.remote;
	type_db = DBType.airtable;
	idBase = k.empty;

	relationships_errorMessage = 'Error in Relationships:';
	async hierarchy_fetchForID(idBase: string) {}
	things_errorMessage = 'Error in Things:';
	traits_errorMessage = 'Error in Traits:';

	// async remove_all() {}	// only remove json from localStorage

	async fetch_all() {
		await this.things_fetch_all();
		await this.traits_fetch_all();
		await this.predicates_fetch_all();
		await this.relationships_fetch_all();
		await this.access_fetch_all();
		await this.users_fetch_all();
	}

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

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	async things_fetch_all() {
		this.hierarchy.things_forget_all(); // clear

		try {
			const select = this.things_table.select();
			await select.all().then((records) => {
				const remoteThings = records;
				for (const remoteThing of remoteThings) {
					const id = remoteThing.id;
					const fields = remoteThing.fields;
					this.hierarchy.thing_remember_runtimeCreate(k.empty, id, fields.title as string, fields.color as string, (fields.type as string) ?? fields.trait as string, true, !fields.type);
				}
			})
		} catch (error) {
			debug.log_error(this.things_errorMessage + ' (things_fetch_all) ' + error);
		}
	}

	static readonly THING: unique symbol;
	
	async thing_remember_persistentCreate(thing: Thing) {
		try {
			const dict = await this.things_table.create(thing.fields);
			thing.state.already_persisted = true;		// was saved by create (the line above)
			thing.state.awaitingCreation = false;
			this.hierarchy.thing_remember_updateID_to(thing, dict['id']);
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

	static readonly TRAIT: unique symbol;

	//////////////////////////////
	//			TRAITS			//
	//////////////////////////////

	async traits_fetch_all() {
		this.hierarchy.traits_forget_all();
		try {
			const records = await this.traits_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const text = record.fields.text as string;
				const type = record.fields.type as TraitType;
				const ownerIDs = record.fields.ownerID as (Array<string>);
				this.hierarchy.trait_remember_runtimeCreateUnique(k.empty, id, ownerIDs[0], type, text, true);
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
			trait.state.already_persisted = true;
			this.hierarchy.trait_remember(trait);
		} catch (error) {
			trait.log(DebugFlag.remote, this.traits_errorMessage + error);
		}
	}

	static readonly RELATIONSHIPS: unique symbol;

	async relationships_fetch_all() {
		this.hierarchy.relationships_forget_all();
		try {
			const records = await this.relationships_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const order = record.fields.order as number;
				const parents = record.fields.parent as (Array<string>);
				const children = record.fields.child as (Array<string>);
				const kindPredicate = record.fields.kindPredicate as string;
				this.hierarchy.relationship_remember_runtimeCreateUnique(k.empty, id, kindPredicate, parents[0], children[0], order, CreationOptions.isFromPersistent);
			}
		} catch (error) {
			debug.log_error(this.relationships_errorMessage + error);
		}
	}

	static readonly RELATIONSHIP: unique symbol;

	async relationship_remember_persistentCreate(relationship: Relationship) {
		if (!!relationship && !relationship.state.already_persisted) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.setID(id);
				relationship.state.already_persisted = true;
				this.hierarchy.relationships_refreshKnowns();
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
			this.hierarchy.relationships = u.strip_invalid(this.hierarchy.relationships);
			this.hierarchy.relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
		}
	}

	static readonly ANCILLARY: unique symbol;

	async predicates_fetch_all() {
		try {
			const records = await this.predicates_table.select().all()

			for (const record of records) {
				const fields = record.fields;
				const id = record.id as string; // do not yet need this
				const kind = fields.kind as string;
				const isBidirectional = fields.isBidirectional as boolean ?? false;
				this.hierarchy.predicate_remember_runtimeCreate(id, kind, isBidirectional);
			}

		} catch (error) {
			debug.log_error('Error in Predicates:' + error);
		}
	}

	async access_fetch_all() {
		try {
			const records = await this.access_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				const kind = record.fields.kind as string;
				this.hierarchy.access_runtimeCreate(id, kind);
			}

		} catch (error) {
			debug.log_error('Error in Access:' + error);
		}
	}

	async users_fetch_all() {
		try {
			const records = await this.users_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				this.hierarchy.user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
			}

		} catch (error) {
			debug.log_error('Error in Users:' + error);
		}
	}

}

export const dbAirtable = new DBAirtable();