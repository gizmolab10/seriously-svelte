export enum AlteringParent {
	deleting = 'deleting',
	adding	 = 'adding',
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

const baseZIndex = 1;

export enum ZIndex {
	panel	  = baseZIndex,
	text	  = baseZIndex + 1,
	lines	  = baseZIndex + 2,
	dots	  = baseZIndex + 3,
	widgets	  = baseZIndex + 4,
	frontmost = baseZIndex + 5,
	tools	  = baseZIndex + 6,
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
