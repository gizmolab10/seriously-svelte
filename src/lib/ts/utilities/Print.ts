import { w_graph_rect } from '../managers/Stores';
import { grabs } from '../managers/Grabs';
import { get } from 'svelte/store';
import { Size } from './Geometry';
import printJS from 'print-js';

export default class Print {
	marginPixels = 48;  // pixels == 1/2 inch (all browsers render at 96 DPI)
	size_ofContent_toBePrinted!: Size;
	style!: CSSStyleDeclaration;
	isLandscape = false;
	clone!: HTMLElement;

	get scaleFactor(): number {
		const pageSize = new Size(
			this.isLandscape ? 1123 : 794,  // A4 width in pixels at 96 DPI (8.27" × 96 = 794)
			this.isLandscape ? 794 : 1123   // A4 height in pixels at 96 DPI (11.69" × 96 = 1123)
		);
		const graphArea_size = get(w_graph_rect).size;
		const printArea_size = pageSize.insetEquallyBy(this.marginPixels);
		const p_scale = printArea_size.relativeTo(this.size_ofContent_toBePrinted);
		const g_scale = graphArea_size.relativeTo(this.size_ofContent_toBePrinted);
		const scale = p_scale.relativeTo(g_scale);
		return Math.max(scale.width, scale.height);
	}

	configure_clone() {
		this.clone.style.transform = `scale(${this.scaleFactor})`;
		this.clone.style.left = `${this.marginPixels}px`;
		this.clone.style.top = `${this.marginPixels}px`;
		this.clone.style.transformOrigin = 'top left';
		this.clone.style.visibility = 'visible';
		this.clone.style.position = 'relative';
		this.clone.style.display = 'block';
	}

	print_element_byClassName_withSize(className: string, size: Size) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		this.print_element_withSize(element, size);
	}
	
	async print_element_withSize(element: HTMLElement, size: Size) {
		if (!!element) {
			try {
				if (element.offsetWidth === 0 || element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				await new Promise(resolve => setTimeout(resolve, 100));				// Wait a bit for any async rendering to complete
				this.size_ofContent_toBePrinted = size;
				grabs.temporarily_clearGrabs_while(() => {
					this.clone = element.cloneNode(true) as HTMLElement;
					this.style = window.getComputedStyle(element);
					this.isLandscape = size.width > size.height;
					this.configure_clone();
					this.print_clone();
				});
			} catch (error) {
				console.error('Error printing element:', error);
			}
		}
	}

	private print_clone() {
		printJS({
			type: 'html',
			printable: this.clone,
			documentTitle: 'Graph Print',
			style: `
				@media print { 
					body { 
						margin: 0; 
						padding: 0;
					}
					@page {
						margin: 0;
						size: ${this.isLandscape ? 'A4 landscape' : 'A4 portrait'};
						orientation: ${this.isLandscape ? 'landscape' : 'portrait'};
					}
					* {
						page-break-inside: avoid;
					}
				}
			`,
			scanStyles: false
		});
	}
}

export const print = new Print();
