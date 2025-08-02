function(instance, properties) {
	const ignore_fields = ['Slug'];
	const user_configured_field_names = {};
	const item_fields = ['child', 'parent', 'owner', 'kind'];
	const to_be_removed = ['_boolean', '_custom', '_text', '_list'];

	const plugin_field_names = [
		'focus_object',
		'object_id_field',
		'starting_object',
		'selected_objects',
		'object_color_field',
		'object_title_field',
		'object_parents_field',
		'object_related_field'];

	plugin_field_names.forEach(plugin_field_name => {
		user_configured_field_names[plugin_field_name] = properties[plugin_field_name];
	});

	function user_configured_list_names(list_names) {
		const names = [];
		list_names.forEach(list_name => {
			names.push(user_configured_field_names[list_name]);
		});
		return names;
	}

	const list_fields = user_configured_list_names(['object_parents_field', 'object_related_field', 'owners_field']);

	function clean_field_name(field_name, remove_these) {
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
				return clean_field_name(plugin_field_name, ['_field']);
			}
		}
		return null;
	}

	function carefully_extract(value, item_field_name, visited, id_to_ignore) {
		if (!!value) {
			let keepers = [];
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
				let clean_name = clean_field_name(item_field_name, to_be_removed);
				const seriously_name = seriously_field_name_for(clean_name) ?? seriously_field_name_for(item_field_name);
				const value = item.get(item_field_name);
				if (!ignore_fields.includes(clean_name)) {
					// if (!seriously_name) {
					// 	console.warn('extracted field name unresolved for', item_field_name, 'item properties:', item_properties);
					// } else 
					if (list_fields.includes(clean_name)) {
						const keepers = carefully_extract(value, item_field_name, visited, item_data.id);
						if (!!keepers) {
							item_data[seriously_name] = keepers;
						}
					} else if (value == undefined) {
						if (value != null) {
							console.warn('value undefined for', item_field_name, 'item properties:', item_properties);
						}
					} else if (item_fields.includes(clean_name) && typeof value != 'string') {
						item_data[seriously_name] = extract_ITEM_data(clean_name, value, [...visited, clean_name]);
					} else {
						item_data[seriously_name] = value;
					}
				}
			});
			instance.data.attempts[plugin_field_name] -= 1;
			if (instance.data.attempts[plugin_field_name] == 0) {
				delete instance.data.attempts[plugin_field_name];
			}
			// console.log('item data:', plugin_field_name, item_data);
		}
		return item_data;
	}

	function extract_LIST_data(plugin_field_name, list = null, visited = []) {
		// sometimes name is actually the list, use it as a string to get the list from properties
		list = !!list ? list : (typeof plugin_field_name != 'string') ? plugin_field_name : (properties[plugin_field_name] || null);
		let extracted_data = [];
		if (!list) {
			console.warn(plugin_field_name, 'is null');
		} else if (visited.includes(plugin_field_name)) {
			console.warn(plugin_field_name, 'already visited');
		} else {
			let sublist = list.get(0, list.length());
			sublist.forEach(item => {
				extracted_data.push(extract_ITEM_data(plugin_field_name, item, [...visited, plugin_field_name]));
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
			objects_table: extract_LIST_data('objects_table'),
			starting_object: extract_ITEM_data('starting_object'),
		}, null, 0);

		send({
			selected_objects: extract_LIST_data('selected_objects'),
			focus_object: extract_ITEM_data('focus_object'),
		}, null, 0);

	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			console.log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}

