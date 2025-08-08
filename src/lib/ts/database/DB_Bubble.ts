import { T_Thing, T_Create, T_Predicate, T_Persistence } from '../common/Global_Imports';
import { e, h, k, debug, Ancestry } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestries_grabbed } from '../common/Stores';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Bubble extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.bubble;
	idBase = k.empty;

	async fetch_all() {
		e.update_event_listener('message', this.handle_bubble_message);		// first prepare listener
		window.parent.postMessage({ type: 'listening' }, '*');				// tell bubble that we're listening
		this.setup_subscriptions();
		return false;
	}

	setup_subscriptions() {
		setTimeout(() => {
			w_ancestry_focus.subscribe((ancestry: Ancestry) => {
				if (!!ancestry?.thing) {
					window.parent.postMessage({ type: 'focus', id: ancestry.thing.id }, '*');
				}
			});
			w_ancestries_grabbed.subscribe((ancestries: Ancestry[]) => {
				if (!!ancestries) {
					window.parent.postMessage({ type: 'select', ids: ancestries.map((ancestry: Ancestry) => ancestry.thing?.id) }, '*');
				}
			});
		}, 4000);
	}

	private handle_bubble_message = (e: Event) => {
		function createRelationship(b_parent: any, b_child: any, b_kind: any, b_orders: any) {
			const id = Math.random().toString(36).substring(2, 15);
			h.relationship_remember_runtimeCreateUnique(h.db.idBase, id, b_kind, b_parent.id, b_child.id, b_orders, T_Create.isFromPersistent);
		}
		function createThing(b_thing: any, b_type: T_Thing = T_Thing.generic) {
			h.thing_remember_runtimeCreateUnique(h.db.idBase, b_thing.id, b_thing.title, b_thing.color, b_type, true);
			if (!!b_thing.parents) {
				for (const b_parent of b_thing.parents) {
					createRelationship(b_parent, b_thing, T_Predicate.contains, [1, 1]);
				}
			}
			if (!!b_thing.related) {
				for (const b_related of b_thing.related) {
					createRelationship(b_related, b_thing, T_Predicate.isRelated, [1, 1]);
				}
			}
		}
		const event = e as MessageEvent;
		if (!event.data.properties) {
			h.wrapUp_data_forUX();
		} else {
			let b_root, b_tags, b_things, b_traits, b_focus, b_grabs, b_predicates, b_relationships;
			try {
				const properties = JSON.parse(event.data.properties);
				debug.log_bubble(`[DB_Bubble] received bubble update: ${properties}`);
				b_relationships = properties.relationships;
				b_predicates = properties.predicates;
				b_things = properties.things;
				b_traits = properties.traits;
				b_grabs = properties.grabs;
				b_focus = properties.focus;
				b_root = properties.root;
				b_tags = properties.tags;
			} catch (err) {
				console.warn('[DB_Bubble] Could not parse properties:', err);
			}
			debug.log_bubble(`[DB_Bubble] got root: ${b_root}`);
			debug.log_bubble(`[DB_Bubble] got tags: ${b_tags}`);
			debug.log_bubble(`[DB_Bubble] got focus: ${b_focus}`);
			debug.log_bubble(`[DB_Bubble] got traits: ${b_traits}`);
			debug.log_bubble(`[DB_Bubble] got objects: ${b_things}`);
			debug.log_bubble(`[DB_Bubble] got selected: ${b_grabs}`);
			debug.log_bubble(`[DB_Bubble] got predicates: ${b_predicates}`);
			debug.log_bubble(`[DB_Bubble] got relationships: ${b_relationships}`);
			if (!!b_root) {   // must happen BEFORE things are created
				createThing(b_root, T_Thing.root);
			}
			if (!!b_things) {
				for (const b_thing of b_things) {
					createThing(b_thing, T_Thing.generic);
				}
			}
			if (!b_predicates) {   // should happen BEFORE relationships are created
				h.predicate_defaults_remember_runtimeCreate();
			} else {
				for (const b_predicate of b_predicates) {
					h.predicate_remember_runtimeCreateUnique(b_predicate.id, b_predicate.kind, b_predicate.is_bidirectional, true);
				}
			}
			if (!!b_relationships) {   // all the rest must happen AFTER things are created
				for (const b_relationship of b_relationships) {
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, b_relationship.id, b_relationship.kind.kind, b_relationship.parent.id, b_relationship.child.id, b_relationship.orders, T_Create.isFromPersistent);
				}
			}
			if (!!b_traits) {
				for (const b_trait of b_traits) {
					h.trait_remember_runtimeCreateUnique(h.db.idBase, b_trait.id, b_trait.owner.id, b_trait.type, b_trait.text, {}, true);
				}
			}
			if (!!b_tags) {
				for (const b_tag of b_tags) {
					const ownerHIDs = b_tag.owners.map((owner: {id: string;}) => owner.id.hash());
					h.tag_remember_runtimeCreateUnique(h.db.idBase, b_tag.id, b_tag.type, ownerHIDs, true);
				}
			}

			h.wrapUp_data_forUX();			// create ancestries and tidy up
			
			if (!!b_focus?.id) {			// must happen AFTER ancestries are created
				const focus = h.thing_forHID(b_focus.id.hash());
				if (!!focus?.ancestry) {
					focus.ancestry.becomeFocus(true);
				}
			}
			if (!!b_grabs) {				// must happen AFTER ancestries are created
				for (const b_grab of b_grabs) {
					const grab = h.thing_forHID(b_grab.id.hash());
					if (!!grab?.ancestry) {
						grab.ancestry.grab();
					}
				}
			}
		}
	}

}
