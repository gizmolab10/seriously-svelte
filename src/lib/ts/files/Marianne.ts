import { Thing, E_Trait, E_Thing, E_Predicate } from '../common/Global_Imports';
import type { Dictionary } from '../common/Types';
import Identifiable from '../runtime/Identifiable';
import { w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';

enum E_Marianne_Fields {
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

	async extract_fromDict(dict: Dictionary): Promise<Thing> {
		// each dict represents a Thing, which has a title, name, description and parent 1 link
		// later, in create_relationship_forAllTraits, above ...
		// ... create a Relationship for each trait that has a dict containing a parent 1 link
		// TODO: what is the parent 2 link?
		const h = get(w_hierarchy)
		const idBase = h.db.idBase;
		const thing_id = Identifiable.newID();
		const title = dict['Title'].removeWhiteSpace();					// TODO: for remote db we need the thing id from the server
		const thing = h.thing_remember_runtimeCreate(idBase, thing_id, title, 'black');		// create a Thing for each dict
		const trait = h.trait_remember_runtimeCreate(idBase, Identifiable.newID(), thing_id, E_Trait.csv, dict['Description']);
		trait.dict = dict;												// save the rest of the dict (including parent 1 link) in the new Trait	
		if (['TEAM LIBRARY', 'MEMBER LIBRARY'].includes(title)) {		// these two things are roots in airtable, directly add them to our root
			h.relationship_remember_runtimeCreateUnique(idBase, Identifiable.newID(), E_Predicate.contains, h.root.id, thing_id, 0);
		}
		return thing;
	}

	async create_relationship_forAllTraits() {
		// for each trait that has a dict containing a parent 1 link
		const h = get(w_hierarchy)
		for (const trait of h.traits) {
			const dict = trait.dict;
			if (!!dict) {
				const title = dict['parent 1 link'];
				if (!!title) {
					const lost_and_found = await h.lost_and_found();
					if (!!lost_and_found) {
						const parent = h.thing_forTitle(title.removeWhiteSpace()) ?? lost_and_found;
						if (!!parent) {
							h.relationship_remember_runtimeCreateUnique(h.db.idBase, Identifiable.newID(), E_Predicate.contains, parent.id, trait.ownerID, 0);
						}
					}
				}
			}
		}
		// await this.cleanup_lost_and_found();  // Make sure we await this
	}

	async cleanup_lost_and_found() {
		const h = get(w_hierarchy)
		const lost_and_found = await h.lost_and_found();
		if (!!lost_and_found) {
			const lost_and_found_ancestry = lost_and_found.ancestry;
			for (const child_zncestry of lost_and_found_ancestry.childAncestries) {
				const grandChildren_count = child_zncestry.childRelationships.length ?? 0;
				const child_relationship = child_zncestry.relationship;
				if (!!child_relationship) {
					const clump_name = grandChildren_count == 0 ? 'leaves' : 'crowds';
					const clump_ancestry = await h.ancestry_persistentCreateUnique(clump_name, lost_and_found_ancestry, E_Thing.generic);
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