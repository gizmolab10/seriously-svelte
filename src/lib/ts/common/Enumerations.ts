// DO NOT change the order of the following

export enum T_Order {	
	child,
	other,
}

export enum T_Banner {
	controls,
	crumbs,
	graph,
}

export enum T_Details {
	header,
	storage,
	tools,
	display,
	info,
	tags,
	traits,
}

export enum T_Tool {
	browse,
	add,
	delete,
	move,
	list,
	show,
	graph,
}

export enum T_Layer {
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

export enum T_Graph {
	radial = 'radial',
	tree   = 'tree',
}

export enum T_Info {
	selection = 'selection',
	focus	  = 'focus',
}

export enum T_Alteration {
	delete = 'delete',
	add	   = 'add',
}

export enum T_Storage {
	import = 'import',
	export = 'export',
}

export enum T_Kinship {
	related = 'related',
	parent  = 'parent',
	child   = 'child',
}

export enum T_Widget {
	radial = 'radial',
	focus  = 'focus',
	tree   = 'tree',
}

export enum T_Curve {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum T_Create {
	isFromPersistent = 'isFrom',
	getPersistentID	 = 'getID',
	none			 = '',
}

export enum T_SvelteComponent {
	widget	= 'widget',		// *
	title	= 'title',
	app		= 'app',
}

export enum T_Storage {
	direction = 'direction',
	working	  = 'working',
	format	  = 'format',
}

export enum T_Persistence {
	remote = 'remote',
	local  = 'local',
	none   = 'none',
}

export enum T_Startup {
	start = 'start',
	fetch = 'fetch',
	empty = 'empty',
	ready = 'ready',
}

export enum T_RingZone {
	resize = 'resize',
	paging = 'paging',
	rotate = 'rotate',
	miss   = 'miss',
}

export enum T_Oblong {
	middle = 'middle',
	right  = 'right',
	left   = 'left',
	full   = 'full',
}

export enum T_File {
	seriously = 'seriously',
	cancel	  = 'cancel',
	json	  = 'json',
	csv		  = 'csv',
}

export enum T_Persistable {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
	tags		  = 'Tags',
}

export enum T_Predicate {
	appreciates = 'appreciates',
	isRelated	= 'isRelated',
	contains	= 'contains',
	explains	= 'explains',
	requires	= 'requires',
	supports	= 'supports',
}

export enum T_ButtonRequest {
	handle_click = 'handle_click',
	is_disabled	 = 'is_disabled',
	is_inverted	 = 'is_inverted',
	is_visible	 = 'is_visible',
	is_hit		 = 'is_hit',
	name		 = 'name',
}

export enum T_Control {
	details	 = 'show details view',
	builds	 = 'show build notes',
	related	 = 'show related',
	smaller	 = 'smaller',
	bigger	 = 'bigger',
	import	 = 'import',
	help	 = '?',
}

export enum T_Thing {
	externals = '^',	// list of bulks
	bookmark  = 'b',
	generic	  = '',
	folder	  = 'f',
	found	  = '?',
	root	  = '!',
	bulk	  = '~',	// bulk alias
}

export enum T_Browser  {
	explorer = 'explorer',
	unknown  = 'unknown',
	firefox	 = 'firefox',
	chrome	 = 'chrome',
	safari	 = 'safari',
	opera	 = 'opera',
	orion	 = 'orion',
}

export enum T_Trait {
	consequence = 'consequence',
	citation	= 'citation',
	comment		= 'comment',
	money		= 'money',
	phone		= 'phone',
	quest		= 'quest',
	text		= 'text',
	date		= 'date',
	link		= 'link',
	note		= 'note',
	sum			= 'sum',
}

export enum T_Element {
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

export enum T_Preference {
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
