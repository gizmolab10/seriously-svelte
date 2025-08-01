function(instance, properties) {
	let visited = [];

	function normalizeField(name, endsWith) {
		if (name.endsWith(endsWith)) {
			return name.slice(0, -endsWith.length);
		}
		return name;
	}

	function clean_field_name(field_name) {
		let clean_name = field_name;
		
		// Handle pattern like "poor_rents_list_custom_poorrents" -> "poor_rents"
		if (clean_name.includes('_list_custom_')) {
			clean_name = clean_name.split('_list_custom_')[0];
		}
		
		// Apply existing normalization for other patterns
		const endings = ['_custom_predicate', '_list_custom_thing', '_custom_thing', '_boolean', '_text'];
		endings.forEach(ending => {
			clean_name = normalizeField(clean_name, ending);
		});
		
		return clean_name;
	}

	function extract_ITEM_data(name, item = null, visited = []) {
		let item_data = {};
		if (!item) {
			item = properties[name];
		}
		if (!!item) {
			instance.data.attempts[name] = (instance.data.attempts[name] ?? 0) + 1;
			const field_names = item.listProperties();
			const item_properties = field_names.reduce((names, field_name) => {	// for debugging
				names[field_name] = item.get(field_name);
				return names;
			}, {});
			field_names.forEach(field_name => {
				let clean_name = clean_field_name(field_name);
				const ignore_fields = ['Slug'];
				const value = item.get(field_name);
				if (!ignore_fields.includes(clean_name)) {
					const list_fields = ['parents', 'related', 'owners'];
					const item_fields = ['child', 'parent', 'owner', 'kind'];
					if (list_fields.includes(clean_name)) {
						if (!!value) {
							item_data[clean_name] = extract_LIST_data(clean_name, value, visited);
						}
					} else if (value == undefined) {
						console.log('value undefined for', field_name, 'item properties:', item_properties);
					} else if (field_name == 'orders_list_number') {
						let orders = [];
						for (let i = 0; i < value.length(); i++) {
							const order = value.get(i, i + 1)[0];
							orders.push(order);
						}
						item_data['orders'] = orders;
					} else if (item_fields.includes(clean_name) && typeof value != 'string') {
						item_data[clean_name] = extract_ITEM_data(clean_name, value, [...visited, clean_name]);
					} else {
						item_data[clean_name] = value;
					}
				}
			});
			instance.data.attempts[name] -= 1;
			if (instance.data.attempts[name] == 0) {
				delete instance.data.attempts[name];
			}
			console.log('item data:', name, item_data);
		}
		return item_data;
	}

	function extract_LIST_data(name, list = null, visited = []) {
		// sometimes name is actually the list, use it as a string to get the list from properties
		list = !!list ? list : (typeof name != 'string') ? name : (properties[name] || null);
		let extracted_data = [];
		if (!list) {
			console.warn(name, 'is null');
		} else if (visited.includes(name)) {
			console.warn(name, 'already visited');
		} else {
			let sublist = list.get(0, list.length());
			sublist.forEach(item => {
				extracted_data.push(extract_ITEM_data(name, item, [...visited, name]));
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

		send({
			tags_table: extract_LIST_data('tags_table'),
			traits_table: extract_LIST_data('traits_table')
		}, null, 0);

	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			console.log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}
