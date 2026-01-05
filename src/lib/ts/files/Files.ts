import { T_File_Format, T_Text_Extension, T_Image_Extension } from '../common/Enumerations';
import { tu } from '../utilities/Testworthy_Utilities';
import { T_Preview_Type } from '../types/Types';

export default class Files {
	format_preference: T_File_Format = T_File_Format.json;

	preview_type_forFilename(filename: string): T_Preview_Type {
		const ext = filename.split('.').pop()?.toLowerCase() || '';
		if (Object.values(T_Image_Extension).includes(ext as T_Image_Extension)) return 'image';
		if (Object.values(T_Text_Extension).includes(ext as T_Text_Extension)) return 'text';
		return null;
	}
	
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

	async fetch_fromFile(file: File): Promise<any> {
		const format = this.format_preference;
		switch (format) {
			case T_File_Format.seriously: return await this.extract_json_object_fromFile(file);
			case T_File_Format.json:	  return await this.extract_json_object_fromFile(file);
			case T_File_Format.csv:		  return await this.extract_csv_records_fromFile(file);
			default:					  throw new Error(`Unsupported format: ${format}`);
		}
	}

	private async extract_json_object_fromFile(file: File): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					reject('Empty file.');
				} else {
					try {
						const object = JSON.parse(result);
						resolve(object);
					} catch (error) {
						reject(`Error parsing JSON: '${result}' ${(error as Error).message}`);
					}
				}
			};
			reader.onerror = function () {
				reject('Error reading file.');
			};
			reader.readAsText(file);
		});
	}

	private async extract_csv_records_fromFile(file: File): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					reject('Empty file.');
					return;
				}
				try {
					// Replace commas inside quotes with a temporary marker
					let inQuotes = false;
					let processed = '';
					for (let i = 0; i < result.length; i++) {
						const character = result[i];
						if (character === '"') inQuotes = !inQuotes;
						else if (character === ',' && inQuotes) processed += '$$$$$$';
						else processed += character;
					}
					
					const lines = processed.split('\n').filter(line => line.trim().length > 0);
					if (lines.length === 0) {
						reject('No data found in CSV file.');
						return;
					}
					const headers = lines[0].split(',').map(header => header.trim());
					const records = lines.slice(1).map(line => {
						const values = line.split(',').map(value => value.trim().replace(/\$\$\$\$\$\$/g, ','));
						const record: Record<string, string> = {};
						headers.forEach((header, index) => {
							record[header] = values[index] || '';
						});
						return record;
					});
					resolve(records);
				} catch (error) {
					reject(`Error parsing CSV: ${(error as Error).message}`);
				}
			};
			reader.onerror = function () {
				reject('Error reading file.');
			};
			reader.readAsText(file);
		});
	}
	
	static readonly _____FORMAT: unique symbol;

}

export const files = new Files();