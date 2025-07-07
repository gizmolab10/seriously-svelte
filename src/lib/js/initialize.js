function(instance, context) {
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";
	instance.canvas.appendChild(iframe);
	instance.data.iframe = iframe;
	instance.data.messageQueue = instance.data.messageQueue || [];
	instance.data.iframeReady = false;
	function handleMessage(e: Event) {
		const event = e as MessageEvent;
		if (event.data?.type === "ready") {
			console.log("[PLUGIN] Iframe is ready");
			instance.data.iframeReady = true;
			const queue = instance.data.messageQueue;
			while (queue.length > 0) {
				const message = queue.shift();
				if (instance.data.iframe?.contentWindow) {
					instance.data.iframe.contentWindow.postMessage(message, "*");
				}
			}
		} else {
			console.log("[PLUGIN] Received message:", event.data);
		}
	};
	window.addEventListener("message", handleMessage);
}
