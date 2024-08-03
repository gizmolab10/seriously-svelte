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

export enum ZIndex {	// do not change the order
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
	none			= 'none',
	next			= 'next',
	more			= 'more',
	delete			= 'delete',
	create    		= 'create',
	dismiss			= 'dismiss',
	cluster			= 'cluster',
	add_parent		= 'add_parent',
	confirmation	= 'confirmation',
	delete_cancel	= 'delete_cancel',
	delete_parent	= 'delete_parent',
	delete_confirm	= 'delete_confirm',
}

export enum SvelteComponentType {
	rotation = 'rotation',
	banners	 = 'banners',
	details	 = 'details',
	paging	 = 'paging',
	widget	 = 'widget',	// *
	button	 = 'button',	// *
	reveal	 = 'reveal',
	graph	 = 'graph',
	thumb	 = 'thumb',
	tools	 = 'tools',
	title	 = 'title',		// *
	drag	 = 'drag',
	line	 = 'line',
	app		 = 'app',
}
