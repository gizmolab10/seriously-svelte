function(instance, properties, context) {
	console.log('[PLUGIN] Initializing plugin ...');
	instance.canvas.style.width = window.innerWidth + 'px';
	instance.canvas.style.height = window.innerHeight + 'px';
	const iframe = document.createElement('iframe');
	iframe.src = 'https://webseriously.netlify.app/?db=bubble&disable=details';
	iframe.style.overflow = 'hidden';
	iframe.style.border = 'none';
	iframe.style.height = '100%';
	iframe.style.width = '100%';
	instance.data.iframe = iframe;

	window.addEventListener('message', function (event) {
		if (event.data) {
			switch (event.data.type) {
				case 'focus':
					instance.publishState('focus', event.data.glob);
					break;
				case 'select':
					instance.publishState('selected', event.data.globs);
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
					console.log('[PLUGIN] Received message:', event.data);
					break;
			}
		}
	});

	instance.canvas.appendChild(iframe);
}
