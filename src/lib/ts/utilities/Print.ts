import { Rect, Size, Point } from './Geometry';
import printJS from 'print-js';

export default class Print {
	content: HTMLElement | null = null;
	isLandscape: boolean = false;
	style!: CSSStyleDeclaration;
	element!: HTMLElement;
	scaleFactor!: number;
	rect!: Rect;

	setup_element(element: HTMLElement) {
		this.element = element;
		this.style = window.getComputedStyle(element);
		const size = new Size(element.offsetWidth, element.offsetHeight);
		const origin = new Point(Number(this.style.left), Number(this.style.top));
		this.rect = new Rect(origin, size);
	}

	determine_orientation_andScaling() {
		const elementSize = new Size(this.element.offsetWidth, this.element.offsetHeight);
		this.isLandscape = elementSize.width > elementSize.height;

		const pageSize = new Size(this.isLandscape ? 3507 : 2481, this.isLandscape ? 2481 : 3507);	

		// Account for margins
		const marginPixels = 150;
		const availableSize = new Size(pageSize.width - (2 * marginPixels), pageSize.height - (2 * marginPixels));
		
		// Calculate scale factors for width and height
		const scaleX = availableSize.width / elementSize.width;
		const scaleY = availableSize.height / elementSize.height;
		
		// Use the smaller scale to ensure it fits on the page
		this.scaleFactor = Math.min(scaleX, scaleY) * 0.8; // Reduced from 1.5 to 0.8 for smaller size
		
	}

	configure_element() {
		this.element.style.display = 'block';
		this.element.style.visibility = 'visible';
		this.element.style.position = 'relative';
		this.element.style.transform = `scale(${this.scaleFactor})`;
		this.element.style.transformOrigin = 'top left';
		this.element.style.width = '100%';
		this.element.style.height = '100%';
		this.element.style.position = 'relative';
		this.element.style.top = '20%';
		this.element.style.left = '-20%';
	}
	
	async print_element(element: HTMLElement) {
		if (!!element) {
			this.setup_element(element);
			try {
				
				// Ensure element has dimensions
				if (this.element.offsetWidth === 0 || this.element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				
				// Wait a bit for any async rendering to complete
				await new Promise(resolve => setTimeout(resolve, 500));

				this.determine_orientation_andScaling();
				this.configure_element();
				
				// Try using original element directly instead of cloning
				console.log('Using original element directly');
				console.log('Original element dimensions:', this.element.offsetWidth, this.element.offsetHeight);

				const original = {
					transform: this.element.style.transform,
					position: this.element.style.position,
					height: this.element.style.height,
					width: this.element.style.width,
					left: this.element.style.left,
				}
				
				// Print using original element
				printJS({
					printable: this.element,
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
				
				// Restore original styles after printing
				setTimeout(() => {
					this.element.style.transform = original.transform;
					this.element.style.position = original.position;
					this.element.style.height = original.height;
					this.element.style.width = original.width;
					this.element.style.left = original.left;
				}, 1000);
				
			} catch (error) {
				console.error('Error printing element:', error);
			}
		}
	}

}

export const print = new Print();
