function(instance, properties) {
	// console.log("[PLUGIN] Updating plugin with new properties:", properties);

	function normalizeField(name, endsWith) {
		if (name.endsWith(endsWith)) {
			return name.slice(0, -endsWith.length);
		}
		return name;
	}

	function extract_ITEM_data(item, name) {
		let item_data = {};
		if (!!item) {
			const field_names = item.listProperties();
			const item_properties = field_names.reduce((props, propName) => {	// for debugging
				props[propName] = item.get(propName);
				return props;
			}, {});
			field_names.forEach(field_name => {
				let clean_name = field_name;
				const endings = ['_text', '_boolean', '_custom_thing', '_custom_predicate'];
				endings.forEach(ending => {
					clean_name = normalizeField(clean_name, ending);
				});
				const value = item.get(field_name);
				// const isArray = Array.isArray(value);
				if (value == undefined && field_name != 'Slug') {
					console.warn('value undefined for', field_name, 'item properties:', item_properties);
				} else {
					switch (field_name) {
						case 'orders_list_number':
							let orders = [];
							for (let i = 0; i < value.length(); i++) {
								const order = value.get(i, i + 1)[0];
								orders.push(order);
							}								item_data['orders'] = orders;  break;
						// case 'owners_list_custom_thing':	item_data['owners'] = extract_LIST_data(value); break;
						case 'things_list_custom_thing':	item_data['owners'] = extract_LIST_data(value); break;
						default:
							const object_names = ['child', 'parent', 'owner', 'kind'];
							const needs_extraction = object_names.includes(clean_name) && typeof value != 'string';
							if (needs_extraction) {
								item_data[clean_name] = extract_ITEM_data(value, clean_name);
							} else if (clean_name == 'owners_list') {
								console.warn('owners_list:', field_name);
							} else {
								item_data[clean_name] = value;
							}
							break;
					}
				}
			});
		};
		console.log('item data:', name, item_data);
		return item_data;
	}

	function extract_LIST_data(name) {
		const list = typeof name === 'string' ? (properties[name] || null) : name;
		if (!list) return [];
		let sublist = list.get(0, list.length());
		let extracted_data = [];
		sublist.forEach(item => {
			extracted_data.push(extract_ITEM_data(item, name));
		});
		return extracted_data;
	}

	try {
		const extracted_tags = extract_LIST_data('tags_table');
		const contentWindow = instance.data.iframe.contentWindow;
		// const extracted_traits = extract_LIST_data('traits_list');
		const extracted_objects = extract_LIST_data('objects_table');
		const extracted_predicates = extract_LIST_data('predicates_table');
		const extracted_relationships = extract_LIST_data('relationships_table');
		const extracted_selected_objects = extract_LIST_data('selected_objects');
		const focus_object = extract_ITEM_data(properties.focus_object, 'focus_object');
		const starting_object = extract_ITEM_data(properties.starting_object, 'starting_object');

		const json = JSON.stringify({
			tags_table: extracted_tags,
			focus_object: focus_object,
			// traits_table: extracted_traits,
			objects_table: extracted_objects,
			starting_object: starting_object,
			predicates_table: extracted_predicates,
			selected_objects: extracted_selected_objects,
			relationships_table: extracted_relationships
		}, null, 0);

		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: json
		};

		if (instance.data.iframeIsListening && contentWindow) {
			contentWindow.postMessage(message, "*");
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	} catch (error) {
		if (error.constructor.name !== 'NotReadyError') {
			console.warn("[PLUGIN] threw an error:", error);
		}
	}
}
