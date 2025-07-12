function(instance, properties, context) {
	if (instance.data.sendDataWhenReady) {
		instance.data.sendDataWhenReady();
	}
}
