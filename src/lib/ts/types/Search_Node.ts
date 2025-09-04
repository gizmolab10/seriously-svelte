export class Search_Node {
	children: Map<string, Search_Node> = new Map();
	items: Set<Search_Node> = new Set(); // Items that contain this substring
	isEndOfWord: boolean = false;
}