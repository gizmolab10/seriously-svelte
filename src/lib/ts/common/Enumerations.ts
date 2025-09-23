// DO NOT change the order of the following

export enum T_Order {	// need two orders, so .... ???
	child,
	other,
}

export enum T_Banner {
	controls,
	graph,
	crumbs,
}

export enum T_Startup {
	start,
	fetch,
	empty,
	ready,
}

export enum T_Search {
	off,
	enter,
	results,
	selected,
	rebuild_index,
}

export enum T_Details {
	header,
	actions,
	selection,
	tags,
	traits,
	preferences,
	data,
}

export enum T_Action {
	browse,
	focus,
	show,
	center,
	add,
	delete,
	move,
}

export enum T_Layer {
	common,
	graph,
	paging,
	radial,
	necklace,
	lines,
	thumbs,
	arc,
	widgets,
	dots,
	text,
	details,
	detailsPlus_1,
	detailsPlus_2,
	detailsPlus_3,
	box,
	rubberband,
	frontmost,
}

// the order of the following is unimportant

export enum T_Graph {
	radial = 'radial',
	tree   = 'tree',
}

export enum T_Direction {
	previous = '<',
	next	 = '>',
}

export enum T_Alteration {
	delete = 'delete',
	add	   = 'add',
}

export enum T_File_Operation {
	import = 'import',	// persist
	export = 'export',	// fetch
}

export enum T_Auto_Adjust {
	selection = 'center the selection',
	fit		  = 'exactly fit',
}

export enum T_Theme {
	standalone = 'standalone',
	bubble	   = 'bubble',
}

export enum T_Search_Filter {
	title = 'title',
	trait = 'trait',
	tags  = 'tags',
}

export enum T_Dragging {
	rubberband = 'rubberband',
	command	   = 'command',
	none	   = 'none',
}

export enum T_Widget {
	radial = 'radial',
	focus  = 'focus',
	tree   = 'tree',
}

export enum T_Tree_Line {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum T_Create {
	isFromPersistent = 'isFrom',
	getPersistentID	 = 'getID',
	none			 = '',
}

export enum T_Storage_Need {
	direction = 'direction',
	format	  = 'format',
	busy	  = 'busy',
}

export enum T_Persistence {
	remote = 'remote',
	local  = 'local',
	none   = 'none',
}

export enum T_Kinship {
	children = 'children',
	related  = 'related',
	parents  = 'parents',
}

export enum T_File_Format {
	seriously = 'seriously',
	cancel	  = 'cancel',
	json	  = 'json',
	csv		  = 'csv',
}

export enum T_Radial_Zone {
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

export enum T_Request {
	handle_click = 'handle_click',
	is_disabled	 = 'is_disabled',
	is_inverted	 = 'is_inverted',
	is_visible	 = 'is_visible',
	is_hit		 = 'is_hit',
	name		 = 'name',
}

export enum T_Signal {
	alteration	 = 'alteration',
	reposition	 = 'reposition',	// only for widgets
	reattach	 = 'reattach',
	rebuild		 = 'rebuild',
	thing		 = 'thing',
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
	isAllyOf	= 'isAllyOf',	// steve melville's term
	contains	= 'contains',
	explains	= 'explains',
	requires	= 'requires',
	supports	= 'supports',
}

export enum T_Control {
	details	 = 'show details view',
	builds	 = 'show build notes',
	recents	 = 'recents',
	import	 = 'import',
	search	 = 'search',
	shrink	 = 'shrink',
	grow	 = 'grow',
	help	 = '?',
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

export enum T_Thing {
	organization = 'o',
	externals	 = '^',	// list of bulks
	bookmark	 = 'b',
	generic		 = '-',
	person		 = 'p',
	folder		 = 'f',
	found		 = '?',
	root		 = '!',
	bulk		 = '~',
	meme		 = '*',
}

export enum T_Component {
	breadcrumbs = 'breadcrumbs',
	branches	= 'branches',
	radial		= 'radial',
	reveal		= 'reveal',
	widget		= 'widget',
	title		= 'title',
	drag		= 'drag',
	line		= 'line',
	none		= 'none',
	tree		= 'tree',
	app			= 'app',
}

export enum T_Trait {
	consequence = 'consequence',
	location	= 'location',
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
	database	 = 'database',
	details		 = 'details',
	control		 = 'control',
	action		 = 'action',
	button		 = 'button',
	cancel		 = 'cancel',
	reveal		 = 'reveal',
	search		 = 'search',
	widget		 = 'widget',
	title		 = 'title',
	drag		 = 'drag',
	none		 = 'none',
}

export enum T_Preference {
	expanded_children = 'expanded_children',
	focus_forChildren = 'focus_forChildren',
	expanded_parents  = 'expanded_parents',
	focus_forParents  = 'focus_forParents',
	other_databases	  = 'other_databases',
	relationships	  = 'relationships',
	detail_types	  = 'detail_types',			// vertical stack
	show_details	  = 'show_details',			// left side
	show_related	  = 'show_related',
	ring_radius		  = 'ring_radius',
	user_offset		  = 'user_offset',
	auto_adjust		  = 'auto_adjust',
	search_text		  = 'search_text',
	background		  = 'background',
	ring_angle  	  = 'ring_angle',
	countDots		  = 'countDots',
	font_size		  = 'font_size',
	separator		  = 'separator',
	base_id			  = 'base_id',
	details			  = 'details',				// visible details control
	grabbed			  = 'grabbed',
	bubble 			  = 'bubble',
	paging 			  = 'paging',
	traits			  = 'traits',
	levels			  = 'levels',
	graph			  = 'graph',
	scale			  = 'scale',
	focus			  = 'focus',
	local			  = 'local',
	thing	    	  = 'thing',
	font			  = 'font',
	tree			  = 'tree',
	db				  = 'db',
}
