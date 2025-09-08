import { Thing } from "../common/Global_Imports";

export class Search_Node {
	nodes_byCharCode: Map<number, Search_Node> = new Map();
	items: Set<Thing> = new Set();
	isEndOfWord: boolean = false;

	// TRIE NODE --- short for "retrieval tree" or "prefix tree"
	// For efficient prefix-based searches
	// pronounced "try"
	// 
	// It's a tree-like data structure where:
	// 
	// Each node represents a character
	// Paths from root to nodes spell out strings
	// Common prefixes share the same path

	// 	Optimization Strategies:
	// 
	// 1. Lazy Set allocation: Only create Sets when items > 0
	// 2. Node pooling: Reuse deallocated nodes
	// 3. Compact arrays for small branching factors: Use arrays instead of Maps for nodes with few children

	get results(): Thing[] {
		return Array.from(this.items).sort((a, b) =>
			a.title.localeCompare(b.title)
		);
	}
	
	insert_wordFor(word: string, thing: Thing): void {
		let current: Search_Node = this;
		for (const char of word) {
			const charCode = char.charCodeAt(0);
			if (!current.nodes_byCharCode.has(charCode)) {
				current.nodes_byCharCode.set(charCode, new Search_Node());
			}
			// walk down the trie
			current = current.nodes_byCharCode.get(charCode)! as Search_Node;
			current.items.add(thing);
		}
		current.isEndOfWord = true;
	}

	search_for(query: string): Thing[] {
		const lowercase = query.toLowerCase();
		let current: Search_Node = this;
		for (const char of lowercase) {
			const charCode = char.charCodeAt(0);
			const child = current.nodes_byCharCode.get(charCode) as Search_Node;
			if (!child) return [];
			current = child;
		}
		return current.results;
	}

}