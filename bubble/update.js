function(instance, properties) {
	const object_add_ons = ['object_', '_object'];
	const BUBBLIZED_add_ons = ['_boolean', '_custom', '_text', '_list'];
	const shortening_FIELD_pattern = new RegExp(`^${object_add_ons.join('|')}|${BUBBLIZED_add_ons.join('|')}`, 'g');
	const unique_FIELD_pattern = new RegExp(`^${object_add_ons.join('|')}|_field|unique_`, 'g');
	const SERIOUSLY_field_name_by_BUBBLIZED_field_name = new Map([['_id', 'id']]);
	const SERIOUSLY_LIST_field_names = new Set(['parents', 'related']);
	const has_two_tables = properties.hasOwnProperty('edge_type');
	const shorter_FIELD_name_by_BUBBLIZED_field_name = new Map();
	const USER_FIELD_name_by_BUBBLIZED_field_name = new Map();
	const ignore_fields = ['Slug'];
	let USER_LIST_names = [];

	//////////////////////////////////////////////////////////////////////
	//																	//
	//	naming convention, uppercase for emphasis						//
	//																	//
	//	LIST		array of ITEM(s)									//
	//	ITEM		instance of USER data type (eg, "Object")			//
	//	SERIOUSLY	internal use within seriously netlify app			//
	//	FIELD		plugin Field (specified in bubble plugin editor)	//
	//	BUBBLIZED	wordy (sigh) field names created by bubble app		//
	//	LABELS		labels of text entries for USER field names			//
	//	USER		field name chosen by author of bubble app			//
	//																	//
	//	_id			the unique id of ITEM								//
	//	c_			convert to											//
	//	_field		of ITEM												//
	//																	//
	//////////////////////////////////////////////////////////////////////

	const _____MAIN = Symbol('MAIN');

	setup_names();
	instance.data.assure_iframe_is_instantiated(properties);	// start the ball rolling
	process_incoming_properties();

	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	function WARN(message, ...optionalParams) { if (instance.data.debug) { console.warn(message, ...optionalParams); } }

	function setup_names() {
		const LABELS_of_USER_LIST_names = [
			'object_parents_field',
			'object_related_field',
			'owners_field'];
		let LABELS_of_FIELD_names = [...LABELS_of_USER_LIST_names,
			'object_title_field',
			'object_color_field',
			'starting_object'];
		if (has_two_tables) {
			LABELS_of_FIELD_names = [...LABELS_of_FIELD_names,
				'edge_two_way_field',
				'edge_parent_field',
				'edge_orders_field',
				'edge_child_field',
				'edge_kind_field'];
		}
		LABELS_of_FIELD_names.forEach(name => {
			const property_value = properties[name];
			if(!!property_value && property_value != 'undefined') {
				if (isList(property_value)) {
					console.log('isList', name, property_value);
				} else {					
					const ITEM_field_name = String(properties[name]).toLowerCase();
					// replace all spaces with underscores, and _list with s (eg, "object_list" becomes "objects")
					// this converges "related_objects" with "related objects"
					// unbubblizes them (strips the annoying list suffix added by bubble to its field names, grrrr)
					const USER_FIELD_name = ITEM_field_name.replace(/ /, '_').replace(/^_list/, 's');
					USER_FIELD_name_by_BUBBLIZED_field_name[name] = USER_FIELD_name;
					const SERIOUSLY_field_name = c_shorter_FIELD_names(name, ['_field', 'unique_']);
					SERIOUSLY_field_name_by_BUBBLIZED_field_name.set(USER_FIELD_name, SERIOUSLY_field_name);
					LOG('setup_names', name, ITEM_field_name);
				}
			}
		});
		USER_LIST_names = new Set(c_LABELS_to_USER_LIST_names(LABELS_of_USER_LIST_names));	// N.B. needs USER_FIELD_name_by_BUBBLIZED_field_name from LABELS_of_FIELD_names.forEach
	}

	const _____CONVERSIONS = Symbol('CONVERSIONS');

	function c_LABELS_to_USER_LIST_names(LABELS_of_USER_LIST_names) {
		// Ack! Bubble doesn't support lists within lists!!!!!!
		const translated = [];
		LABELS_of_USER_LIST_names.forEach(label_of_LIST_name => {
			const name = USER_FIELD_name_by_BUBBLIZED_field_name[label_of_LIST_name];
			if (!!name) {
				translated.push(name);
			} else {
				WARN(['c_LABELS_to_USER_LIST_names "', label_of_LIST_name, '" not found in USER_FIELD_name_by_BUBBLIZED_field_name'].join(''));
			}
		});
		return translated;
	}

	function c_shorter_FIELD_names(name, remove_these) {
		if (shorter_FIELD_name_by_BUBBLIZED_field_name.has(name)) {
			return shorter_FIELD_name_by_BUBBLIZED_field_name.get(name);
		}
		const pattern = remove_these === BUBBLIZED_add_ons ? shortening_FIELD_pattern : unique_FIELD_pattern;
		const rename = name.replace(pattern, '');
		shorter_FIELD_name_by_BUBBLIZED_field_name.set(name, rename);
		return rename;
	}

	function isList(value) {
		return !!value &&
			typeof value === 'object' &&
			value.hasOwnProperty('listProperties');
	}

	function isListProperty(value, SERIOUSLY_field_name) {
		return isList(value) && SERIOUSLY_LIST_field_names.has(SERIOUSLY_field_name);
	}

	function extract_ITEM_data(field_name_of_ITEM, ITEM = null) {
		let ITEM_data = {};
		if (!ITEM) {
			ITEM = properties[field_name_of_ITEM];
		}
		if (!!ITEM) {
			instance.data.attempts[field_name_of_ITEM] = (instance.data.attempts[field_name_of_ITEM] ?? 0) + 1;
			LOG('extracting data from ITEM for', field_name_of_ITEM, ITEM);
			const BUBBLIZED_field_names = ITEM.listProperties();
			for (const BUBBLIZED_field_name of BUBBLIZED_field_names) {
				const USER_FIELD_name = c_shorter_FIELD_names(BUBBLIZED_field_name, BUBBLIZED_add_ons);
				if (ignore_fields.includes(USER_FIELD_name)) continue;
				const value = ITEM.get(BUBBLIZED_field_name);
				if (!!value || value == 0) {  // 0 is a valid value
					const SERIOUSLY_field_name = SERIOUSLY_field_name_by_BUBBLIZED_field_name.get(BUBBLIZED_field_name) ??
												 SERIOUSLY_field_name_by_BUBBLIZED_field_name.get(USER_FIELD_name);
					if (!!SERIOUSLY_field_name) {
						if (!USER_LIST_names.has(USER_FIELD_name)) {
							ITEM_data[SERIOUSLY_field_name] = value;
						} else {
							const LIST_data = extract_LIST_data(BUBBLIZED_field_name, value);
							if (!!LIST_data) {
								LOG('extracted LIST for', SERIOUSLY_field_name, LIST_data);
								ITEM_data[SERIOUSLY_field_name] = LIST_data;
							}
						}
					}
				}
			}
			instance.data.attempts[field_name_of_ITEM] -= 1;
			if (instance.data.attempts[field_name_of_ITEM] == 0) {
				delete instance.data.attempts[field_name_of_ITEM];
			}
		}
		return ITEM_data;
	}

	function extract_LIST_data(field_name, LIST = null) {
		// sometimes name is actually the LIST, use it as a string to get the LIST from properties
		LIST = !!LIST ? LIST : (typeof field_name != 'string') ? field_name : (properties[field_name] || null);
		let extracted_data = [];
		if (!LIST) {
			if (LIST != null) {
				WARN(field_name, 'is null');
			}
		} else if (!LIST.length || typeof LIST.length !== 'function' || typeof LIST.get !== 'function') {
			WARN(field_name, 'is not a LIST');
		} else {
			let sublist = LIST.get(0, LIST.length());
			sublist.forEach(item => {
				const ITEM_data = extract_ITEM_data(field_name, item);
				if (!!ITEM_data) {
					extracted_data.push(ITEM_data);
				}
			});
		}
		LOG('extracted data from LIST for', field_name, LIST, extracted_data);
		return extracted_data;
	}

	const _____PROCESS_AND_SEND = Symbol('PROCESS_AND_SEND');

	function send_to_webseriously(object) {
		const iframe = instance.data.iframe.contentWindow;
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(object)
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

		try {
			//////////////////////////////////////////////////////////
			//														//
			//	process incoming properties & send to webseriously	//
			//														//
			//	 the keys (below) are matched within DB_Bubble.ts	//
			//  	 (in its handle_bubble_message function)		//
			//														//
			//    instance.data.attempts tracks unhydrated ITEMs	//
			//														//
			//////////////////////////////////////////////////////////
			
			instance.data.attempts = instance.data.attempts || {};
			send_to_webseriously({
				overwrite_focus_and_mode: properties['overwrite_focus_and_mode'],
				erase_user_preferences: properties['erase_user_preferences'],
				inRadialMode: properties['show_radial_mode'],
				things: extract_LIST_data('objects_table'),
				root: extract_ITEM_data('starting_object'),
				focus: extract_ITEM_data('focus_object')
			});
		} catch (error) {
			if (error.constructor.name != 'NotReadyError') {
				WARN('[PLUGIN] threw an error:', error);
			} else if (instance.data.attempts && Object.entries(instance.data.attempts).some(([_, val]) => val > 0)) {
				WARN('[PLUGIN] data not ready:', instance.data.attempts);
			}
		}
	}
}