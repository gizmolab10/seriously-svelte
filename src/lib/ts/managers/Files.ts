import { debug } from '../common/Debug';

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
	
	removeIgnorables(key: string, value: any) {
		if (Files.ignorables.includes(key)) {
			return undefined;
		}
		return value;
	}

	write_object_toFile(object: Object, fileName: string): void {
		const content = JSON.stringify(object, this.removeIgnorables, 2)
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	
	fetch_object_fromFile(fileName: string): Object {
		const file = new File([], fileName, {});
		const reader = new FileReader();
		let content = new Object();
		reader.onload = function (e) {
            try {
				const result = (e.target?.result as string) ?? '';
				console.log(`${fileName} "${result}"`);
				content = JSON.parse(result);
				console.log(content);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
		};
		reader.onerror = function () {
			console.log('bad file')
			debug.log_error('Error reading file.');
		};
		reader.readAsText(file);
		return content;
	}
	
}

export let files = new Files();