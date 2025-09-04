function(instance, properties, context) {
	console.log('[PLUGIN] Initializing plugin ...');
	instance.canvas.style.width = window.innerWidth + 'px';
	instance.canvas.style.height = window.innerHeight + 'px';
	const iframe = document.createElement('iframe');
	const debug = false;
	function log(message, ...optionalParams) { if (debug) { console.log(message, ...optionalParams); } }
	iframe.src = 'https://webseriously.netlify.app/?db=bubble&disable=details';
	iframe.style.overflow = 'hidden';
	iframe.style.border = 'none';
	iframe.style.height = '100%';
	iframe.style.width = '100%';
	instance.data.iframe = iframe;

	window.addEventListener('message', function (event) {
		if (event.data && !event.data.hello) {
			switch (event.data.type) {
				// these are sent from webseriously iframe
				// see setup_subscriptions in DB_Bubble.ts
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
								iframe.contentWindow.postMessage(message, '*');
							} catch (error) {
								console.error('[PLUGIN] Failed to send pending message:', error);
							}
						});
						instance.data.pendingMessages = [];
					}
					break;
				default:
					log('[PLUGIN] Received message:', event.data);
					break;
			}
		}
	});

	instance.canvas.appendChild(iframe);
}
