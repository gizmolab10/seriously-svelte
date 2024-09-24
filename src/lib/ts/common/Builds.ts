import { k } from './Constants';

class Builds {
	notes: { [id: number]: Array<string> } = {};

	get latest() {
		const keys = Object.keys(this.notes);
		return keys.slice(-1)[0];
	}

	constructor() {
		this.notes = {
			113 : ['September 24, 2024', 'details textarea'],
			112 : ['September 12, 2024', 'new info details'],
			111 : ['September 8, 2024', 'new resize ring'],
			110 : ['August 30, 2024', 'airtable dbid support'],
			109 : ['August 22, 2024', 'rotate cluster label tangent to arc'],
			108 : ['August 18, 2024', 'paging persists for multiple things and dbs'],
			107 : ['August 12, 2024', 'thumb works (funky)'],
			106 : ['August 1, 2024', 'fixed netlify cluster mode'],
			105 : ['July 30, 2024', 'corrected thumb position and shape of arc and thumb'],
			104 : ['July 2, 2024', 'save and restore paging thumb position'],
			103 : ['June 30, 2024', 'paging thumb button works'],
			102 : ['June 18, 2024', 'visibility logic for advance buttons'],
			101 : ['June 13, 2024', 'limit the number of things within each cluster'],
			100 : ['June 6, 2024', 'significantly reduce stutter during rotation_ring rotation'],
			99 : ['June 4, 2024', 'expand help content and move to help-webseriously.netlify.app'],
			98 : ['May 23, 2024', 'double-click drag to alter ring button radius'],
			97 : ['May 20, 2024', 'cluster rotation perfected, improved memory usage'],
			96 : ['May 14, 2024', 'nearly perfect cluster curly braces, new cluster line angles'],
			95 : ['May 10, 2024', 'add color editing'],
			94 : ['May 4, 2024', 'replace to/from with child/parent and directions with isBidirectional'],
			93 : ['May 2, 2024', 'convert cluster arc into a bracket ( { )'],
			92 : ['April 29, 2024', 'assure things fit in cluster, show cluster arc'],
			91 : ['April 23, 2024', 'fix hover, grab highlight, tools, switching db'],
			90 : ['April 10, 2024', 'display related things clusters'],
			89 : ['March 28, 2024', 'display focus in clusters'],
			88 : ['March 26, 2024', 'resume support for Airtable'],
			87 : ['March 22, 2024', 'begin work on circle layout'],
			86 : ['March 10, 2024', 'vertical parent count dots inside drag dot'],
			85 : ['March 6, 2024', 'move tiny dots in crumbs to surround reveal dots'],
			84 : ['March 3, 2024', 'click title of thing to grab, tiny dots in crumbs'],
			83 : ['February 24, 2024', 'cluster tools: hover and disable logic'],
			82 : ['February 16, 2024', 'add zoom in/out buttons for mobile'],
			81 : ['February 15, 2024', 'new panel layout'],
			80 : ['February 13, 2024', 'dynamic ancestries for child and parent all seemingly working'],
			79 : ['February 2, 2024', 'working on relations'],
			78 : ['January 29, 2024', 'added two new tools to tools cluster'],
			77 : ['January 27, 2024', 'tools cluster is now an overlay hiding title and reveal dot'],
			76 : ['January 25, 2024', 'relocate focus title in graph (default with url query alternative)'],
			75 : ['January 23, 2024', 'switched ancestry ids from things to relationships'],
			74 : ['January 20, 2024', 'fixed most remaining ancestry design bugs'],
			73 : ['January 13, 2024', 'ancestries mostly working'],
			72 : ['January 11, 2024', 'ancestry based design'],
			71 : ['January 7, 2024', 'try to stop using thing ids for grab, focus, etc.'],
			70 : ['December 24, 2023', 'center graph'],
			69 : ['December 21, 2023', 'remount graph on relocate and hide/show children'],
			68 : ['December 17, 2023', 'relayout on title edit keystrokes'],
			67 : ['December 15, 2023', 'add div and origin to all components, position: absolute'],
			66 : ['November 28, 2023', 'configuration netlify content security profile'],
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
			25 : ['August 15, 2023', 'switch between db IDSignal'],
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
	}

}

export const builds = new Builds();
