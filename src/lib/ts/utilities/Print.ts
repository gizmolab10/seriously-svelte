import { Point, Rect, Size } from './Geometry';
import { grabs } from '../managers/Grabs';
import { k } from '../common/Constants';
import printJS from 'print-js';

export default class Print {
	screen_scale_factor = window.devicePixelRatio;
	margin = k.printer_dpi / 2;
	given_content_rect!: Rect;
	printable!: HTMLElement;
	final_page_size!: Size;
	scaleFactor!: number;
	isLandscape = false;
	scale!: Size;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//	Printing origin calculation:
	//
	//	pO		pS / 2 - dC * dpF
	//	dC		dO + dS / 2
	//
	//	scalar:
	//
	//	dpF		scaleFactor
	//	m		margin
	//
	//	vectors:
	//
	//	pO		final_origin						top left for print style
	//	pS		final_inset_size
	//	dS		given_content_rect . size
	//	dC		given_content_rect . center
	//	dO		given_content_rect . origin			location of the drawn sub element within the given element
	//
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	get final_origin(): Point { return this.final_page_size.center.offsetBy(this.final_content_rect.center.negated); }
	get final_content_rect(): Rect { return this.given_content_rect.multipliedEquallyBy(this.scaleFactor); }
	get final_inset_size(): Size { return this.final_page_size.insetEquallyBy(this.margin); }

	print_element_byClassName_withSize(className: string, rect: Rect) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		this.print_element_withSize(element, rect);
	}

	setup_scaleFactor() {
		this.scale = this.final_inset_size.dividedBy(this.given_content_rect.size);
		this.scaleFactor = Math.min(this.scale.width, this.scale.height) * this.screen_scale_factor;
	}

	setup_final_page_size() {
		const height_width_ratio = 11.69 / 8.27;
		const pixel_width = k.printer_pixel_width;
		const pixel_height = Math.round(pixel_width * height_width_ratio);
		this.final_page_size = new Size(
			this.isLandscape ? pixel_height : pixel_width,
			this.isLandscape ? pixel_width : pixel_height
		);
	}
	
	setup_clone(element: HTMLElement, size: Size) {
		this.printable = element.cloneNode(true) as HTMLElement;
		this.isLandscape = size.width > size.height;
		this.setup_final_page_size();
		this.setup_scaleFactor();
		this.configure_clone();
		this.setup_test();
		this.debug_log();
	}

	configure_clone() {
		this.printable.style.transform = `scale(${this.scaleFactor})`;
		this.printable.style.left = `${this.final_origin.x}px`;
		this.printable.style.top = `${this.final_origin.y}px`;
		this.printable.style.transformOrigin = 'top left';
		this.printable.style.visibility = 'visible';
		this.printable.style.position = 'absolute';
		this.printable.style.display = 'block';
	}
	
	async print_element_withSize(element: HTMLElement, rect: Rect) {
		if (!!element) {
			try {
				if (element.offsetWidth === 0 || element.offsetHeight === 0) {
					console.error('Element has zero dimensions, cannot print');
					return;
				}
				await new Promise(resolve => setTimeout(resolve, 100));				// Wait a bit for any async rendering to complete
				this.given_content_rect = rect;
				grabs.temporarily_clearGrabs_while(() => {
					this.setup_clone(element, rect.size);
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
			printable: this.printable,
			documentTitle: 'Graph Print',
			style: `
				@media print { 
					body {
					}
					@page {
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

	setup_test() {
		// Create a test container that simulates the print page
		const test = document.createElement('div');
		test.style.height = `${this.given_content_rect.size.height}px`;
		test.style.width = `${this.given_content_rect.size.width}px`;
		test.style.left = `${this.given_content_rect.origin.x}px`;
		test.style.top = `${this.given_content_rect.origin.y}px`;
		test.style.border = '5px dashed lightblue';
		test.style.backgroundColor = 'transparent';
		test.style.position = 'absolute';
		test.style.zIndex = '9999';
		
		// Add the scaled clone
		this.printable.appendChild(test);
		
		// Remove after 5 seconds
		// setTimeout(() => this.printable.removeChild(test), 15000);
	}

	debug_log() {
		console.log('Screen DPI:', k.printer_dpi);
		console.log('Device pixel ratio:', window.devicePixelRatio);
    	console.log('Final scale factor:', this.scaleFactor);
		console.log('Given content origin:', this.given_content_rect.origin);
		console.log('Given content size:', this.given_content_rect.size);
		console.log('Final content center:', this.final_content_rect.center);
		console.log('Final margin:', this.margin);
		console.log('Final page size:', this.final_page_size);
		console.log('Final page center:', this.final_page_size.center);
		console.log('Final inset size:', this.final_inset_size);
		console.log('Final content size:', this.given_content_rect.size.multipliedEquallyBy(this.scaleFactor));
		console.log('Final origin:', this.final_origin);
		// const final_margin = Point.square(this.margin);
		// console.log('Manual width ratio:', this.final_inset_size.width / this.given_content_rect.size.width);
		// console.log('Manual height ratio:', this.final_inset_size.height / this.given_content_rect.size.height);
	    // console.log('Scale ratios:', this.scale);
	    // console.log('Width ratio:', this.scale.width);
    	// console.log('Height ratio:', this.scale.height);
		// console.log('Final adjustment:', this.adjustment_toward_center);
		// console.log('Margin + adjustment', this.final_margin.offsetBy(this.adjustment_toward_center));
	}

}

export const print = new Print();
