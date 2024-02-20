export enum IDButton {
	builds		= 'show build notes',
	relations	= 'relations',
	smaller		= 'smaller',
	bigger		= 'bigger',
	layout		= 'layout',
	help		= '?',
}

export enum IDLine {
	up	 = 'up',
	down = 'down',
	flat = 'flat',
}

export enum IDTrait {
	roots = '^',
	root  = '!',
	bulk  = '~',
}

export enum IDTool {
	deleteParent = 'deleteParent',
	addParent	 = 'addParent',
	cluster		 = 'cluster',
	delete		 = 'delete',
	next		 = 'next',
	more		 = 'more',
	add     	 = 'add',
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

export enum AlteringParent {
	deleting = 'deleting',
	adding	 = 'adding',
}

export enum CreationOptions {
	isFromRemote = 'isFrom',
	getRemoteID	 = 'getID',
	none		 = '',
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
