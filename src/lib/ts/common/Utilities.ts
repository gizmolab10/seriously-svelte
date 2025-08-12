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

	resolve_signal_value(value: any): string {
		const type = value?.constructor?.name;
		return typeof value != 'object' ? value :
			(type === 'Ancestry' ? `Ancestry (${value.title})` : type ?? 'null');
	}

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
				
				// Calculate scale factor to fit print page
				const elementWidth = element.offsetWidth;
				const elementHeight = element.offsetHeight;
				
				// Try to measure the actual graph content
				let graphContent = element.querySelector('.tree-graph, .radial-graph');
				if (!graphContent && (element.classList.contains('tree-graph') || element.classList.contains('radial-graph'))) {
					graphContent = element;
					console.log('Using the element itself as the graph content');
				}
				
				// Use element dimensions for landscape detection and scaling
				// The element dimensions represent the actual rendered size on screen
				const contentWidth = elementWidth;
				const contentHeight = elementHeight;
				
				if (!graphContent) {
					console.log('No graph content found');
				} else {
					// Log SVG info for debugging but don't use it for calculations
					const svg = graphContent.querySelector('svg');
					if (svg && typeof svg.getBBox === 'function') {
						const bbox = svg.getBBox();
						console.log('SVG getBBox dimensions:', bbox.width, '×', bbox.height);
						console.log('SVG viewBox:', svg.getAttribute('viewBox'));
						console.log('SVG width/height:', svg.getAttribute('width'), '/', svg.getAttribute('height'));
					}
				}
				
				// Determine orientation based on element dimensions (actual rendered size)
				const isLandscape = contentWidth > contentHeight;
				console.log('Element dimensions:', elementWidth, '×', elementHeight);
				console.log('Content dimensions (using element):', contentWidth, '×', contentHeight);
				console.log('Is landscape:', isLandscape);
				console.log('Page size:', isLandscape ? 'A4 landscape' : 'A4 portrait');
				
				// Standard print page dimensions (A4 in pixels at 96 DPI)
				const printPageWidth = isLandscape ? 1123 : 794; // A4 width in pixels
				const printPageHeight = isLandscape ? 794 : 1123; // A4 height in pixels
				
				// Account for 0.5 inch margins (48 pixels at 96 DPI)
				const marginPixels = 48;
				const availableWidth = printPageWidth - (2 * marginPixels);
				const availableHeight = printPageHeight - (2 * marginPixels);
				
				// Calculate scale factors for width and height
				const scaleX = availableWidth / elementWidth;
				const scaleY = availableHeight / elementHeight;
				
				// Use the smaller scale to ensure it fits on the page
				const scaleFactor = Math.min(scaleX, scaleY) * 0.8; // Reduced from 1.5 to 0.8 for smaller size
				
				// Try using original element directly instead of cloning
				console.log('Using original element directly');
				console.log('Original element dimensions:', element.offsetWidth, element.offsetHeight);
				
				// Apply scaling to original element temporarily
				const originalTransform = element.style.transform;
				const originalWidth = element.style.width;
				const originalHeight = element.style.height;
				const originalPosition = element.style.position;
				const originalLeft = element.style.left;
				
				element.style.transform = `scale(${scaleFactor})`;
				element.style.transformOrigin = 'top left';
				element.style.width = '100%';
				element.style.height = '100%';
				element.style.position = 'relative';
				element.style.left = '-20%';
				element.style.top = '20%';
				
				// Print using original element
				printJS({
					printable: element,
					type: 'html',
					documentTitle: 'Graph Print',
					style: `
						@media print { 
							body { 
								margin: 0; 
								padding: 0;
							}
							@page {
								margin: 0;
								size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
								orientation: ${isLandscape ? 'landscape' : 'portrait'};
							}
							* {
								page-break-inside: avoid;
							}
						}
					`,
					scanStyles: false
				});
				
				// Restore original styles after printing
				setTimeout(() => {
					element.style.transform = originalTransform;
					element.style.width = originalWidth;
					element.style.height = originalHeight;
					element.style.position = originalPosition;
					element.style.left = originalLeft;
				}, 1000);
				
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
