export enum ButtonID {
	buildNotes = 'show build notes',
	help	   = '?',
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

export enum TypeLC {
	up	 = 'up',
	down = 'down',
	flat = 'flat',
}

export enum TypeT {
	roots = '^',
	root  = '!',
	bulk  = '~',
}

export enum TypeCT {
	deleteParent = 'deleteParent',
	addParent	 = 'addParent',
	cluster		 = 'cluster',
	delete		 = 'delete',
	next		 = 'next',
	more		 = 'more',
	add     	 = 'add',
}

export enum TypeB  {
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
