function(instance, properties, context) {
	// if (!properties.readyToUpdate) {
	// 	console.warn("[PLUGIN] Update aborted: not readyToUpdate");
	// 	return;		// Skip entirely if not hydrated
	// }
	console.warn("[PLUGIN] Update beginning...");
	function serializeObject(object) {
		const result = {};
		const fields = object?.listProperties?.() || [];
		for (const key of fields) {
			result[key] = object.get(key);
		}
		return result;
	}
	function serializeList(list) {
		const objects = list?.listProperties?.() || [];
		return objects.map(serializeObject);
	}
	try {
		const hydratedObjectsList = properties.objects_table_list;
		const hydratedRelationshipsList = properties.relationships_table_list;
		const serializedObjectsTable = serializeList(hydratedObjectsList);
		const serializedRelationshipsTable = serializeList(hydratedRelationshipsList);
		const message = {
			type: "update",
			objectsTable: JSON.stringify(serializedObjectsTable),
			relationshipsTable: JSON.stringify(serializedRelationshipsTable),
			startingObject: properties.starting_object?.get?.("_id") ?? null,
			objectTitleField: properties.object_title_field,
			objectChildrenField: properties.object_children_field,
			objectIdField: properties.object_id_field,
			relationshipIdField: properties.relationship_id_field,
			objectColorField: properties.object_color_field,
			objectTypeField: properties.object_type_field
		};
		if (instance.data.iframeListening && instance.data.iframe?.contentWindow) {
			instance.data.iframe.contentWindow.postMessage(message, "*");
		} else {
			console.log("[PLUGIN] Iframe not ready, queuing message:", message);
			instance.data.messageQueue.push(message);
		}
	} catch (err) {
		console.warn("[PLUGIN] Update failed:", err.message);
	}
}
