import { debug } from '../common/Debug';

export default class Files {
	static extras = [
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

	upload_json_object_fromFile(fileName: string): Object {
		return this.extract_json_object_from(new File([], fileName, {}));
	}
	
	removeExtras(key: string, value: any) {
		if (Files.extras.includes(key)) {
			return undefined;
		}
		return value;
	}

	download_json_object_toFile(object: Object, fileName: string): void {
		const content = JSON.stringify(object, this.removeExtras, 2)
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
		
	extract_json_object_from(file: File): Object {
		const reader = new FileReader();
		let json_object = new Object();
		reader.onload = function (e) {
            try {
				const result = (e.target?.result as string) ?? '';
				json_object = JSON.parse(result);
				console.log(json_object);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
		};
		reader.onerror = function () {
			console.log('bad file')
			debug.log_error('Error reading file.');
		};
		reader.readAsText(file);
		return json_object;
	}
	
}

export let files = new Files();