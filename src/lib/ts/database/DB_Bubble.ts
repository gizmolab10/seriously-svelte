import { e, h, k, T_Thing, T_Create, T_Persistence } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Bubble extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.bubble;
	idBase = k.empty;

	async fetch_all() {
		e.update_event_listener('message', this.handle_bubble_message);
		window.parent.postMessage({ type: 'listening' }, '*');	// tell bubble that we're listening
		return false;
	}

	private handle_bubble_message = (e: Event) => {
		const event = e as MessageEvent;
		if (!event.data.properties) {
			h.wrapUp_data_forUX();
		} else {
			console.log('Bubble sent update:', event.data);
			let root, tags, things, traits, focused, selecteds, predicates, relationships;
			try {
				const properties = JSON.parse(event.data.properties);
				relationships = properties.relationships_table;
				predicates = properties.predicates_table;
				selecteds = properties.selected_objects;
				focused = properties.focus_object;
				things = properties.objects_table;
				root = properties.starting_object;
				traits = properties.traits_table;
				tags = properties.tags_table;
			} catch (err) {
				console.warn('Could not parse properties:', err);
			}
			console.log('received root:', root);
			console.log('received tags:', tags);
			console.log('received focus:', focused);
			console.log('received traits:', traits);
			console.log('received objects:', things);
			console.log('received selected:', selecteds);
			console.log('received predicates:', predicates);
			console.log('received relationships:', relationships);
			if (!!root) {   // must happen BEFORE things are created
				root = h.thing_remember_runtimeCreateUnique(h.db.idBase, root.id, root.title, root.color, T_Thing.root, true);
			}
			if (!!things) {
				for (const thing of things) {
					h.thing_remember_runtimeCreateUnique(h.db.idBase, thing.id, thing.title, thing.color, T_Thing.generic, true);
				}
			}
			if (!predicates) {   // should happen BEFORE relationships are created
				h.predicate_defaults_remember_runtimeCreate();
			} else {
				for (const predicate of predicates) {
					h.predicate_remember_runtimeCreateUnique(predicate.id, predicate.kind, predicate.is_bidirectional, true);
				}
			}
			if (!!relationships) {   // all the rest must happen AFTER things are created
				for (const relationship of relationships) {
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, relationship.id, relationship.kind.kind, relationship.parent.id.hash(), relationship.child.id.hash(), relationship.orders, T_Create.isFromPersistent);
				}
			}
			if (!!traits) {
				for (const trait of traits) {
					h.trait_remember_runtimeCreateUnique(h.db.idBase, trait.id, trait.owner.id, trait.type, trait.text, {}, true);
				}
			}
			if (!!tags) {
				for (const tag of tags) {
					const ownerHIDs = tag.owners.map(owner => owner.id.hash());
					h.tag_remember_runtimeCreateUnique(h.db.idBase, tag.id, tag.type, ownerHIDs, true);
				}
			}

			h.wrapUp_data_forUX();			// create ancestries and tidy up
			
			if (!!focused?.id) {			// must happen AFTER ancestries are created
				const focus = h.thing_forHID(focused.id.hash());
				if (!!focus?.ancestry) {
					focus.ancestry.becomeFocus(true);
				}
			}
			if (!!selecteds) {				// must happen AFTER ancestries are created
				for (const selected of selecteds) {
					const grab = h.thing_forHID(selected.id.hash());
					if (!!grab?.ancestry) {
						grab.ancestry.grab();
					}
				}
			}
		}
	}

}
