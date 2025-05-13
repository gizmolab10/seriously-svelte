import type { Handle_Result } from '../common/Types';
import { tu } from '../common/Testworthy_Utilities';
import { E_Format } from '../common/Enumerations';

export default class Files {
	format_preference: E_Format = E_Format.json;
	
	static readonly _____WRITE: unique symbol;

	persist_json_object_toFile(object: Object, fileName: string): void {
		const content = tu.stringify_object(object);
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	
	static readonly _____READ: unique symbol;

	async fetch_fromFile(file: File, onSuccess: Handle_Result, onFailure: Handle_Result) {
		const format = this.format_preference;
		switch (format) {
			case E_Format.json:	return await this.extract_json_object_fromFile(file, onSuccess, onFailure);
			case E_Format.csv:	return await this.extract_csv_records_fromFile(file, onSuccess, onFailure);
			default:			onFailure(`Unsupported format: ${format}`); return;
		}
	}
		
	private async extract_json_object_fromFile(file: File, onSuccess: Handle_Result, onFailure: Handle_Result = (() => {})) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			let object = new Object();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					onFailure('Empty file.');
				} else {
					try {
						object = JSON.parse(result);
						onSuccess(object);
						return { success: object };
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

	private async extract_csv_records_fromFile(file: File, onSuccess: Handle_Result, onFailure: Handle_Result = (() => {})) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					onFailure('Empty file.');
					return;
				}
				try {
					const lines = result.split('\n').filter(line => line.trim().length > 0);	// Split the CSV content into lines and remove empty lines
					if (lines.length === 0) {
						onFailure('No data found in CSV file.');
						return;
					}
					const headers = lines[0].split(',').map(header => header.trim());			// Get headers from first line0
					const records = lines.slice(1).map(line => {								// Parse remaining lines into records
						const values = line.split(',').map(value => value.trim());
						const record: Record<string, string> = {};
						headers.forEach((header, index) => {
							record[header] = values[index] || '';
						});
						return record;
					});
					onSuccess(records);
					return { success: records };
				} catch (error) {
					onFailure(`Error parsing CSV: ${(error as Error).message}`);
				}
			};
			reader.onerror = function () {
				onFailure('Error reading file.');
			};
			reader.readAsText(file);
		});
	}
	
	static readonly _____FORMAT: unique symbol;

}

export let files = new Files();