function(instance) {
	instance.data.debug = true;
	instance.data.iframe_is_instantiated = false;
	instance.data.assure_iframe_is_instantiated = function (properties) {
		if (instance.data.iframe_is_instantiated) {
			return;
		}
		instance.data.iframe_is_instantiated = true;
		console.log('[PLUGIN] Initializing plugin ...');
		instance.canvas.style.width = window.innerWidth + 'px';
		instance.canvas.style.height = window.innerHeight + 'px';
		const iframe = document.createElement('iframe');
		instance.data.iframe = iframe;
		iframe.src = url_from_properties(properties);
		iframe.style.overflow = 'hidden';
		iframe.style.border = 'none';
		iframe.style.height = '100%';
		iframe.style.width = '100%';

		window.addEventListener('message', handle_webseriously_message);
		instance.canvas.appendChild(iframe);
	}

	function LOG(message, ...optionalParams) { if (instance.data.debug) { console.log(message, ...optionalParams); } }

	function url_from_properties(properties) {
		const disables = [
			'auto_save',
			'standalone_UI',
			properties.show_details ? 'unknown' : 'details'];
		const pairs = {
			db: 'bubble',
			debug: 'bubble',
			disable: disables.join(',')
		}
		const queries = Object.entries(pairs).map(([key, value]) => `${key}=${value}`).join('&');
		const url = 'https://webseriously.netlify.app/?' + queries;
		console.log('[PLUGIN] url', url);
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
					instance.data.iframeIsListening = true;		// once set, only these messages will pend, the rest are sent in update
					if (instance.data.pendingMessages) {		// Send any pending messages that were stored before iframe was ready
						instance.data.pendingMessages.forEach(message => {
							try {
								instance.data.iframe.contentWindow.postMessage(message, '*');
							} catch (error) {
								console.error('[PLUGIN] Failed to send pending message:', error);
							}
						});
						instance.data.pendingMessages = [];
					}
					break;
				default:
					break;
				}
			LOG('[PLUGIN] Received message:', event.data);
		}
	}
}
