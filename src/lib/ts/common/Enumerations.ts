export enum Alteration {
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

export enum ArcKind {
	main = 'main',
	fork = 'fork',
	gap	 = 'gap',
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

export enum Quadrant {
	upperRight = 'ur',	// threeQuarters
	lowerLeft  = 'll',	// quarter
	upperLeft  = 'ul',	// half
	lowerRight = 'lr'	// 0
}

export enum Angle {
	threeQuarters = Math.PI * 3 / 2,
	quarter = Math.PI / 2,
	full = Math.PI * 2,
	half = Math.PI,
	zero = 0,
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
	frontmost,
	tools,
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
}
