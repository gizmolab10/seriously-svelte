function(instance, properties) {
	console.log("[PLUGIN] Updating plugin with new properties:", properties);

	// Deep clean the properties object - remove ALL functions and non-serializable data
	function deepClean(obj) {
		if (obj === null || obj === undefined) return null;
		if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
		if (typeof obj === 'function') return undefined; // Remove functions

		if (Array.isArray(obj)) {
			return obj.map(item => deepClean(item)).filter(item => item !== undefined);
		}

		if (typeof obj === 'object') {
			const cleaned = {};
			for (const [key, value] of Object.entries(obj)) {
				const cleanedValue = deepClean(value);
				if (cleanedValue !== undefined) {
					cleaned[key] = cleanedValue;
				}
			}
			return cleaned;
		}

		return undefined;
	}

	function extractListData(list) {
		let listElements = list.get(0, list.length());
		let extractedData = [];
		listElements.forEach(obj => {
			let fieldNames = obj.listProperties();
			let itemData = {};
			fieldNames.forEach(fieldName => {
				itemData[fieldName] = obj.get(fieldName);
			});
			extractedData.push(itemData);
		});
		return extractedData;
	}

	const cleanProperties = properties;//deepClean(properties);

	// Check if our lists exist
	if (!cleanProperties.objects_table) return;
	if (!cleanProperties.relationships_table) return;

	const objects_list = cleanProperties.objects_table;
	const relationships_list = cleanProperties.relationships_table;
	let extractedObjects = extractListData(objects_list);
	let extractedRelationships = extractListData(relationships_list);

	const json = JSON.stringify({ objects_table: extractedObjects, relationships_table: extractedRelationships }, null, 0);

	// Output the results
	console.log('Extracted Data:', json);
	console.log('As JSON:', json);

	const message = {
		type: 'UPDATE_PROPERTIES',
		properties: json
	};

	if (instance.data.iframeIsListening) {
		instance.data.iframe.contentWindow.postMessage(message, "*");
	} else {
		instance.data.pendingMessages = instance.data.pendingMessages || [];
		instance.data.pendingMessages.push(message);
	}

}
