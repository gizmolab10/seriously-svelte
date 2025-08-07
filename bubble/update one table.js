function(instance, properties) {
	const to_be_removed = ['_boolean', '_custom', '_text', '_list'];
	const item_fields = ['child', 'parent', 'owner', 'kind'];
	const user_configured_field_names = {};
	const ignore_fields = ['Slug'];
	const debug = false;

	const has_two_tables = properties.hasOwnProperty('edge_type');
	console.log('has_two_tables', has_two_tables);

	const plugin_field_names = [
		'starting_object',
		'object_color_field',
		'object_title_field',
		'object_parents_field',
		'object_related_field'];

	plugin_field_names.forEach(plugin_field_name => {
		const normalized_name = properties[plugin_field_name].replace(/ /, '_').toLowerCase();
		user_configured_field_names[plugin_field_name] = normalized_name;
	});

	function user_configured_list_names(list_names) {
		const names = [];
		list_names.forEach(list_name => {
			names.push(user_configured_field_names[list_name]);
		});
		return names;
	}

	const list_fields = user_configured_list_names(['object_parents_field', 'object_related_field', 'owners_field']);
	function has_seriously_name(name) { return Object.keys(user_configured_field_names).includes(name); }
	function log(message, ...optionalParams) { if (debug) { console.log(message, ...optionalParams); } }

	function short_field_name(field_name, remove_these) {
		let rename = field_name;
		let parts = rename.split('object_');
		if (parts.length > 1) {
			rename = parts[1];
		}
		remove_these.forEach(remove_me => {
			parts = rename.split(remove_me);
			if (parts.length > 1) {
				rename = parts[0];
			}
		});
		return rename;
	}

	function seriously_field_name_for(name) {
		for (const [plugin_field_name, field_name] of Object.entries(user_configured_field_names)) {
			if (field_name == name) {
				return short_field_name(plugin_field_name, ['_field']);
			}
		}
		return null;
	}

	function extract_ignoring(item_field_name, value, visited, id_to_ignore) {
		if (!!value) {
			let keepers = [];
			// this is only for text values that correspond to objects or lists
			// value is a list of objects
			log('extract_ignoring', item_field_name, value, visited, id_to_ignore);
			const extracted = extract_LIST_data(item_field_name, value, visited);
			if (extracted.length > 0) {
				for (const extracted_item of extracted) {
					if (!!extracted_item && extracted_item.id != id_to_ignore) {
						keepers.push(extracted_item);
					}
				}
				if (keepers.length > 0) {
					return keepers;
				}
			}
		}
		return null;
	}

	function extract_ITEM_data(plugin_field_name, item = null, visited = []) {
		let item_data = {};
		if (!item) {
			item = properties[plugin_field_name];
		}
		if (!!item) {
			instance.data.attempts[plugin_field_name] = (instance.data.attempts[plugin_field_name] ?? 0) + 1;
			const item_field_names = item.listProperties();
			const item_properties = item_field_names.reduce((names, field_name) => {	// for debugging
				names[field_name] = item.get(field_name);
				return names;
			}, {});
			item_field_names.forEach(item_field_name => {
				let short_name = short_field_name(item_field_name, to_be_removed);
				const has_name = has_seriously_name(short_name) || has_seriously_name(item_field_name);
				const seriously_name = seriously_field_name_for(short_name) ?? seriously_field_name_for(item_field_name);
				const value = item.get(item_field_name);
				if (!ignore_fields.includes(short_name)) {
					if (!seriously_name) {
						if (has_name) {
							console.warn('extracted seriously name unresolved for', item_field_name, 'item properties:', item_properties);
						}
					} else if (!value) {
						if (value != null) {
							console.warn('value undefined for', item_field_name, 'item properties:', item_properties);
						}
					} else if (item_fields.includes(short_name) && typeof value != 'string') {
						log('recursively extract_ITEM_data', short_name, value, visited);
						item_data[seriously_name] = extract_ITEM_data(short_name, value, [...visited, short_name]);
					} else if (list_fields.includes(short_name)) {
						log('list_fields.includes(short_name)', short_name);
						const keepers = extract_ignoring(item_field_name, value, visited, item_data.id);
						if (!!keepers) {
							item_data[seriously_name] = keepers;
						}
					} else {
						item_data[seriously_name] = value;
					}
				}
			});
			instance.data.attempts[plugin_field_name] -= 1;
			if (instance.data.attempts[plugin_field_name] == 0) {
				delete instance.data.attempts[plugin_field_name];
			}
			// log('item data:', plugin_field_name, item_data);
		}
		return item_data;
	}

	function extract_LIST_data(field_name, list = null, visited = []) {
		// sometimes name is actually the list, use it as a string to get the list from properties
		list = !!list ? list : (typeof field_name != 'string') ? field_name : (properties[field_name] || null);
		log('extract_LIST_data', field_name, list, visited);
		let extracted_data = [];
		if (visited.includes(field_name)) {
			console.log(field_name, 'already visited');
		} else if (!list) {
			if (list != null) {
				console.warn(field_name, 'is null');
			}
		} else if (!list.length || typeof list.length !== 'function' || typeof list.get !== 'function') {
			console.warn(field_name, 'is not a list');
		} else {
			let sublist = list.get(0, list.length());
			sublist.forEach(item => {
				extracted_data.push(extract_ITEM_data(field_name, item, [...visited, field_name]));
			});
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
		instance.data.attempts = instance.data.attempts || {};

		send({
			things: extract_LIST_data('objects_table'),
			root: extract_ITEM_data('starting_object'),
			focus: extract_ITEM_data('focus_object'),
			grabs: extract_LIST_data('selected_objects'),
		}, null, 0);

	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			console.log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}

