// DO NOT change the order of the following

export enum E_Order {	
	child,
	other,
}

export enum E_Banner {
	controls,
	crumbs,
	graph,
}

export enum E_Details {
	storage,
	tools,
	display,
	info,
}

export enum E_Info {		// identical to k.info
	segments,
	before_title,
	title,
	after_title,
	table,
	color,
	traits,
	consequence,
	quest
}

export enum E_Layer {
	common,
	paging,
	rings,
	necklace,
	lines,
	thumbs,
	arc,
	widgets,
	dots,
	text,
	tools,
	tool_buttons,
	details,
	frontmost,
}

// the order of the following is unimportant

export enum E_Graph {
	radial = 'radial',
	tree   = 'tree',
}

export enum E_Report {
	selection = 'selection',
	focus	  = 'focus',
}

export enum E_Alteration {
	delete = 'delete',
	add	   = 'add',
}

export enum E_Storage {
	import = 'import',
	export = 'export',
}

export enum E_Format {
	cancel = 'cancel',
	json   = 'json',
	csv	   = 'csv'
}

export enum E_Kinship {
	related = 'related',
	parent  = 'parent',
	child   = 'child',
}

export enum E_Widget {
	radial = 'radial',
	focus  = 'focus',
	tree   = 'tree',
}

export enum E_Curve {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum E_Create {
	isFromPersistent = 'isFrom',
	getPersistentID	 = 'getID',
	none			 = '',
}

export enum E_SvelteComponent {
	widget	= 'widget',		// *
	title	= 'title',
	app		= 'app',
}

export enum E_Startup {
	start = 'start',
	fetch = 'fetch',
	empty = 'empty',
	ready = 'ready',
}

export enum E_RingZone {
	resize = 'resize',
	paging = 'paging',
	rotate = 'rotate',
	miss   = 'miss',
}

export enum E_Oblong {
	middle = 'middle',
	right  = 'right',
	left   = 'left',
	full   = 'full',
}

export enum E_Thing {
	externals = '^',	// list of bulks
	generic	  = '',
	found	  = '?',
	root	  = '!',
	bulk	  = '~',	// bulk alias
}

export enum E_Predicate {
	appreciates = 'appreciates',
	isRelated	= 'isRelated',
	contains	= 'contains',
	explains	= 'explains',
	requires	= 'requires',
	supports	= 'supports',
}

export enum E_ToolRequest {
	handle_click = 'handle_click',
	is_disabled	 = 'is_disabled',
	is_inverted	 = 'is_inverted',
	is_visible	 = 'is_visible',
	is_hit		 = 'is_hit',
	name		 = 'name',
}

export enum E_Tool {
	browse,
	add,
	delete,
	move,
	list,
	show,
	graph,
}

export enum E_Control {
	details	 = 'show details view',
	builds	 = 'show build notes',
	related	 = 'show related',
	smaller	 = 'smaller',
	bigger	 = 'bigger',
	import	 = 'import',
	help	 = '?',
}

export enum E_Browser  {
	explorer = 'explorer',
	unknown  = 'unknown',
	firefox	 = 'firefox',
	chrome	 = 'chrome',
	safari	 = 'safari',
	opera	 = 'opera',
	orion	 = 'orion',
}

export enum E_Trait {
	consequence = 'consequence',
	hyperlink	= 'hyperlink',
	citation	= 'citation',
	generic		= 'generic',
	comment		= 'comment',
	money		= 'money',
	phone		= 'phone',
	quest		= 'quest',
	note		= 'note',
	date		= 'date',
	csv			= 'csv',
	sum			= 'sum',
}

export enum E_Element {
	radial_focus = 'radial_focus',
	breadcrumb 	 = 'breadcrumb',
	control		 = 'control',
	storage		 = 'storage',
	reveal		 = 'reveal',
	widget		 = 'widget',
	button		 = 'button',
	title		 = 'title',
	drag		 = 'drag',
	info		 = 'info',
	none		 = 'none',
	tool		 = 'tool',
}

export enum E_Preference {
	expanded_children = 'expanded_children',
	focus_forChildren = 'focus_forChildren',
	expanded_parents  = 'expanded_parents',
	focus_forParents  = 'focus_forParents',
	relationships	  = 'relationships',
	detail_types	  = 'detail_types',
	show_details	  = 'show_details',
	show_related	  = 'show_related',
	ring_radius		  = 'ring_radius',
	user_offset		  = 'user_offset',
	background		  = 'background',
	ring_angle  	  = 'ring_angle',
	countDots		  = 'countDots',
	font_size		  = 'font_size',
	base_id			  = 'base_id',
	grabbed			  = 'grabbed',
	paging 			  = 'paging',
	traits			  = 'traits',
	graph			  = 'graph',
	scale			  = 'scale',
	focus			  = 'focus',
	local			  = 'local',
	info	    	  = 'info',
	font			  = 'font',
	tree			  = 'tree',
	db				  = 'db',
}
