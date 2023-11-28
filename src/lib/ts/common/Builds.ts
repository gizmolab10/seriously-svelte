import { build } from '../managers/State';

class Builds {
	notes: { [id: number]: string[] } = {};
	constructor() {
		this.notes = { 
			66 : ['November 28, 2023', 'configure netlify content security profile'],
			65 : ['November 27, 2023', 'size slider'],
			64 : ['November 24, 2023', 'perfect scrolling'],
			63 : ['November 20, 2023', 'add select notification'],
			62 : ['November 13, 2023', 'cluster dot tweaks'],
			61 : ['November 13, 2023', 'lots of cosmetic cleanups & added query strings'],
			60 : ['November 12, 2023', 'massive cosmetic tweaks'],
			59 : ['November 9, 2023', 'added ip logging'],
			58 : ['November 3, 2023', 'begin work on reveal cluster'],
			57 : ['October 31, 2023', 'separate bulk collections'],
			56 : ['October 27, 2023', 'fat triangle for all reveal dots'],
			55 : ['October 25, 2023', 'double-click drag dot applies focus'],
			54 : ['October 21, 2023', 'restore details at left'],
			53 : ['October 20, 2023', 'fix add child bugs'],
			52 : ['October 13, 2023', 'new bulks correctly created'],
			51 : ['October 12, 2023', 'new admin view of all data'],
			50 : ['October 10, 2023', 'eliminate details view, show focus title at top'],
			49 : ['October 10, 2023', 'create private firebase bulks as needed'],
			48 : ['October 9, 2023', 'private firebase bulks'],
			47 : ['October 9, 2023', 'two netlify query strings'],
			46 : ['October 8, 2023', 'perfect editing and browsing'],
			45 : ['October 7, 2023', 'children origins are perfect'],
			44 : ['October 5, 2023', 'scrolling works'],
			43 : ['October 3, 2023', 'fetch Catalist data, HAH!'],
			41 : ['October 3, 2023', 'almost perfectly laid out graph'],
			40 : ['September 26, 2023', 'lines use children height'],
			39 : ['September 19, 2023', 'highlight grabbed root, eliminate line clipping'],
			38 : ['September 18, 2023', 'add fat triangle for focus, click it to go left'],
			37 : ['September 16, 2023', 'position widgets correctly at ends of curves'],
			36 : ['September 12, 2023', 'draw curves, switch public to show them'],
			35 : ['September 8, 2023', 'begin work on bubble.io plugin and svg'],
			34 : ['September 3, 2023', 'crumbs update on db switch'],
			33 : ['September 2, 2023', 'separate hierarchy for each db'],
			32 : ['August 31, 2023', 'manage order changes in snapshots'],
			31 : ['August 30, 2023', 'add child, duplicate and delete'],
			30 : ['August 26, 2023', 'clean construction of relationships'],
			29 : ['August 22, 2023', 'synchronize relocated things'],
			28 : ['August 21, 2023', 'synchronize title edits'],
			27 : ['August 20, 2023', 'firebase relationships'],
			26 : ['August 17, 2023', 'cloud abstraction layer'],
			25 : ['August 15, 2023', 'switch between db types'],
			24 : ['August 15, 2023', 'bulk for private/public, shared predicates'],
			23 : ['August 14, 2023', 'synchronization works, a goal 8 years long'],
			22 : ['August 13, 2023', 'locally persist db type'],
			21 : ['August 13, 2023', 'select db type'],
			20 : ['August 13, 2023', 'firebase private databases'],
			17 : ['August 12, 2023', 'better help'],
			12 : ['August 10, 2023', 'relocate things'],
			11 : ['August 8, 2023', 'display build number'],
			10 : ['August 2, 2023', 'refactor Panel into Startup'],
		}
		const keys = Object.keys(this.notes);
		build.set(Number(keys.slice(-1)));
	}

}

export const builds = new Builds();
