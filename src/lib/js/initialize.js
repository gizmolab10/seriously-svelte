function(instance, context) {
	console.log("[INIT] registering message handler");
	instance.data.messageQueue = instance.data.messageQueue || [];
	instance.data.iframeReady = false;
	function handleMessage(event) {
		if (event.data?.type === "listening") {
			console.log("[PLUGIN] Iframe is listening");
			instance.data.iframeListening = true;
			const queue = instance.data.messageQueue;
			while (queue.length > 0) {
				const message = queue.shift();
				if (instance.data.iframe?.contentWindow) {
					instance.data.iframe.contentWindow.postMessage(message, "*");
				}
			}
		} else if (event.data?.type != "hello") {
			console.log("[PLUGIN] Received message:", event.data);
		}
	};
	window.addEventListener("message", handleMessage);
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";
	instance.canvas.appendChild(iframe);
	instance.data.iframe = iframe;
}
