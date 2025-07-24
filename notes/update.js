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

	const cleanProperties = properties;//deepClean(properties);

	// Check if our list exists
	if (!cleanProperties.objects_table) return;

	// Get all objects from the list
	let listObjects = cleanProperties.objects_table.get(0, cleanProperties.objects_table.length());

	// Create array to store our extracted data
	let extractedData = [];

	// Loop through each object in the list
	listObjects.forEach(obj => {
		// Get all available field names for this object type
		let fieldNames = obj.listProperties();

		// Create a plain JavaScript object to store this item's data
		let itemData = {};

		// Extract each field's value
		fieldNames.forEach(fieldName => {
			itemData[fieldName] = obj.get(fieldName);
		});

		// Add to our results array
		extractedData.push(itemData);
	});

	const json = JSON.stringify(extractedData, null, 2);

	// Output the results
	console.log('Extracted Data:', extractedData);
	console.log('As JSON:', json);

	const message = {
		type: 'UPDATE_PROPERTIES',
		properties: json
	};

	if (instance.data.iframe && instance.data.iframe.contentWindow) {
		try {			// Send immediately if iframe is ready
			instance.data.iframe.contentWindow.postMessage(message, '*');
		} catch (error) {
			console.error("[PLUGIN] Failed to post message to iframe:", error);
		}
	} else {			// Store the message if iframe isn't ready
		instance.data.pendingMessages = instance.data.pendingMessages || [];
		instance.data.pendingMessages.push(message);
	}

}
