import { grabs } from '../managers/Grabs';
import { Rect, Size } from './Geometry';
import printJS from 'print-js';

export default class Print {
	style!: CSSStyleDeclaration;
	isLandscape = false;
	clone!: HTMLElement;
	size!: Size;

	get scaleFactor(): number {
		const marginPixels = 150;										// Account for margins
		const pageSize = new Size(this.isLandscape ? 3507 : 2481, this.isLandscape ? 2481 : 3507);
		const availableSize = pageSize.reducedEquallyBy(2 * marginPixels);
		const scale = availableSize.relativeTo(this.size);
		return Math.min(scale.width, scale.height) * 0.8;	// ad-hoc 0.8, delete later
	}

	configure_clone() {
		this.clone.style.transform = `scale(${this.scaleFactor})`;
		this.clone.style.transformOrigin = 'top left';
		this.clone.style.visibility = 'visible';
		this.clone.style.position = 'relative';
		this.clone.style.display = 'block';
		this.clone.style.height = '100%';
		this.clone.style.width = '100%';
		this.clone.style.left = '-20%';
		this.clone.style.top = '20%';
	}

	print_element_byClassName_withSize(className: string, size: Size) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		this.print_element_inRect(element, size);
	}
	
	async print_element_inRect(element: HTMLElement, size: Size) {
		if (!!element) {
			try {
				if (element.offsetWidth === 0 || element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				await new Promise(resolve => setTimeout(resolve, 500));				// Wait a bit for any async rendering to complete
				this.size = size;
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
