function(instance, properties, context) {
	console.log("[PLUGIN] Initializing plugin ...");

	instance.canvas.style.height = window.innerHeight + "px";
	instance.canvas.style.width = window.innerWidth + "px";

	// Set up the iframe
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble&disable=full_UI";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";

	// Add load event listener
	iframe.onload = function () {
		console.log("[PLUGIN] Iframe loaded, sending any pending messages");
		instance.data.iframe = iframe;

		// Send any pending messages that were stored before iframe was ready
		if (instance.data.pendingMessages) {
			instance.data.pendingMessages.forEach(message => {
				try {
					iframe.contentWindow.postMessage(message, '*');
				} catch (error) {
					console.error("[PLUGIN] Failed to send pending message:", error);
				}
			});
			instance.data.pendingMessages = [];
		}
	};

	instance.canvas.appendChild(iframe);
}
