function update(instance, context) {
	const message = {
		type: 'update',
		objectsTable: context.objects_table,
		relationshipsTable: context.relationships_table,
		startingObject: context.starting_object?.get('_id') || null,
		objectTitleField: context.object_title_field,
		objectChildrenField: context.object_children_field,
		objectIdField: context.object_id_field,
		relationshipIdField: context.relationship_id_field,
		objectColorField: context.object_color_field,
		objectTypeField: context.object_type_field
	};
	console.log('UPDATE CALLED:', { instance, context });
	setTimeout(() => {
		if (instance.data.iframe?.contentWindow) {
			instance.data.iframe.contentWindow.postMessage(message, "*");
		}
	}, 100);
}
