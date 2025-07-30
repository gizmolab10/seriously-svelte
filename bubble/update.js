function(instance, properties) {
	console.log("[PLUGIN] Updating plugin with new properties:", properties);

	function normalizeField(name, endsWith) {
		if (name.endsWith(endsWith)) {
			return name.slice(0, -endsWith.length);
		}
		return name;
	}

	function extractElementData(element) {
		if (!element) return {};
		let fieldNames = element.listProperties();
		let itemData = {};
		fieldNames.forEach(fieldName => {
			let cleanFieldName = fieldName;
			const endings = ['_text', '_boolean', '_custom_thing', '_custom_predicate'];
			endings.forEach(ending => {
				cleanFieldName = normalizeField(cleanFieldName, ending);
			});
			const value = element.get(fieldName);
			if (fieldName == 'kind_custom_predicate') {
				itemData[cleanFieldName] = extractElementData(value);
			} else if (fieldName == 'owner_custom_thing') {
				itemData[cleanFieldName] = extractElementData(value);
			} else if (fieldName == 'things_list_custom_thing') {
				itemData['owners'] = extractListData(value);
			} else if (fieldName == 'orders_list_number') {
				let orders = [];
				for (let i = 0; i < value.length(); i++) {
					const order = value.get(i, i + 1)[0];
					orders.push(order);
				}
				itemData['orders'] = orders;
			} else {
				itemData[cleanFieldName] = value;
			}
		});
		return itemData;
	}

	function extractListData(list) {
		if (!list) return [];
		let listOfElements = list.get(0, list.length());
		let extracted_data = [];
		listOfElements.forEach(element => {
			extracted_data.push(extractElementData(element));
		});
		return extracted_data;
	}

	try {
		const objects_list = properties.objects_table;
		const tags_list = properties.tags_table || null;
		const extracted_tags = extractListData(tags_list);
		const traits_list = properties.traits_table || null;
		const extracted_traits = extractListData(traits_list);
		const extracted_objects = extractListData(objects_list);
		const contentWindow = instance.data.iframe.contentWindow;
		const relationships_list = properties.relationships_table;
		const selected_objects_list = properties.selected_objects;
		const predicates_list = properties.predicates_table || null;
		const extracted_predicates = extractListData(predicates_list);
		const focus_object = extractElementData(properties.focus_object);
		const extracted_relationships = extractListData(relationships_list);
		const starting_object = extractElementData(properties.starting_object);
		const extracted_selected_objects = extractListData(selected_objects_list);

		const json = JSON.stringify({
			tags_table: extracted_tags,
			focus_object: focus_object,
			traits_table: extracted_traits,
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
		console.error("[PLUGIN] Error updating plugin:", error);
	}
	
	// Additional error validation
	function validateError(error) {
		// Requirement: error is not a NotReadyError
		if (error && error.name === 'NotReadyError') {
			console.warn("[PLUGIN] NotReadyError detected - skipping processing");
			return false;
		}
		return true;
	}
}
