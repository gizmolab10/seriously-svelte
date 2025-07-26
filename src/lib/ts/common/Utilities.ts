// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class

import { Testworthy_Utilities } from './Testworthy_Utilities';
import { w_t_database, w_thing_fontFamily } from './Stores';
import Identifiable from '../runtime/Identifiable';
import G_TreeLine from '../layout/G_TreeLine';
import { layout } from '../layout/G_Layout';
import Ancestry from '../runtime/Ancestry';
import html2canvas from 'html2canvas';
import { get } from 'svelte/store';
import { k } from './Constants';
import printJS from 'print-js';

export class Utilities extends Testworthy_Utilities {
	
	getWidthOf(s: string):								number { return this.getWidth_ofString_withSize(s, `${k.font_size.common}px`); }
	sort_byOrder(ancestries: Array<Ancestry>): Array<Ancestry> { return ancestries.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }

	getFontOf(element: HTMLElement): string {
		const style: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = style.fontFamily;
		const fontSize: string = style.fontSize;
		return `${fontSize} ${fontFamily}`;
	}

	indexOf_withMatchingThingID_in(ancestry: Ancestry, ancestries: Array<Ancestry>): number {
		const thing = ancestry.thing;
		if (!!thing) {
			const index = ancestries.findIndex(a => a.thing?.id == thing.id);
			return index;
		}
		return -1;
	}

	sort_byTitleTop(ancestries: Array<Ancestry>): Array<Ancestry> {
		return ancestries.sort( (a: Ancestry, b: Ancestry) => {
			const aTop = a.titleRect?.origin.y;
			const bTop = b.titleRect?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	strip_hidDuplicates(ancestries: Array<Ancestry>): Array<Ancestry> {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.hid;
			if ((!!hid || hid == 0) && (!ancestriesByHID[hid])) {
				ancestriesByHID[hid] = ancestry;
				stripped.push(ancestry);
			}
		}
		return stripped;
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let stripped: Array<Identifiable> = [];
		for (const identifiable of identifiables) {
			const hid = identifiable.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(i => i.hid === hid);
				if (index == -1) {
					stripped.push(identifiable);
				} else if (stripped[index].hid < identifiable.hid) {
					stripped[index] = identifiable;		// assure array content is repeatable
				}
			}
		}
		return stripped;
	}

	strip_thingDuplicates_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(a => a.thing?.hid === hid);
				if (index == -1) {
					stripped.push(ancestry);
				} else if (stripped[index].depth < ancestry.depth) {
					stripped[index] = ancestry;		// assure array content is repeatable
				}
			}
		}
		return stripped;
	}

	hasMatching_bidirectional(bidirectionals: G_TreeLine[], g_line: G_TreeLine): boolean {
		return bidirectionals.some(b => 
			!!b.ancestry &&
			!!g_line.ancestry &&
			((b.ancestry.id == g_line.ancestry.id &&
			b.other_ancestry.id == g_line.other_ancestry.id) ||
			(b.ancestry.id == g_line.other_ancestry.id &&
			b.other_ancestry.id == g_line.ancestry.id)));
	}

	ids_forDB(array: Array<Ancestry>): string[] {
		return array.filter(a => a.t_database == get(w_t_database)).map(a => a.id);
	}

	ancestries_orders_normalize(ancestries: Array<Ancestry>): void {
		const length = ancestries.length;
		if (length > 1) {
			this.sort_byOrder(ancestries);
			for (let index = 0; index < length; index++) {
				ancestries[index].order_setTo(index);
			}
		}
	}

	getWidth_ofString_withSize(s: string, fontSize: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.fontFamily = get(w_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 0px';
		element.style.position = 'absolute';
		element.style.fontSize = fontSize;
		element.style.whiteSpace = 'pre';
		element.textContent = s;
		document.body.appendChild(element);
		const width: number = element.getBoundingClientRect().width / layout.scale_factor;
		document.body.removeChild(element);
		return width;
	}

	print_element_byClassName(className: string) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		if (element) {
			this.print_element(element);
		}
	}

	async print_element(element: HTMLElement) {
		if (element) {
			try {
				console.log('Element dimensions:', element.offsetWidth, element.offsetHeight);
				console.log('Element visible:', element.offsetWidth > 0 && element.offsetHeight > 0);
				console.log('Tree graph children:', document.querySelector('.tree-graph')?.children);
				console.log('Tree graph innerHTML:', document.querySelector('.tree-graph')?.innerHTML);
				
				// Ensure element has dimensions
				if (element.offsetWidth === 0 || element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				
				// Wait a bit for any async rendering to complete
				await new Promise(resolve => setTimeout(resolve, 500));
				// Temporarily ensure the element is fully rendered
				element.style.display = 'block';
				element.style.visibility = 'visible';
				element.style.position = 'relative';
				
				// Capture the element as canvas
				const canvas = await html2canvas(element, {
					useCORS: true,
					allowTaint: true,
					scale: 2, // Higher resolution for less blur
					width: element.offsetWidth,
					height: element.offsetHeight,
					logging: true // Enable logging
				});
				
				console.log('Canvas dimensions:', canvas.width, canvas.height);
				
				// Check if canvas has content
				if (canvas.width === 0 || canvas.height === 0) {
					console.error('Canvas has zero dimensions');
					return;
				}
				
				// Convert to data URL with error checking
				const imgData = canvas.toDataURL('image/png');
				console.log('Data URL length:', imgData.length);
				
				if (imgData === 'data:,') {
					console.error('Canvas produced empty data URL');
					return;
				}
				
				// Print using print-js with native print dialog
				printJS({
					printable: element,
					type: 'html',
					documentTitle: 'Graph Print',
					style: '@media print { body { margin: 0; } }',
					scanStyles: false
				});
				
			} catch (error) {
				console.error('Error printing element:', error);
			}
		}
	}

	convert_windowOffset_toCharacterOffset_in(offset: number, input: HTMLInputElement): number {
		const rect = input.getBoundingClientRect();
		const style = window.getComputedStyle(input);
		const paddingLeft = parseFloat(style.paddingLeft) || 0;
		const borderLeft = parseFloat(style.borderLeftWidth) || 0;
		const contentLeft = rect.left + borderLeft + paddingLeft;
		let relativeX = offset - contentLeft;
		if (relativeX < 0) {
			relativeX = 0;
		}
		const effectiveX = (relativeX + input.scrollLeft) / layout.scale_factor;
		// Create a canvas context for measuring text.
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			return 0;
		}
		context.font = style.font || `${style.fontSize} ${style.fontFamily}`;
		const text = input.value;
		if (text.length === 0) {
			return 0;
		}
		// Use binary search to find the character index
		// whose measured width is as close as possible to effectiveX.
		let low = 0;
		let high = text.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			const width = context.measureText(text.substring(0, mid)).width;
			if (width < effectiveX) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		// low is now the smallest index where the width is >= effectiveX.
		// Optionally, check if the previous index was closer.
		if (low > 0) {
			const prevWidth = context.measureText(text.substring(0, low - 1)).width;
			const currWidth = context.measureText(text.substring(0, low)).width;
			if (Math.abs(effectiveX - prevWidth) < Math.abs(currWidth - effectiveX)) {
				return low - 1;
			}
		}
		return low;
	}

}

export const u = new Utilities();
