export enum AlterationType {
	deleting = 'deleting',
	adding	 = 'adding',
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

export enum ThingType {
	generic  = '',
	roots = '^',
	root  = '!',
	bulk  = '~',
}

export enum Ring_Zone {
	miss   = 'miss',
	resize = 'resize',
	rotate = 'rotate',
	paging = 'paging',
}

export enum Oblong_Part {
	middle = 'middle',
	right  = 'right',
	left   = 'left',
	full   = 'full',
}

export enum TraitType {
	consequence = 'consequence',
	hyperlink = 'hyperlink',
	generic = 'generic',
	phone = 'phone',
	quest = 'quest',
	note = 'note',
	date = 'date',
	sum = 'sum',
}

export enum IDButton {
	details		= 'show details view',
	builds		= 'show build notes',
	relations	= 'relations',
	smaller		= 'smaller',
	bigger		= 'bigger',
	layout		= 'layout',
	open		= 'open',
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

export enum Rebuild_Type {
	directional = 'directional',
	clusters = 'clusters',
	necklace = 'necklace',
	reveal = 'reveal',
	widget = 'widget',
	crumbs = 'crumbs',
	crumb = 'crumb',
	tools = 'tools',
	rings = 'rings',
	panel = 'panel',
	info = 'info',
	tree = 'tree',
	line = 'line',
	drag = 'drag',
}

export enum ElementType {
	generic	= 'generic',
	control	= 'control',
	widget	= 'widget',
	reveal	= 'reveal',
	focus	= 'focus',
	crumb	= 'crumb',
	thumb	= 'thumb',
	info	= 'info',
	tool	= 'tool',
	drag	= 'drag',
	open	= 'open',
	none	= 'none',
	arc		= 'arc',
}

export enum ZIndex {	// do not change the order
	common,
	paging,
	rings,
	backmost,
	lines,
	text,
	dots,
	widgets,
	tools,
	tool_buttons,
	details,
	frontmost,
}

export enum IDTool {
	none			= 'none',
	next			= 'next',
	more			= 'more',
	delete			= 'delete',
	create    		= 'create',
	dismiss			= 'dismiss',
	add_parent		= 'add_parent',
	confirmation	= 'confirmation',
	delete_cancel	= 'delete_cancel',
	delete_parent	= 'delete_parent',
	delete_confirm	= 'delete_confirm',
}

export enum SvelteComponentType {
	rotate = 'rotate',
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
