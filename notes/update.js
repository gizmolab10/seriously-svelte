function(instance, properties, context) {
	if (!instance.data.properties) {
		instance.data.properties = properties;
	}
	if (instance.data.sendDataWhenReady) {
		instance.data.sendDataWhenReady();
	}
}
