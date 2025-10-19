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
		
		// TODO: configuration and terminate

		function createRelationship(b_parent: string, b_child: string, b_kind: T_Predicate, b_orders: number[]) {
			const id = Math.random().toString(36).substring(2, 15);
			h.relationship_remember_runtimeCreateUnique(h.db.idBase, id, b_kind, b_parent, b_child, b_orders, T_Create.isFromPersistent);
		}
		function createThing(b_thing: string, b_title: string, b_color: string, b_type: T_Thing) {
			h.thing_remember_runtimeCreateUnique(h.db.idBase, b_thing, b_title, b_color, b_type);
		}
		function split_array(array: string) {
			return array.replace('[', '').replace(']', '').replace('"', '').split(',');
		}
		const event = e as MessageEvent;
		if (!event.data.properties) {
			h.wrapUp_data_forUX();
		} else {
			let b_ids, b_root, b_focus, b_titles, b_colors, b_parents, b_related, b_overwrite, b_inRadialMode, b_erase_user_preferences;
			try {
				const properties = JSON.parse(event.data.properties);
				const has_bubble = p.readDB_key(T_Preference.bubble) ?? false;	// true after first launch
				debug.log_bubble(`[DB_Bubble] received bubble update: ${JSON.stringify(properties)}`);
				b_overwrite = properties.overwrite_focus_and_mode || !has_bubble;
				b_erase_user_preferences = properties.erase_user_preferences;
				b_parents = split_array(properties.parents);
				b_related = split_array(properties.related);
				b_titles = split_array(properties.titles);
				b_colors = split_array(properties.colors);
				b_inRadialMode = properties.inRadialMode;
				b_ids = split_array(properties.ids);
				b_focus = properties.focus;
				b_root = properties.root;
			} catch (err) {
				console.warn('[DB_Bubble] Could not parse properties:', err);
			}
			if (!!b_ids && !!b_titles && !!b_colors && !!b_parents && !!b_related) {
				for (let i = 0; i < b_titles.length; i++) {
					const id = b_ids[i];
					const title = b_titles[i];
					const color = b_colors[i];
					const parent = b_parents[i];
					const related = b_related[i];
					const type = (id == b_root) ? T_Thing.root : T_Thing.generic;
					createThing(id, title, color, type);
					createRelationship(parent, id, T_Predicate.contains, [1, 1]);
					createRelationship(id, related, T_Predicate.isRelated, [1, 1]);
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
