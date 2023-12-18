export enum ButtonID {
	buildNotes = 'show build notes',
	help	   = '?',
}

export enum CreationOptions {
	isFromRemote = 'isFrom',
	getRemoteID	 = 'getID',
	none		 = '',
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

const baseZIndex = 10000;

export enum ZIndex {
	panel	  = baseZIndex,
	text	  = baseZIndex + 10,
	lines	  = baseZIndex + 20,
	dots	  = baseZIndex + 30,
	widgets	  = baseZIndex + 40,
	frontmost = baseZIndex + 50,
	overlay	  = baseZIndex + 60,
}
