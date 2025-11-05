function(instance, properties, context) {
	// properties.id is the id of the object to change the focus to
	instance.data.send_to_webseriously('CHANGE_FOCUS', {
		id: properties.id
	});
}