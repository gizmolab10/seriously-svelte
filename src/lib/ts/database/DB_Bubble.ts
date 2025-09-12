import { T_Thing, T_Graph, T_Create, T_Predicate, T_Persistence } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestries_grabbed, w_show_graph_ofType } from '../managers/Stores';
import { e, h, k, busy, debug, Ancestry } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Bubble extends DB_Common {
	t_persistence = T_Persistence.remote;
	t_database = T_Database.bubble;
	idBase = k.empty;

	async fetch_all() {
		await busy.temporarily_set_isFetching_while(async () => {
			e.update_event_listener('message', this.handle_bubble_message);		// first prepare listener
			window.parent.postMessage({ type: 'listening' }, k.wildcard);		// tell bubble that we're listening
		});
		return false;
	}

	private handle_bubble_message = (e: Event) => {
		
		// TODO: configuration and terminate

		function createRelationship(b_parent: any, b_child: any, b_kind: any, b_orders: any, glob: string = k.empty) {
			const id = Math.random().toString(36).substring(2, 15);
			h.relationship_remember_runtimeCreateUnique(h.db.idBase, id, b_kind, b_parent.id, b_child.id, b_orders, glob, T_Create.isFromPersistent);
		}
		function createThing(b_thing: any, b_type: T_Thing = T_Thing.generic) {
			h.thing_remember_runtimeCreateUnique(h.db.idBase, b_thing.id, b_thing.title, b_thing.color, b_type,  b_thing.glob, true);
			if (!!b_thing.parents) {
				for (const b_parent of b_thing.parents) {
					createRelationship(b_parent, b_thing, T_Predicate.contains, [1, 1], k.empty);
				}
			}
			if (!!b_thing.related) {
				for (const b_related of b_thing.related) {
					createRelationship(b_related, b_thing, T_Predicate.isRelated, [1, 1], k.empty);
				}
			}
		}
		const event = e as MessageEvent;
		if (!event.data.properties) {
			h.wrapUp_data_forUX();
		} else {
			let b_root, b_tags, b_things, b_traits, b_focus, b_grabs, b_predicates, b_relationships, b_inRadialMode;
			try {
				const properties = JSON.parse(event.data.properties);
				debug.log_bubble(`[DB_Bubble] received bubble update: ${properties}`);
				b_relationships = properties.relationships;
				b_inRadialMode = properties.inRadialMode;
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
					h.predicate_remember_runtimeCreateUnique(b_predicate.id, b_predicate.kind, b_predicate.is_bidirectional, b_predicate.glob, true);
				}
			}
			if (!!b_relationships) {   // all the rest must happen AFTER things are created
				for (const b_relationship of b_relationships) {
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, b_relationship.id, b_relationship.kind.kind, b_relationship.parent.id, b_relationship.child.id, b_relationship.orders, b_relationship.glob, T_Create.isFromPersistent);
				}
			}
			if (!!b_traits) {
				for (const b_trait of b_traits) {
					h.trait_remember_runtimeCreateUnique(h.db.idBase, b_trait.id, b_trait.owner.id, b_trait.type, b_trait.text, b_trait.glob, true);
				}
			}
			if (!!b_tags) {
				for (const b_tag of b_tags) {
					const ownerHIDs = b_tag.owners.map((owner: {id: string;}) => owner.id.hash());
					h.tag_remember_runtimeCreateUnique(h.db.idBase, b_tag.id, b_tag.type, ownerHIDs, b_tag.glob, true);
				}
			}

			w_show_graph_ofType.set(b_inRadialMode ? T_Graph.radial : T_Graph.tree);
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

			//////////////////////////////////////////////////////////////////
			//																//
			//	SEND these message types to initialize.js in bubble PLUGIN	//
			//																//
			//////////////////////////////////////////////////////////////////
		
			window.parent.postMessage({ type: 'trigger_an_event', trigger: 'ready' }, k.wildcard);
			w_ancestry_focus.subscribe((ancestry: Ancestry) => {
				if (!!ancestry && !!ancestry.thing) {
					window.parent.postMessage({ type: 'focus_id', id: ancestry.thing.id }, k.wildcard);
					window.parent.postMessage({ type: 'trigger_an_event', trigger: 'focus_changed' }, k.wildcard);			// not before focus id
				}
			});
			w_ancestries_grabbed.subscribe((ancestries: Ancestry[]) => {
				if (!!ancestries) {
					window.parent.postMessage({ type: 'selected_ids', ids: ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.corrupted) }, k.wildcard);
					window.parent.postMessage({ type: 'trigger_an_event', trigger: 'selection_changed' }, k.wildcard);			// not before selected ids
				}
			});
		}
	}

}
