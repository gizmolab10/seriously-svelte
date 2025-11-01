function(instance) {
	instance.data.enable_logging				= false;
	instance.data.iframe_is_instantiated		= false;	// assure_iframe_is_instantiated (right below, called from update) sets this to true
	instance.data.LOG							= function (message, value, ...optionalParams) {if (instance.data.enable_logging && !!value) { console.log('[PLUGIN]', message, value, ...optionalParams); } }
	instance.data.assure_iframe_is_instantiated = function (properties) {
		if (!instance.data.iframe_is_instantiated) {
			if (!instance.data.iframe) {
				LOG('Initializing plugin ...');
				const iframe = document.createElement('iframe');
				iframe.src = url_from_properties(properties);
				iframe.style.overflow = 'hidden';
				iframe.style.border = 'none';
				iframe.style.height = '100%';
				iframe.style.width = '100%';
				instance.data.iframe = iframe;
				window.addEventListener('message', handle_webseriously_message);
			}
			instance.data.enable_logging = properties.enable_logging;
			instance.canvas.append(instance.data.iframe);
			instance.data.iframe_is_instantiated = true;
		}
	}

	function ERROR(message, ...optionalParams) { console.error(message, ...optionalParams); }
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }

	function url_from_properties(properties) {
		const disables = [
			'auto_save',
			properties.show_details ? 'unknown' : 'details',
			properties.show_details ? 'unknown' : 'standalone_UI'];
		const pairs = {
			db: 'bubble',
			debug: 'bubble',
			erase: properties.erase_user_settings ? 'settings' : 'unknown',
			disable: disables.join(',')
		}
		const queries = Object.entries(pairs).map(([key, value]) => `${key}=${value}`).join('&');
		const url = 'https://webseriously.netlify.app/?' + queries;
		LOG('url', url);
		return url;
	}

	//////////////////////////////////////////////////////////////
	//															//
	//		   handle messages sent from webseriously			//
	//   	  from inside the iframe established above			//
	//   see prepare_to_signal_bubble_plugin in DB_Bubble.ts	//
	//															//
	//////////////////////////////////////////////////////////////

	function handle_webseriously_message(event) {
		if (event.data && !event.data.hello) {
			switch (event.data.type) {
				case 'focus_id':
					instance.publishState('focus_id', event.data.id)
					break;
				case 'selected_ids':
					instance.publishState('selected_ids', event.data.ids)
					break;
				case 'trigger_an_event':
					instance.triggerEvent(event.data.trigger);
					break;
				case 'listening':
					instance.data.iframeIsListening = true;		// once set, no more messages will pend, update will send them all
					if (instance.data.pendingMessages) {		// update stored previously prepared messages (before iframe was ready to receive them)
						instance.data.pendingMessages.forEach(message => {
							try {
								instance.data.iframe.contentWindow.postMessage(message, '*');
							} catch (error) {
								ERROR('[PLUGIN] Failed to send pending message:', error);
							}
						});
						instance.data.pendingMessages = [];
					}
					break;
				default:
					break;
				}
			LOG('[PLUGIN] Received webseriously message type:', event.data.type);
		}
	}
}
