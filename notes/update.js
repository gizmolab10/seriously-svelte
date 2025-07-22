async function(instance, properties, context) {
	// console.log('[PLUGIN] update:\ninstance', instance, '\nproperties', properties, '\ncontext', context);

	// Store context if not already stored
	if (!instance.data.context) {
		instance.data.context = context;
	}
	if (!instance.data.properties) {
		instance.data.properties = properties;
	}

	// Only use context.async once at top level
	return context.async(async (callback) => {
		try {
			if (typeof instance.data.sendDataWhenReady === "function") {
				await instance.data.sendDataWhenReady(); // uses stored context internally
			}
			callback(null, true);
		} catch (e) {
			console.log("[PLUGIN] update failed...", e);
			callback(null, false);
		}
	});
}
