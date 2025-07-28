import { e, h, k, Thing, T_Thing, T_Persistence } from '../common/Global_Imports';
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
		if (!!event.data.properties) {
			let grabs: Thing[] = [];
			console.log('Bubble sent update:', event.data);
			let root, focus, things, selecteds, relationships;
			try {
				const properties = JSON.parse(event.data.properties);
				relationships = properties.relationships_table;
				selecteds = properties.selected_objects;
				things = properties.objects_table;
				root = properties.starting_object;
				focus = properties.focus_object;
			} catch (err) {
				console.warn('Could not parse properties:', err);
			}
			console.log('received root:', root);
			console.log('received focus:', focus);
			console.log('received objects:', things);
			console.log('received selected:', selecteds);
			console.log('received relationships:', relationships);
			if (!!root) {
				root = h.thing_remember_runtimeCreateUnique(h.db.idBase, root.id, root.title, root.color, T_Thing.root);
			}
			if (!!things) {
				for (const thing of things) {
					h.thing_remember_runtimeCreateUnique(h.db.idBase, thing.id, thing.title, thing.color, T_Thing.generic);
				}
			}
			if (!!focus) {   // must happen after things are created
				focus = h.thing_forHID(focus.hid);
			}
			if (!!selecteds) {// must happen after things are created
				for (const selected of selecteds) {
					const grab = h.thing_forHID(selected.hid);
					if (!!grab) {
						grabs.push(grab);
					}
				}
			}
			if (!!relationships) {
				h.predicate_defaults_remember_runtimeCreate();
				for (const relationship of relationships) {
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, relationship.id, relationship.kind.kind, relationship.parent, relationship.child, relationship.orders);
				}
			}
			h.wrapUp_data_forUX();
			if (!!grabs && grabs.length > 0) {
				setTimeout(() => {
					for (const grab of grabs) {
						grab.ancestry.grab();
					}
				}, 1000);
			}
		}
	}

}
