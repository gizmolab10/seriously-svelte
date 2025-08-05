function(instance, properties) {
	const IGNORE_these_fields = ['Modified Date', 'Created Date', 'Created By', 'Slug', '_id'];
	const SERIOUSLY_names_of_ITEMS = ['parent', 'child', 'owner', 'kind'];
	const SERIOUSLY_names_of_LISTS = ['parents', 'related', 'owners'];
	const to_be_STRIPPED = ['_boolean', '_custom', '_text', '_list'];
	const MESSY_names_by_PLUGIN_field_name = {};
	const MESSY_names_of_LISTS = [];
	const debug = true;
	
	const PLUGIN_field_names = [
		'focus_object',
		'edge_id_field',
		'object_id_field',
		'edge_kind_field',
		'starting_object',
		'edge_child_field',
		'selected_objects',
		'edge_parent_field',
		'edge_orders_field',
		'object_color_field',
		'object_title_field',
		'edge_two_way_field'
	];

	// five kinds of names:

	// 1. PLUGIN field names of ITEMS and LISTS
	// 2. indirect MESSY names of LISTS (e.g., poor_rents)
	// 3. STRIPPED names (STRIPPED of _field, _boolean, etc.)
	// 4. SERIOUSLY names (recognized/required by the netlify webSERIOUSLY app)
	// 5. ignore fields (Slug)

	PLUGIN_field_names.forEach(PLUGIN_field_name => {
		MESSY_names_by_PLUGIN_field_name[PLUGIN_field_name] = properties[PLUGIN_field_name];
	});

	SERIOUSLY_names_of_LISTS.forEach(SERIOUSLY_name => {
		MESSY_names_of_LISTS.push(MESSY_names_by_PLUGIN_field_name[SERIOUSLY_name]);
	});

	// MESSY names are static text, used indirectly to access lists and ITEMs

	function has_SERIOUSLY_name(name) { return Object.keys(MESSY_names_by_PLUGIN_field_name).includes(name); }
	function log(message, ...optionalParams) { if (debug) { console.log(message, ...optionalParams); } }
	instance.data.attempts = instance.data.attempts || {};

	function SERIOUSLY_field_name_for(name) {
		// convert to a name recognized by the netlify webSERIOUSLY app
		for (const [PLUGIN_field_name, field_name] of Object.entries(MESSY_names_by_PLUGIN_field_name)) {
			if (field_name == name) {
				return STRIPPED_field_name(PLUGIN_field_name, ['_field']);
			}
		}
		return null;
	}

	function extract_list_at_named_field_ignoring(field_name, value, visited, id_to_ignore) {
		if (!!value) {
			let keepers = [];
			// this is only for text values that correspond to objects or lists
			// value is a list of objects
			log('extract_list_at_named_field_ignoring', field_name, value, visited, id_to_ignore);
			const extracted = extract_LIST_data(field_name, value, visited);
			if (extracted.length > 0) {
				for (const extracted_ITEM of extracted) {
					if (!!extracted_ITEM && extracted_ITEM.id != id_to_ignore) {
						keepers.push(extracted_ITEM);
					}
				}
				if (keepers.length > 0) {
					return keepers;
				}
			}
		}
		return null;
	}

	function STRIPPED_field_name(field_name, strip_these) {
		let rename = field_name;
		let parts = rename.split('object_');
		if (parts.length > 1) {
			rename = parts[1];
		}
		strip_these.forEach(strip_me => {
			parts = rename.split(strip_me);
			if (parts.length > 1) {
				rename = parts[0];
			}
		});
		return rename;
	}

	function extract_ITEM_data(ITEM, name, visited = []) {
		// log('extract_ITEM_data', name, ITEM, visited);
		let ITEM_data = {};
		if (!!ITEM) {
			instance.data.attempts[name] = (instance.data.attempts[name] ?? 0) + 1;
			const ITEM_field_names = ITEM.listProperties();
			const ITEM_properties = ITEM_field_names.reduce((names, field_name) => {	// for debugging
				names[field_name] = ITEM.get(field_name);
				return names;
			}, {});
			ITEM_field_names.forEach(ITEM_field_name => {
				const STRIPPED_name = STRIPPED_field_name(ITEM_field_name, to_be_STRIPPED);
				if (!IGNORE_these_fields.includes(STRIPPED_name)) {
					const value = ITEM.get(ITEM_field_name);
					const has_name = has_SERIOUSLY_name(STRIPPED_name) || has_SERIOUSLY_name(ITEM_field_name);
					const SERIOUSLY_name = SERIOUSLY_field_name_for(STRIPPED_name) ?? SERIOUSLY_field_name_for(ITEM_field_name);
					if (!SERIOUSLY_name) {
						if (has_name) {
							console.warn('extracted SERIOUSLY name unresolved for', ITEM_field_name, 'ITEM properties:', ITEM_properties);
						}
					} else if (!value) {
						if (value != null) {
							console.warn('value undefined for', ITEM_field_name, 'ITEM properties:', ITEM_properties);
						}
					} else if (ITEM_field_name == 'orders_list_number') {
						let orders = [];
						for (let i = 0; i < value.length(); i++) {
							const order = value.get(i, i + 1)[0];
							orders.push(order);
						}
						ITEM_data['orders'] = orders;
					} else if (ITEM_field_name == 'owners_list_custom_thing') {
						ITEM_data['owners'] = extract_LIST_data(value);
					} else if (SERIOUSLY_names_of_ITEMS.includes(STRIPPED_name) && typeof value != 'string') {
						log('recursively extract_ITEM_data', STRIPPED_name, value, visited);
						ITEM_data[SERIOUSLY_name] = extract_ITEM_data(value, STRIPPED_name, [...visited, STRIPPED_name]);
					} else if (MESSY_names_of_LISTS.includes(STRIPPED_name)) {
						const keepers = extract_list_at_named_field_ignoring(ITEM_field_name, value, visited, ITEM_data.id);
						if (!!keepers) {
							ITEM_data[SERIOUSLY_name] = keepers;
						}
					} else {
						ITEM_data[SERIOUSLY_name] = value;
					}
				}
			});
			instance.data.attempts[name] -= 1;
			if (instance.data.attempts[name] == 0) {
				delete instance.data.attempts[name];
			}
			// log('ITEM data:', name, ITEM_data);
		}
		return ITEM_data;
	}

	function extract_LIST_data(field_name, list = null, visited = []) {
		list = list || (typeof field_name === 'string' ? (properties[field_name] || null) : field_name);
		let extracted_data = [];
		log('extract_LIST_data', field_name, list, visited);
		if (!list) return [];
		if (visited.includes(field_name)) {
			log(field_name, 'already visited');
		} else if (!list) {
			if (list != null) {
				console.warn(field_name, 'is null');
			}
		} else if (!list.length || typeof list.length !== 'function' || typeof list.get !== 'function') {
			console.warn(field_name, 'is not a list');
		} else {
			try {
				let sublist = list.get(0, list.length());		// this will throw an error if the list is not ready
				sublist.forEach(ITEM => {
					extracted_data.push(extract_ITEM_data(ITEM, field_name, [...visited, field_name]));
				});
			} catch (error) {
				if (error.constructor.name != 'NotReadyError') {
					log('extract_LIST_data', field_name, list, visited, error);
				}
			}
		}
		return extracted_data;
	}

	function send(object) {
		const contentWindow = instance.data.iframe.contentWindow;
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(object)
		};

		if (instance.data.iframeIsListening && contentWindow) {
			contentWindow.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}

	try {

		send({
			things: extract_LIST_data('objects_table'),
			relationships: extract_LIST_data('edges_table'),
			root: extract_ITEM_data(properties.starting_object, 'starting_object'),
		}, null, 0);

		send({
			grabs: extract_LIST_data('selected_objects'),
			focus: extract_ITEM_data(properties.focus_object, 'focus_object'),
		}, null, 0);

		// send({
		// 	tags: extract_LIST_data('tags_table'),
		// 	traits: extract_LIST_data('traits_table')
		// }, null, 0);

	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}
