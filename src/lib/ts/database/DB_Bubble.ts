import { T_Thing, T_Graph, T_Create, T_Predicate, T_Persistence, T_Preference } from '../common/Global_Imports';
import { w_ancestry_focus, w_show_graph_ofType } from '../managers/Stores';
import { h, k, p, x, busy, debug, Ancestry } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Bubble extends DB_Common {
	t_persistence = T_Persistence.remote;
	prior_focus_id: string | null = null;
	prior_grabbed_ids: string[] = [];
	t_database = T_Database.bubble;
	debounced_focus = false;
	debounced_grab = false;
	idBase = k.empty;

	async fetch_all() {
		await busy.temporarily_set_isFetching_while(async () => {
			window.addEventListener('message', this.handle_bubble_message);		// first prepare listener
			window.parent.postMessage({ type: 'listening' }, k.wildcard);		// tell bubble that we're listening
		});
		return false;
	}

	private handle_bubble_message = (e: Event) => {
		function createRelationship(parent_id: string, child_id: string, kind: T_Predicate, orders: number[]) {
			if (!!parent_id && !!child_id && parent_id != k.empty && child_id != k.empty) {
				const id = Math.random().toString(36).substring(2, 15);
				h.relationship_remember_runtimeCreateUnique(h.db.idBase, id, kind, parent_id, child_id, orders, T_Create.isFromPersistent);
			}
		}
		function createThing(id: string, title: string, color: string, type: T_Thing) {
			if (!!id && !!title && !!color && !!type && id != k.empty) {
				h.thing_remember_runtimeCreateUnique(h.db.idBase, id, title, color, type);
			}
		}
		const event = e as MessageEvent;
		const JSON_string = event.data.properties;
		if (!JSON_string || JSON_string.length == 0) {
			h.wrapUp_data_forUX();
		} else {
			let b_ids, b_root, b_focus, b_titles, b_colors, b_parent_ids, b_related_ids, b_predicates, b_relationships, b_traits, b_tags, b_overwrite, b_inRadialMode, b_erase_user_preferences;
			try {
				const bubble_properties  = JSON.parse(JSON_string);
				const has_bubble		 = p.readDB_key(T_Preference.bubble) ?? false;	// true after first launch
				debug.log_bubble(`[DB_Bubble] received bubble update: ${JSON.stringify(bubble_properties)}`);
				b_overwrite				 = bubble_properties.overwrite_focus_and_mode || !has_bubble;
				b_erase_user_preferences = bubble_properties.erase_user_preferences;
				b_relationships			 = bubble_properties.relationships;
				b_inRadialMode			 = bubble_properties.inRadialMode;
				b_predicates			 = bubble_properties.predicates;
				b_related_ids			 = bubble_properties.related;
				b_parent_ids			 = bubble_properties.parents;
				b_colors				 = bubble_properties.colors;
				b_titles				 = bubble_properties.titles;
				b_traits				 = bubble_properties.traits;
				b_focus					 = bubble_properties.focus;
				b_root					 = bubble_properties.root;
				b_tags					 = bubble_properties.tags;
				b_ids					 = bubble_properties.ids;
			} catch (err) {
				console.warn('[DB_Bubble] Could not parse bubble_properties:', err);
			}
			if (!b_predicates) {   // should happen BEFORE relationships are created
				h.predicate_defaults_remember_runtimeCreate();
			} else {
				for (const b_predicate of b_predicates) {
					h.predicate_remember_runtimeCreateUnique(b_predicate.id, b_predicate.kind, b_predicate.is_bidirectional);
				}
			}
			if (!!b_relationships) {   // all the rest must happen AFTER things are created
				for (const b_relationship of b_relationships) {
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, b_relationship.id, b_relationship.kind.kind, b_relationship.parent.id, b_relationship.child.id, b_relationship.orders, b_relationship.T_Create.isFromPersistent);
				}
			}
			if (!!b_ids && !!b_titles && !!b_colors && !!b_parent_ids && !!b_related_ids) {
				for (let i = 0; i < b_titles.length; i++) {
					const related_ids	 = b_related_ids[i].split(k.separator.generic);
					const parent_ids	 = b_parent_ids[i].split(k.separator.generic);
					const title			 = b_titles[i];
					const color			 = b_colors[i];
					const id			 = b_ids[i];
					const type			 = (id == b_root) ? T_Thing.root : T_Thing.generic;
					createThing(id, title, color, type);
					if (!!parent_ids && parent_ids.length > 0) {
						for(const parent_id of parent_ids) {	
							createRelationship(parent_id, id, T_Predicate.contains, [1, 1]);
						}
					}
					if (!!related_ids && related_ids.length > 0) {
						for(const related_id of related_ids) {
							createRelationship(id, related_id, T_Predicate.isRelated, [1, 1]);
						}
					}
				}
			}
			if (!!b_traits) {
				for (const b_trait of b_traits) {
					h.trait_remember_runtimeCreateUnique(h.db.idBase, b_trait.id, b_trait.owner.id, b_trait.type, b_trait.text);
				}
			}
			if (!!b_tags) {
				for (const b_tag of b_tags) {
					const ownerHIDs = b_tag.owners.map((owner: {id: string;}) => owner.id.hash());
					h.tag_remember_runtimeCreateUnique(h.db.idBase, b_tag.id, b_tag.type, ownerHIDs);
				}
			}
			h.wrapUp_data_forUX();			// create ancestries and tidy up
			if (!!b_overwrite) {
				w_show_graph_ofType.set(b_inRadialMode ? T_Graph.radial : T_Graph.tree);
				if (!!b_focus) {			// must happen AFTER ancestries are created
					const focus = h.thing_forHID(b_focus.hash());
					if (!!focus?.ancestry) {
						focus.ancestry.becomeFocus(true);
					}
				}
			}
			this.setup_to_send_events();
			p.writeDB_key(T_Preference.bubble, true);
		}
	}

	setup_to_send_events() {

		//////////////////////////////////////////////////////////
		//														//
		//	 	message types to send to bubble plugin			//
		//   see handle_webseriously_message in initialize.js	//
		//														//
		//	  debounce: only send if changed from prior value	//
		//														//
		//////////////////////////////////////////////////////////
	
		window.parent.postMessage({ type: 'trigger_an_event', trigger: 'ready' }, k.wildcard);
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			if (!!ancestry && !!ancestry.thing && ancestry.thing.id != this.prior_focus_id) {
				if (this.debounced_focus) {
					this.prior_focus_id = ancestry.thing.id;
					window.parent.postMessage({ type: 'focus_id', id: ancestry.thing.id }, k.wildcard);
					window.parent.postMessage({ type: 'trigger_an_event', trigger: 'focus_changed' }, k.wildcard);			// post focus id first
				}
				this.debounced_focus = true;
			}
		});
		x.si_grabs.w_items.subscribe((ancestries: Ancestry[]) => {
			if (!!ancestries && ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.corrupted).join(', ') != this.prior_grabbed_ids.join(', ')) {
				if (this.debounced_grab) {
					this.prior_grabbed_ids = ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.corrupted);
					window.parent.postMessage({ type: 'selected_ids', ids: ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.corrupted) }, k.wildcard);
					window.parent.postMessage({ type: 'trigger_an_event', trigger: 'selection_changed' }, k.wildcard);			// post selected ids first
				}
				this.debounced_grab = true;
			}
		});
	}

}
