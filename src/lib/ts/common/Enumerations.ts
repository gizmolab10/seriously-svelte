export enum AlterationType {
	deleting = 'deleting',
	adding	 = 'adding',
}

export enum LayoutStyle {
	clusters = 'clusters',
	tree	= 'tree',
}

export enum PredicateKind {
	isRelated = 'isRelated',
	contains  = 'contains',
}

export enum GraphRelations {
	children = 'children',
	parents	 = 'parents',
	related  = 'related',
}

export enum CreationOptions {
	isFromRemote = 'isFrom',
	getRemoteID	 = 'getID',
	none		 = '',
}

export enum IDLine {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum IDTrait {
	roots = '^',
	root  = '!',
	bulk  = '~',
}

export enum SvelteComponentType {
	necklace = 'necklace',	// *
	banners	 = 'banners',	// *
	paging	 = 'paging',	// *
	widget	 = 'widget',
	button	 = 'button',
	reveal	 = 'reveal',
	thumb	 = 'thumb',		// *
	title	 = 'title',
	drag	 = 'drag',
	line	 = 'line',
	ring	 = 'ring',		// **
}

export enum IDButton {
	details		= 'show details view',
	builds		= 'show build notes',
	relations	= 'relations',
	smaller		= 'smaller',
	bigger		= 'bigger',
	layout		= 'layout',
	help		= '?',
}

export enum IDBrowser  {
	explorer = 'explorer',
	unknown  = 'unknown',
	firefox	 = 'firefox',
	chrome	 = 'chrome',
	safari	 = 'safari',
	opera	 = 'opera',
	orion	 = 'orion',
}

export enum ZIndex {
	common,
	panel,
	lines,
	text,
	dots,
	widgets,
	tools,
	tool_buttons,
	frontmost,
}

export enum IDTool {
	delete_confirm	= 'delete_confirm',
	delete_cancel	= 'delete_cancel',
	delete_parent	= 'delete_parent',
	confirmation	= 'confirmation',
	add_parent		= 'add_parent',
	dismiss			= 'dismiss',
	cluster			= 'cluster',
	delete			= 'delete',
	create    		= 'create',
	next			= 'next',
	more			= 'more',
	none			= 'none',
}
