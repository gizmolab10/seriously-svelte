function(instance, properties) {
	const bubblizing_add_ons = ['_boolean', '_custom', '_text', '_list'];
	const ITEM_references = ['child', 'parent', 'owner', 'related'];
	const has_two_tables = properties.hasOwnProperty('edge_type');
	const original_DATA_TYPE_field_names = {};
	const ignore_fields = ['Slug'];
	const debug = false;

	////////////////////////////////////////////////////////////////////
	//
	//	naming conventions for functions and variables
	//
	//	LIST			array of ITEM(s)
	//	DATA_TYPE	bubble app's data types
	//	SERIOUSLY	internal use within seriously netlify app
	//	FIELD		plugin Field (specified in bubble plugin editor)
	//	ITEM			instance of DATA_TYPE
	//
	//	c_			convert to
	//	_id			the unique id of ITEM
	//	field		of ITEM (seriously, original, bubble, etc.)
	//
	////////////////////////////////////////////////////////////////////

	const exposed_LIST_FIELD_names = [
		'object_parents_field',
		'object_related_field',
		'owners_field'];

	const exposed_FIELD_names = [...exposed_LIST_FIELD_names,
		'object_title_field',
		'object_color_field',
		'starting_object'];

	if (has_two_tables) {
		exposed_FIELD_names = [...exposed_FIELD_names,
			'edge_two_way_field',
			'edge_parent_field',
			'edge_orders_field',
			'edge_child_field',
			'edge_kind_field'];
	}

	exposed_FIELD_names.forEach(field_name_of_ITEM => {
		const value = String(properties[field_name_of_ITEM]).toLowerCase();
		// replace all spaces with underscores, and _list with s (eg, "object_list" becomes "objects")
		// this converges "related_objects" with "related objects" 
		// unbublizes them (strips the annoying LIST suffix added by bubble to its field names, grrrr)
		const convergent_name = value.replace(/ /, '_').replace(/^_list/, 's');
		original_DATA_TYPE_field_names[field_name_of_ITEM] = convergent_name;
	});

	const LIST_names = c_DATA_TYPE_LIST_names(exposed_LIST_FIELD_names);
	function LOG(message, ...optionalParams) { if (debug) { console.log(message, ...optionalParams); } }
	function WARN(message, ...optionalParams) { if (debug) { console.warn(message, ...optionalParams); } }
	function has_SERIOUSLY_name(name) { return Object.keys(original_DATA_TYPE_field_names).includes(name); }

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//	design:
	//	SERIOUSLY_name --> user_supplied_name (of 'their Thing' data type fields) eg title --> titular, color --> cooler
	//	ITEM (bubblized, grrr) field name --> bubble_app_DATA_TYPE_field_name
	//	  WHY? field names within ITEMs are bubblized (grrr), eg "objects" shows up as "object_list". so unbubblize them
	//	exposed_FIELD_names --> original_DATA_TYPE_field_names (eg, "object_title_field" has the value of "titilate"
	//
	//	process these properties:
	//	 1. map: ITEM field name --> bubble_app_DATA_TYPE_field_name (declared in the Data tab of app editor, eg titular, cooler)
	//	 2. map: ITEM field name --> SERIOUSLY field name (eg, title, color)
	//	 3. send starting, objects, selected
	//	
	//	need to send:
	//	 1. a map: SERIOUSLY field name --> user_supplied_name (eg, title --> titular, color --> cooler)
	//		(in bubble [eg, test] app editor ... entered in Appearance of plugin)
	//
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	const _____CONVERSIONS = Symbol('CONVERSIONS');

	function c_DATA_TYPE_LIST_names(from_names) {
		// Ack! Bubble doesn't support lists within lists!!!!!!
		const translated = [];
		from_names.forEach(from_name => {
			translated.push(original_DATA_TYPE_field_names[from_name]);
		});
		return translated;
	}

	function c_bubble_app_DATA_TYPE_field_name(field_name, remove_these) {
		let rename = field_name;
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
		return rename;
	}

	function c_SERIOUSLY_field_name(name) {
		if (name == '_id') {
			return 'id';
		} else {
			for (const [field_name_of_ITEM, field_name] of Object.entries(original_DATA_TYPE_field_names)) {
				if (field_name == name) {
					return c_bubble_app_DATA_TYPE_field_name(field_name_of_ITEM, ['_field', 'unique_']);
				}
			}
		}
		return null;
	}

	function extract_ITEM_data(field_name_of_ITEM, ITEM = null, visited = []) {
		let ITEM_data = {};
		if (!ITEM) {
			ITEM = properties[field_name_of_ITEM];
		}
		if (!!ITEM) {
			instance.data.attempts[field_name_of_ITEM] = (instance.data.attempts[field_name_of_ITEM] ?? 0) + 1;
			const ITEM_field_names = ITEM.listProperties();
			const original_data = ITEM_field_names.reduce((names, field_name) => {
				// cleaned up by stripping the bubble add-ons, like _field, _list, etc.
				const short_name = c_bubble_app_DATA_TYPE_field_name(field_name, bubblizing_add_ons);
				names[short_name] = ITEM.get(field_name);
				return names;
			}, {});
			ITEM_field_names.forEach(ITEM_field_name => {
				const DATA_TYPE_field_name = c_bubble_app_DATA_TYPE_field_name(ITEM_field_name, bubblizing_add_ons);
				const has_name = has_SERIOUSLY_name(DATA_TYPE_field_name) || has_SERIOUSLY_name(ITEM_field_name);
				const SERIOUSLY_name = c_SERIOUSLY_field_name(DATA_TYPE_field_name) ?? c_SERIOUSLY_field_name(ITEM_field_name);
				const value = ITEM.get(ITEM_field_name);
				LOG('extract ITEM field', ITEM_field_name, DATA_TYPE_field_name, SERIOUSLY_name, value);
				if (!ignore_fields.includes(DATA_TYPE_field_name)) {
					if (!SERIOUSLY_name) {
						if (has_name) {
							WARN('extracted SERIOUSLY name unresolved for', ITEM_field_name, 'item properties:', original_data);
						}
					} else if (!value) {
						if (value != null) {
							WARN('value undefined for', ITEM_field_name, 'item properties:', original_data);
						}
					} else if (ITEM_references.includes(DATA_TYPE_field_name) && typeof value != 'string') {
						LOG('recursively extract_ITEM_data', DATA_TYPE_field_name, value, visited);
						ITEM_data[SERIOUSLY_name] = extract_ITEM_data(DATA_TYPE_field_name, value, [...visited, DATA_TYPE_field_name]);
					} else if (!has_two_tables && LIST_names.includes(DATA_TYPE_field_name)) {
						const LIST_data = extract_LIST_data(ITEM_field_name, value, visited);
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
			// LOG('item data:', field_name_of_ITEM, ITEM_data);
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
			focus: extract_ITEM_data('focus_object'),
		}, null, 0);
	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			WARN('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			LOG('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}

