import type { Handle_Result } from '../common/Types';

export default class Files {
	static extras = [
		'dbType',
		'baseID',
		'idHashed',
		'isEditing',
		'isGrabbed',
		'needs_persisting_again',
		'oneAncestry',
		'page_states',
		'already_persisted',
		'selectionRange',
		'awaitingCreation',
		'hasPersistentStorage'
	];

	static readonly $_WRITE_$: unique symbol;
	
	removeExtras(key: string, value: any) {
		if (Files.extras.includes(key)) {
			return undefined;
		}
		return value;
	}

	persist_json_object_toFile(object: Object, fileName: string): void {
		const content = JSON.stringify(object, this.removeExtras, 2)
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}

	static readonly READ: unique symbol;

	async fetch_json_object_fromFile(fileName: string, onSuccess: Handle_Result, onFailure: Handle_Result)  {
		return await files.extract_json_object_from(new File([], fileName, {}), onSuccess, onFailure);
	}
		
	async extract_json_object_from(file: File, onSuccess: Handle_Result, onFailure: Handle_Result = (() => {})) {
		const reader = new FileReader();
		let json_object = new Object();
		reader.onload = function (e) {
			const result = (e.target?.result as string);
			if (!result || result.length == 0) {
				onFailure('Empty file.');
			} else {
				try {
					json_object = JSON.parse(result);
					console.log(json_object);
					onSuccess(json_object)
					return { success: json_object };
				} catch (error) {
					onFailure(`Error parsing JSON: '${result}' ${(error as Error).message}`);
				}
			}
		};
		reader.onerror = function () {
			onFailure('Error reading file.');
		};
		reader.readAsText(file);
	}
	
}

export let files = new Files();