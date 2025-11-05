function(instance, properties, context) {
	instance.data.send_to_webseriously('CHANGE_FOCUS', {
		id: properties.id		// id of the new focus object
	});
}