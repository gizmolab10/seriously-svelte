function(instance, properties, context) {
	instance.data.send_to_webseriously('CHANGE_SELECTION', {
		id: properties.id		// id of the new selected object
	});
}