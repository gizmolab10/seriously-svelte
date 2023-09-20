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
	base			 = baseZIndex,
	lines			 = baseZIndex + 10,
	highlights = baseZIndex + 20,
	dots			 = baseZIndex + 30,
	text			 = baseZIndex + 40,
}
