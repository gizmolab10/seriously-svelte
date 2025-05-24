import { k, Tag, Thing, Trait, T_Thing, T_Trait, T_Predicate } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import type { Dictionary } from '../common/Types';
import { w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';
import '../common/Extensions';

enum T_Marianne_Fields {
	Title,
	parent_1_link,
	Custom_Tags_$$Local$,
	Societal_Sectors,
	Wheel_of_Co$$$Creation_Sectors,
	Data_Subtypes,
	Main_Data_Type,
	Link,
	data_types_import,
	name,
	All_Local_Tags_$$folder_names$,
	Description,
	Parent_2_tags,
	parent_2_link,
	Parent_3_Tags,
	Parent_3_link,
	Parent_4_Tags,
	Parent_Link_4,
	Parent_5_Tags,
	Parent_Link_5,
	Parent_6_Tags,
	Source_Created_Date,
	Domain,
	Custom_Tags,
	Privacy_Field_of_record,
	Type,
	Ignore_for_Sync,
	Ready_to_Sync,
	Last_Synced,
	User_Curators
}

class Marianne {

	extract_fromDict(dict: Dictionary) {
		// each dict represents a Thing, which has a title, name, description and parent 1 link
		// later, in create_relationship_forAllTraits, above ...
		// ... create a Relationship for each trait that has a dict containing a parent 1 link
		// TODO: what is the parent 2 link?
		const h = get(w_hierarchy)
		const idBase = h.db.idBase;
		const thing_id = Identifiable.newID();
		const t_thing = dict['Type'] == 'bookmark' ? T_Thing.bookmark : T_Thing.generic;
		const title = dict['Title'].removeWhiteSpace();					// TODO: for remote db we need the thing id from the server
		h.thing_remember_runtimeCreate(idBase, thing_id, title, 'blue', t_thing);		// create a Thing for each dict
		this.create_trait_forThingfromDict(thing_id, dict);
		this.create_tags_forThing_fromDict(thing_id, dict);
		if (['TEAM LIBRARY', 'MEMBER LIBRARY'].includes(title)) {		// these two things are roots in airtable, directly add them to our root
			h.relationship_remember_runtimeCreateUnique(idBase, Identifiable.newID(), T_Predicate.contains, h.root.id, thing_id, 0);
		}
	}

	convert_key(key: string): number {
		const encodedKey = key.encode_as_property();
		if (!!encodedKey) {
			const newkey = T_Marianne_Fields[encodedKey as keyof typeof T_Marianne_Fields];
			return newkey;
		}
		return -1;
	}

	shrink_dict(dict: Dictionary): Dictionary {
		const shrunk: Dictionary = {};
		const keys_to_remove = ['Type', 'Link', 'Description', 'parent 1 link', 'data types import'];
		for (const key in dict) {
			if (!keys_to_remove.includes(key) && dict[key] != k.empty) {
				shrunk[key] = dict[key].removeWhiteSpace();
			}
		}
		return shrunk;
	}

	create_tag_forThing_andKey_fromDict(thingID: string, key: string, dict: Dictionary): Tag | null {
		const h = get(w_hierarchy)
		const tag_types = dict[key];
		if (!!tag_types) {
			for (const tag_type of tag_types.split(', ')) {
				const tag = h.tag_remember_runtimeAddTo_orCreateUnique(h.db.idBase, Identifiable.newID(), tag_type, thingID.hash());
				return tag;
			}
		}
		return null;
	}

	create_tags_forThing_fromDict(thingID: string, dict: Dictionary) {
		const keys = ['Custom Tags', 'Custom Tags (Local)'];
		for (const key of keys) {
			this.create_tag_forThing_andKey_fromDict(thingID, key, dict);
		}
	}

	create_trait_forThingfromDict(thing_id: string, dict: Dictionary): Trait {
		const h = get(w_hierarchy)
		const isBookmark = dict['Type'] == 'bookmark' ? T_Thing.bookmark : T_Thing.generic;
		const text = (isBookmark ? dict['Link'] : dict['Description']) ?? k.unknown;
		const t_trait = isBookmark ? T_Trait.link : T_Trait.text;
		const trait = h.trait_remember_runtimeCreate(h.db.idBase, Identifiable.newID(),
			thing_id, t_trait, text, dict);			// save the dict in the Trait for further processing, then discard
		return trait;
	}

	async create_relationship_forAllTraits() {
		// for each trait that has a dict containing a parent 1 link
		const h = get(w_hierarchy)
		for (const trait of h.traits) {
			const dict = trait.dict;
			if (!!dict) {
				const parent_title = dict['parent 1 link']?.removeWhiteSpace();
				if (!!parent_title) {
					const parents = h.things_forTitle(parent_title);
					const parent = parents?.[0] ?? await h.lost_and_found();
					if (!!parent) {
						h.relationship_remember_runtimeCreateUnique(h.db.idBase, Identifiable.newID(), T_Predicate.contains, parent.id, trait.ownerID, 0);
					}
				}
				trait.dict = {};			// not save dict, too big. was: this.shrink_dict(dict);
			}
		}
		// await this.cleanup_lost_and_found();  // Make sure we await this
	}

	async cleanup_lost_and_found() {		// not currently in use
		const h = get(w_hierarchy)
		const lost_and_found = await h.lost_and_found();
		if (!!lost_and_found) {
			const lost_and_found_ancestry = lost_and_found.ancestry;
			for (const child_zncestry of lost_and_found_ancestry.childAncestries) {
				const grandChildren_count = child_zncestry.childRelationships.length ?? 0;
				const child_relationship = child_zncestry.relationship;
				if (!!child_relationship) {
					const clump_name = grandChildren_count == 0 ? 'leaves' : 'crowds';
					const clump_ancestry = await h.ancestry_persistentCreateUnique(clump_name, lost_and_found_ancestry, T_Thing.generic);
					const idParent = clump_ancestry?.thing?.id;
					if (!!idParent) {
						child_relationship.idParent = idParent;
						child_relationship.set_isDirty();
					}
				}
			}
		}
	}

}

export const marianne = new Marianne();
