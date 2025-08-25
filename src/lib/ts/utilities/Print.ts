import { Rect, Size, Point } from './Geometry';
import printJS from 'print-js';

export default class Print {
	content: HTMLElement | null = null;
	style!: CSSStyleDeclaration;
	element!: HTMLElement;
	rect!: Rect;

	setup_element(element: HTMLElement) {
		this.element = element;
		this.style = window.getComputedStyle(element);
		const size = new Size(element.offsetWidth, element.offsetHeight);
		const origin = new Point(Number(this.style.left), Number(this.style.top));
		this.rect = new Rect(origin, size);
	}

	get isLandscape(): boolean { return this.elementSize.width > this.elementSize.height; }
	get elementSize(): Size { return new Size(this.element.offsetWidth, this.element.offsetHeight); }

	get scaleFactor(): number {
		const marginPixels = 150;										// Account for margins
		const pageSize = new Size(this.isLandscape ? 3507 : 2481, this.isLandscape ? 2481 : 3507);
		const availableSize = new Size(pageSize.width - (2 * marginPixels), pageSize.height - (2 * marginPixels));
		const scale = availableSize.relativeTo(this.elementSize);
		return Math.min(scale.width, scale.height) * 0.8;	// ad-hoc 0.8, delete later
	}

	configure_element() {
		this.element.style.transform = `scale(${this.scaleFactor})`;
		this.element.style.transformOrigin = 'top left';
		this.element.style.visibility = 'visible';
		this.element.style.position = 'relative';
		this.element.style.display = 'block';
		this.element.style.height = '100%';
		this.element.style.width = '100%';
		this.element.style.left = '-20%';
		this.element.style.top = '20%';
	}
	
	async print_element(element: HTMLElement) {
		if (!!element) {
			this.setup_element(element);
			try {
				if (this.element.offsetWidth === 0 || this.element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				await new Promise(resolve => setTimeout(resolve, 500));				// Wait a bit for any async rendering to complete
				const original = {
					transform: this.element.style.transform,
					position: this.element.style.position,
					height: this.element.style.height,
					width: this.element.style.width,
					left: this.element.style.left,
					top: this.element.style.top,
				}
				this.configure_element();
				printJS({							// Print using original element
					type: 'html',
					printable: this.element,
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
				setTimeout(() => {
					// Restore original styles after printing
					this.element.style.transform = original.transform;
					this.element.style.position = original.position;
					this.element.style.height = original.height;
					this.element.style.width = original.width;
					this.element.style.left = original.left;
					this.element.style.top = original.top;
				}, 1000);
			} catch (error) {
				console.error('Error printing element:', error);
			}
		}
	}

}

export const print = new Print();
