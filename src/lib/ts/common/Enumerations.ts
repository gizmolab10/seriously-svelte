export enum ButtonID {
	buildNotes = 'show build notes',
	help	   = '?',
}

export enum CreationOptions {
	isFromRemote = 'isFrom',
	getRemoteID	 = 'getID',
	none		 = '',
}

export enum EditMode {
	normal	  = 'n',
	addParent = 'p',
}

export enum BrowserType  {
	unknown  = 'unknown',
	explorer = 'explorer',
	firefox	 = 'firefox',
	chrome	 = 'chrome',
	safari	 = 'safari',
	opera	 = 'opera',
	orion	 = 'orion',
}

export enum LineCurveType {
	up	 = 'up',
	down = 'down',
	flat = 'flat',
}

export enum TraitType {
	roots = '^',
	root  = '!',
	bulk  = '~',
}

const baseZIndex = 1;

export enum ZIndex {
	panel	  = baseZIndex,
	text	  = baseZIndex + 1,
	lines	  = baseZIndex + 2,
	dots	  = baseZIndex + 3,
	widgets	  = baseZIndex + 4,
	frontmost = baseZIndex + 5,
	overlay	  = baseZIndex + 6,
}
