import type { Handle_Result } from '../common/Types';
import { u } from '../common/Utilities';

export default class Files {

	static readonly WRITE: unique symbol;

	persist_json_object_toFile(object: Object, fileName: string): void {
		const content = u.stringify_object(object);
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}

	static readonly READ: unique symbol;

	async fetch_json_object_fromFile(fileName: string, onSuccess: Handle_Result, onFailure: Handle_Result)  {
		return await files.extract_json_object_fromFile(new File([], fileName, {}), onSuccess, onFailure);
	}
		
	async extract_json_object_fromFile(file: File, onSuccess: Handle_Result, onFailure: Handle_Result = (() => {})) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			let json_object = new Object();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					onFailure('Empty file.');
				} else {
					try {
						json_object = JSON.parse(result);
						onSuccess(json_object);
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
		});
	}
	
}

export let files = new Files();