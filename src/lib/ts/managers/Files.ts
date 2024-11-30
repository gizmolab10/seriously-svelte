export default class Files {
	static ignorables = [
		'dbType',
		'baseID',
		'idHashed',
		'isEditing',
		'isGrabbed',
		'stateIndex',
		'needsWrite',
		'oneAncestry',
		'page_states',
		'already_saved',
		'selectionRange',
		'awaitingCreation',
		'hasPersistentStorage'
	];

	write_object_toFile(object: Object, fileName: string): void {
		const content = JSON.stringify(object, this.removeIgnorables, 2)
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	
	removeIgnorables(key: string, value: any) {
		if (Files.ignorables.includes(key)) {
			return undefined;
		}
		return value;
	}
	
}

export let f = new Files();