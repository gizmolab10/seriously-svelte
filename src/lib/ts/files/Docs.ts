// Documentation structure for DB_Docs
// This represents the /notes/designs hierarchy
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Run: bash notes/tools/create_docs_db_data.sh to regenerate

export interface DocNode {
	id: string;
	name: string;
	type: 'folder' | 'file';
	path: string;
	link?: string;
	children?: DocNode[];
}

export function getDocsStructure(): DocNode[] {
	return [
	];
}
