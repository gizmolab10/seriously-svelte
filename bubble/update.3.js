function(instance, properties) {
	const FIELD_LABELS = [
		'overwrite_focus_and_mode',
		'erase_user_settings',
		'starting_object_id',
		'show_radial_mode',
		'focus_object_id',
		'show_details'];
	const FIELD_LABELS_of_arrays = [
		'related_ids_array',
		'parent_ids_array',
		'titles_array',
		'colors_array',
		'ids_array'];

	//////////////////////////////////////////////////////////////////
	//																//
	//						naming conventions						//
	//																//
	//	ITEM		instance of CUSTOM data type (eg, "Object")		//
	//	SERIOUSLY	recognized by seriously netlify app (iframe)	//
	//	LABELS		labels of FIELDS (specified by me)				//
	//	FIELD		plugin Field (value supplied by plugin user)	//
	//																//
	//////////////////////////////////////////////////////////////////

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
		//	  the keys (below) are recognized by DB_Bubble.ts	//
		//  	  (in its handle_bubble_message function)		//
		//														//
		//    instance.data.attempts tracks unhydrated ITEMs	//
		//														//
		//////////////////////////////////////////////////////////
		
		instance.data.attempts = instance.data.attempts || {};
		let to_send = {};
		FIELD_LABELS.forEach(label => {
			const SERIOUSLY_name = label.replace('_object_id', '').replace('starting', 'root');
			to_send[SERIOUSLY_name] = properties[label]
		});
		FIELD_LABELS_of_arrays.forEach(label => {
			const array = properties[label];
			if (!!array && typeof array == 'object' && typeof array.length === 'function' && array.length() > 0) {
				const SERIOUSLY_name = label.replace('parent_', 'parents_').replace('_ids', '').replace('_array', '').replace('_object_id', '');
				const length = array.length();
				let items = [];
				for (let i = 0; i < length; i++) {
					const item = array.get(i, 1);
					items.push(item);
				}
				const json_string = JSON.stringify(items);
				to_send[SERIOUSLY_name] = json_string;
				LOG('converted array for', SERIOUSLY_name, json_string);
			}
		});
		send_to_webseriously(to_send);
	}
}
