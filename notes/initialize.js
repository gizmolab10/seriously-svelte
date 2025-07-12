function(instance, properties, context) {
	console.warn("[PLUGIN] Initializing plugin and checking for hydration...");
	console.warn("[PLUGIN] relationships_table_list?", properties.relationships_table_list);
	console.warn("[PLUGIN] keys in properties:", Object.keys(properties));
	instance.data.dataIsReady = false;
	instance.data.iframeListening = false;

	function dataIsReady() {
		const objList = properties.objects_table_list;
		const relList = properties.relationships_table_list;

		const objsReady = !!objList &&
			typeof objList.length === "function" &&
			typeof objList.get === "function" &&
			objList.length() > 0 &&
			objList.get(0);

		const relsReady = !!relList &&
			typeof relList.length === "function" &&
			typeof relList.get == "function" &&
			relList.length() > 0 &&
			relList.get(0);

		return objsReady && relsReady;
	}

	function readyToUpdate() {
		const ready = dataIsReady() &&
			instance.data.iframeListening &&
			instance.data.dataIsReady == 'yes' &&
			instance.data.iframe?.contentWindow;

		return ready;
	}

	function sendAllData() {
		if (!readyToUpdate()) {
			console.warn("[PLUGIN] Update aborted: too soon", instance.data.dataIsReady);
		} else {
			console.warn("[PLUGIN] Update proceeding...");
			function serializeObject(object) {
				const result = {};
				const fields = object?.listProperties?.() || [];
				for (const key of fields) {
					result[key] = object.get(key);
				}
				return result;
			}
			function serializeList(list) {
				const items = list?.listProperties?.() || [];
				return items.map(serializeObject);
			}
			const serializedObjects = serializeList(properties.objects_table_list);
			const serializedRelationships = serializeList(properties.relationships_table_list);

			const message = {
				type: "update",
				objectsTable: JSON.stringify(serializedObjects),
				relationshipsTable: JSON.stringify(serializedRelationships),
				startingObject: properties.starting_object?.get?.("_id") ?? null,
				objectTitleField: properties.object_title_field,
				objectChildrenField: properties.object_children_field,
				objectIdField: properties.object_id_field,
				relationshipIdField: properties.relationship_id_field,
				objectColorField: properties.object_color_field,
				objectTypeField: properties.object_type_field
			};
			instance.data.iframe.contentWindow.postMessage(message, "*");
		}
	}

	function sendDataWhenReady() {
		// If hydration watcher is already running, do nothing
		if (instance.data._hydrationTimer) {
			console.warn("[PLUGIN] Hydration timer already running.");
			return;
		}
		console.log("[PLUGIN] Starting hydration watcher...");
		instance.data._hydrationTimer = setInterval(() => {
			console.log("[PLUGIN] watching...");
			if (readyToUpdate()) {
				clearInterval(instance.data._hydrationTimer);
				instance.data._hydrationTimer = null;
				instance.data.dataIsReady = true;
				sendAllData();
			}
		}, 500);
	}

	instance.data.sendDataWhenReady = sendDataWhenReady;

	// Set up postMessage listener
	console.log("[INIT] registering message handler");
	instance.data.messageQueue = instance.data.messageQueue || [];

	function handleMessage(event) {
		if (event.data?.type === "listening") {
			console.log("[PLUGIN] Iframe is listening");
			instance.data.iframeListening = true;
			const queue = instance.data.messageQueue;
			while (queue.length > 0) {
				const message = queue.shift();
				instance.data.iframe?.contentWindow?.postMessage(message, "*");
			}
		} else if (!(event.data?.hello ?? false)) {
			console.log("[PLUGIN] Received message:", event.data);
		}
	}

	window.addEventListener("message", handleMessage);

	// Set up the iframe
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";
	instance.canvas.appendChild(iframe);
	instance.data.iframe = iframe;
}
