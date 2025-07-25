function(instance, properties) {
	console.log("[PLUGIN] Updating plugin with new properties:", properties);

	function normalizeField(name, endsWith) {
		if (name.endsWith(endsWith)) {
			return name.slice(0, -endsWith.length);
		}
		return name;
	}

	function extractElementData(element) {
		let fieldNames = element.listProperties();
		let itemData = {};
		fieldNames.forEach(fieldName => {
			let cleanFieldName = fieldName;
			const endings = ['_text', '_boolean', '_custom_predicate'];
			endings.forEach(ending => {
				cleanFieldName = normalizeField(cleanFieldName, ending);
			});
			const value = element.get(fieldName);
			if (fieldName == 'kind_custom_predicate') {
				itemData[cleanFieldName] = extractElementData(value);
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
		let listOfElements = list.get(0, list.length());
		let extractedData = [];
		listOfElements.forEach(element => {
			extractedData.push(extractElementData(element));
		});
		return extractedData;
	}

	if (!properties.objects_table) return;
	if (!properties.relationships_table) return;

	const objects_list = properties.objects_table;
	const extractedObjects = extractListData(objects_list);
	const contentWindow = instance.data.iframe.contentWindow;
	const relationships_list = properties.relationships_table;
	const extractedRelationships = extractListData(relationships_list);
	const starting_object = extractElementData(properties.starting_object);

	const json = JSON.stringify({
		objects_table: extractedObjects,
		starting_object: starting_object,
		relationships_table: extractedRelationships
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

}
