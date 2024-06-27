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

export enum ArcPart {
	outer = 'outer',
	main  = 'main',
	fork  = 'fork',
	gap	  = 'gap',
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
	widget	= 'widget',
	button	= 'button',
	reveal	= 'reveal',
	title	= 'title',
	drag	= 'drag',
	line	= 'line',
	ring	= 'ring',
}

export enum Quadrant {
	upperRight = 'ur',	// threeQuarters
	lowerLeft  = 'll',	// quarter
	upperLeft  = 'ul',	// half
	lowerRight = 'lr'	// 0
}

export enum Angle {						// angles begin at 3 o'clock & rotate up (counter-clockwise)
	zero = 0,							// far right (3 o'clock)
	full = Math.PI * 2,					// same as (normalizes to) zero
	quarter = Math.PI / 2,				// zenith (12 o'clock)
	half = Math.PI,						// far left (9 o'clock)
	threeQuarters = Math.PI * 3 / 2,	// nadir (6 o'clock)
}

export enum ElementType {
	generic	= 'generic',
	advance	= 'advance',
	control	= 'control',
	widget	= 'widget',
	reveal	= 'reveal',
	focus	= 'focus',
	crumb	= 'crumb',
	tool	= 'tool',
	drag	= 'drag',
	none	= 'none',
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
