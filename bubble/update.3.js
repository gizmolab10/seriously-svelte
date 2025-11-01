function(instance, properties) {
	const field_labels = [
		'overwrite_focus_and_mode',
		'erase_user_settings',
		'starting_object_id',
		'show_radial_mode',
		'focus_object_id',
		'show_details'];
	const field_labels_of_arrays = [
		'related_ids_array',
		'parent_ids_array',
		'titles_array',
		'colors_array',
		'ids_array'];

	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	instance.data.assure_iframe_is_instantiated(properties);	// start the ball rolling, effective once
	process_incoming_properties();

	function send_to_webseriously(to_send) {
		const iframe = instance.data.iframe.contentWindow;
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(to_send)
		};
		if (instance.data.iframeIsListening && iframe) {
			iframe.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}

	function process_incoming_properties() {
		LOG('incoming', properties);

		//////////////////////////////////////////////////////////
		//														//
		//	process incoming properties & send to webseriously	//
		//														//
		//	seriously_name(s) are recognized by DB_Bubble.ts	//
		//  instance.data.attempts tracks unhydrated properties	//
		//														//
		//////////////////////////////////////////////////////////
		
		instance.data.attempts = instance.data.attempts || {};
		let to_send = {};
		field_labels.forEach(label => {
			const seriously_name = label.replace('_object_id', '').replace('starting', 'root');
			to_send[seriously_name] = properties[label]
		});
		field_labels_of_arrays.forEach(label => {
			const array = properties[label];
			if (!!array && typeof array == 'object' && typeof array.length === 'function' && array.length() > 0) {
				const seriously_name = label.replace('parent_', 'parents_').replace('_ids', '').replace('_array', '').replace('_object_id', '');
				const length = array.length();
				let items = [];
				for (let i = 0; i < length; i++) {
					const item = array.get(i, 1)[0] ?? '';
					items.push(item);
				}
				to_send[seriously_name] = items;
			}
		});
		send_to_webseriously(to_send);
	}
}
