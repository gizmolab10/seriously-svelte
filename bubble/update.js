module.exports = function(instance, properties) {
	const SERIOUSLY_LIST_FIELD_names = new Set(['child', 'parent', 'owner', 'related']);
	const BUBBLIZED_add_ons = ['_boolean', '_custom', '_text', '_list'];
	const has_two_tables = properties.hasOwnProperty('edge_type');
	const BUBBLIZED_to_SERIOUSLY = new Map();
	const FIELD_name_by_BUBBLIZED_name = {};
	const shorter_FIELD_names = new Map();
	const BUBBLIZED_names = new Map();
	const ignore_fields = ['Slug'];
	let LIST_names = [];

	//////////////////////////////////////////////////////////////////////
	//																	//
	//	naming convention, uppercase for emphasis						//
	//																	//
	//	LIST		array of ITEM(s)									//
	//	ITEM		instance of DATA_TYPE								//
	//	DATA_TYPE	bubble app's data types								//
	//	SERIOUSLY	internal use within seriously netlify app			//
	//	FIELD		plugin Field (specified in bubble plugin editor)	//
	//	BUBBLIZED	field name within bubble app (grrr)					//
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

	function has_BUBBLIZED_name(name) {
		if (!BUBBLIZED_names.has(name)) {
			BUBBLIZED_names.set(name, Object.keys(FIELD_name_by_BUBBLIZED_name).includes(name));
		}
		return BUBBLIZED_names.get(name);
	}

	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	function WARN(message, ...optionalParams) { if (instance.data.debug) { console.warn(message, ...optionalParams); } }

	function setup_names() {
		const LIST_FIELD_name_labels = [
			'object_parents_field',
			'object_related_field',
			'owners_field'];
		let ITEM_FIELD_names = [...LIST_FIELD_name_labels,
			'object_title_field',
			'object_color_field',
			'starting_object'];
		if (has_two_tables) {
			ITEM_FIELD_names = [...ITEM_FIELD_names,
				'edge_two_way_field',
				'edge_parent_field',
				'edge_orders_field',
				'edge_child_field',
				'edge_kind_field'];
		}
		ITEM_FIELD_names.forEach(name => {
			let ITEM_field_name = String(properties[name]).toLowerCase();
			// replace all spaces with underscores, and _list with s (eg, "object_list" becomes "objects")
			// this converges "related_objects" with "related objects" 
			// unbublizes them (strips the annoying LIST suffix added by bubble to its field names, grrrr)
			ITEM_field_name = ITEM_field_name.replace(/ /, '_').replace(/^_list/, 's');
			FIELD_name_by_BUBBLIZED_name[name] = ITEM_field_name;
			LOG('setup_names', name, ITEM_field_name);
		});
		LIST_names = new Set(c_LIST_names(LIST_FIELD_name_labels));
	}

	const _____CONVERSIONS = Symbol('CONVERSIONS');

	function c_LIST_names(BUBBLIZED_names) {
		// Ack! Bubble doesn't support lists within lists!!!!!!
		const translated = [];
		BUBBLIZED_names.forEach(BUBBLIZED_name => {
			const name = FIELD_name_by_BUBBLIZED_name[BUBBLIZED_name];
			if (!!name) {
				translated.push(name);
			} else {
				WARN(['c_LIST_names "', BUBBLIZED_name, '" not found in FIELD_name_by_BUBBLIZED_name'].join(''));
			}
		});
		return translated;
	}

	function c_shorter_FIELD_names(name, remove_these) {
		if (shorter_FIELD_names.has(name)) {
			return shorter_FIELD_names.get(name);
		}
		let rename = name;
		let parts = rename.split('object_');
		if (parts.length > 1) {
			rename = parts[1];
		}
		remove_these.forEach(remove_me => {
			parts = rename.split(remove_me);
			if (parts.length > 1) {
				rename = parts[0];
			}
		});
		shorter_FIELD_names.set(name, rename);
		return rename;
	}

	function c_SERIOUSLY_field_name(name) {
		if (BUBBLIZED_to_SERIOUSLY.has(name)) {
			return BUBBLIZED_to_SERIOUSLY.get(name);
		}
		let result;
		if (name == '_id') {
			result = 'id';
		} else {
			for (const [field_name_of_ITEM, field_name] of Object.entries(FIELD_name_by_BUBBLIZED_name)) {
				if (field_name == name) {
					result = c_shorter_FIELD_names(field_name_of_ITEM, ['_field', 'unique_']);
					break;
				}
			}
		}
		BUBBLIZED_to_SERIOUSLY.set(name, result);
		return result;
	}

	function extract_ITEM_data(field_name_of_ITEM, ITEM = null, visited = []) {
		let ITEM_data = {};
		if (!ITEM) {
			ITEM = properties[field_name_of_ITEM];
		}
		if (!!ITEM) {
			instance.data.attempts[field_name_of_ITEM] = (instance.data.attempts[field_name_of_ITEM] ?? 0) + 1;
			LOG('extract_ITEM_data', field_name_of_ITEM, ITEM);
			const BUBBLIZED_ITEM_properties = ITEM.listProperties();
			const ITEM_properties = BUBBLIZED_ITEM_properties.reduce((properties, BUBBLIZED_field_name) => {
				// cleaned up by stripping the bubble add-ons, like _field, _list, etc.
				const shorter_name = c_shorter_FIELD_names(BUBBLIZED_field_name, BUBBLIZED_add_ons);
				properties[shorter_name] = ITEM.get(BUBBLIZED_field_name);
				return properties;
			}, {});
			BUBBLIZED_ITEM_properties.forEach(BUBBLIZED_ITEM_property => {
				const BUBBLIZED_DATA_TYPE_field_name = c_shorter_FIELD_names(BUBBLIZED_ITEM_property, BUBBLIZED_add_ons);
				const has_name = has_BUBBLIZED_name(BUBBLIZED_DATA_TYPE_field_name) || has_BUBBLIZED_name(BUBBLIZED_ITEM_property);
				const SERIOUSLY_name = c_SERIOUSLY_field_name(BUBBLIZED_DATA_TYPE_field_name) ?? c_SERIOUSLY_field_name(BUBBLIZED_ITEM_property);
				const value = ITEM.get(BUBBLIZED_ITEM_property);
				if (!ignore_fields.includes(BUBBLIZED_DATA_TYPE_field_name)) {
					if (!SERIOUSLY_name) {
						if (has_name) {
							WARN('extracted SERIOUSLY name unresolved for', BUBBLIZED_ITEM_property, 'item properties:', ITEM_properties);
						}
					} else if (!value) {
						if (value != null) {
							WARN('value undefined for', BUBBLIZED_ITEM_property, 'item properties:', ITEM_properties);
						}
					} else if (SERIOUSLY_LIST_FIELD_names.has(SERIOUSLY_name) && typeof value === 'object' && value !== null && value.hasOwnProperty('listProperties')) {
						LOG('recursively extract_ITEM_data', typeof value, BUBBLIZED_DATA_TYPE_field_name, visited);
						ITEM_data[SERIOUSLY_name] = extract_ITEM_data(BUBBLIZED_DATA_TYPE_field_name, value, [...visited, BUBBLIZED_DATA_TYPE_field_name]);
					} else if (!has_two_tables && LIST_names.has(BUBBLIZED_DATA_TYPE_field_name)) {
						const LIST_data = extract_LIST_data(BUBBLIZED_ITEM_property, value, visited);
						LOG('process LIST for', SERIOUSLY_name, LIST_data);
						if (!!LIST_data) {
							ITEM_data[SERIOUSLY_name] = LIST_data;
						}
					} else {
						ITEM_data[SERIOUSLY_name] = value;
					}
				}
			});
			instance.data.attempts[field_name_of_ITEM] -= 1;
			if (instance.data.attempts[field_name_of_ITEM] == 0) {
				delete instance.data.attempts[field_name_of_ITEM];
			}
		}
		return ITEM_data;
	}

	function extract_LIST_data(field_name, LIST = null, visited = []) {
		// sometimes name is actually the LIST, use it as a string to get the LIST from properties
		LIST = !!LIST ? LIST : (typeof field_name != 'string') ? field_name : (properties[field_name] || null);
		let extracted_data = [];
		if (visited.includes(field_name)) {
			LOG(field_name, 'already visited');
		} else if (!LIST) {
			if (LIST != null) {
				WARN(field_name, 'is null');
			}
		} else if (!LIST.length || typeof LIST.length !== 'function' || typeof LIST.get !== 'function') {
			WARN(field_name, 'is not a LIST');
		} else {
			let sublist = LIST.get(0, LIST.length());
			sublist.forEach(item => {
				const ITEM_data = extract_ITEM_data(field_name, item, [...visited, field_name]);
				if (!!ITEM_data) {
					extracted_data.push(ITEM_data);
				}
			});
		}
		LOG('extract_LIST_data', field_name, LIST, visited, extracted_data);
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
				inRadialMode: properties['show_radial_mode'],
				things: extract_LIST_data('objects_table'),
				root: extract_ITEM_data('starting_object'),
				focus: extract_ITEM_data('focus_object')
			});
		} catch (error) {
			if (error.constructor.name != 'NotReadyError') {
				WARN('[PLUGIN] threw an error:', error);
			} else if (Object.keys(instance.data.attempts).length > 0) {
				WARN('[PLUGIN] data not ready:', instance.data.attempts);
			}
		}
	}
}
