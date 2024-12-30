export enum AlterationType {
	deleting = 'deleting',
	adding	 = 'adding',
}

export enum Graph_Type {
	radial = 'radial',
	tree  = 'tree',
}

export enum InfoType {
	selection = 'selection',
	focus	  = 'focus',
}

export enum IDStorage {
	import = 'import',
	export = 'export',
}

export enum Tree_Type {
	children = 'children',
	parents	 = 'parents',
	related  = 'related',
}

export enum CreationOptions {
	isFromPersistent = 'isFrom',
	getPersistentID	 = 'getID',
	none			 = '',
}

export enum IDLine {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum Details_Type {	// do not change the order
	storage,
	tools,
	recents,
	info,
}

export const all_detail_types = [
	Details_Type[Details_Type.storage],
	Details_Type[Details_Type.tools],
	Details_Type[Details_Type.recents],
	Details_Type[Details_Type.info]];

export enum Startup_State {
	start = 'start',
	fetch = 'fetch',
	empty = 'empty',
	ready = 'ready',
}

export enum ThingType {
	generic = '',
	roots	= '^',
	root	= '!',
	bulk	= '~',
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

export enum PredicateKind {
	appreciates = 'appreciates',
	isRelated	= 'isRelated',
	contains	= 'contains',
	explains	= 'explains',
	requires	= 'requires',
	supports	= 'supports',
}

export enum TraitType {
	consequence = 'consequence',
	hyperlink	= 'hyperlink',
	generic		= 'generic',
	money		= 'money',
	phone		= 'phone',
	quest		= 'quest',
	note		= 'note',
	date		= 'date',
	sum			= 'sum',
}

export enum IDControl {
	details	 = 'show details view',
	builds	 = 'show build notes',
	smaller	 = 'smaller',
	bigger	 = 'bigger',
	open	 = 'open',
	help	 = '?',
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

export enum ElementType {
	control	= 'control',
	storage	= 'storage',
	reveal	= 'reveal',
	widget	= 'widget',
	crumb	= 'crumb',
	focus	= 'focus',
	drag	= 'drag',
	info	= 'info',
	none	= 'none',
	tool	= 'tool',
}

export enum Rebuild_Type {
	directional = 'directional',
	clusters	= 'clusters',		// only this enum is used (in Radial_Graph)
	necklace	= 'necklace',
	reveal		= 'reveal',
	widget		= 'widget',
	crumbs		= 'crumbs',
	crumb		= 'crumb',
	tools		= 'tools',
	radial		= 'radial',
	panel		= 'panel',
	info		= 'info',
	tree		= 'tree',
	line		= 'line',
	drag		= 'drag',
}

export enum ZIndex {	// DO NOT change the order
	common,
	paging,
	radial,
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
	delete_confirm = 'delete_confirm',
	delete_cancel  = 'delete_cancel',
	delete_parent  = 'delete_parent',
	confirmation   = 'confirmation',
	add_parent	   = 'add_parent',
	dismiss		   = 'dismiss',
	delete		   = 'delete',
	create    	   = 'create',
	next		   = 'next',
	more		   = 'more',
	none		   = 'none',
}

export enum SvelteComponentType {
	banners	= 'banners',
	details	= 'details',
	rotate	= 'rotate',
	paging	= 'paging',
	widget	= 'widget',		// *
	button	= 'button',		// *
	reveal	= 'reveal',
	graph	= 'graph',
	thumb	= 'thumb',
	tools	= 'tools',
	title	= 'title',		// *
	drag	= 'drag',
	line	= 'line',
	app		= 'app',
}
