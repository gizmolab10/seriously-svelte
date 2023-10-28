export enum ButtonID {
	buildNotes = 'show build notes',
	help				= '?',
}

export enum CreationFlag {
	none				= '',
	getRemoteID	= 'get',
	isFromRemote = 'isFrom'
}

export enum BrowserType  {
	unknown = 'unknown',
	explorer = 'explorer',
	firefox = 'firefox',
	chrome = 'chrome',
	safari = 'safari',
	opera = 'opera',
	orion = 'orion',
}

export enum LineCurveType {
	up = 'up',
	down = 'down',
	flat = 'flat',
}

const baseZIndex = 10000;

export enum ZIndex {
	base		= baseZIndex,
	text		= baseZIndex + 10,
	lines		= baseZIndex + 20,
	highlights	= baseZIndex + 30,
	dots		= baseZIndex + 40,
	frontmost	= baseZIndex + 50,
	overlay		= baseZIndex + 60,
}
