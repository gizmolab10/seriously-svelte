import { Point, Rect, Size } from './Geometry';
import { u } from '../utilities/Utilities';
import { k } from '../common/Constants';
import printJS from 'print-js';

export default class Print {
	screen_scale_factor = window.devicePixelRatio;
	margin = k.printer_dpi * 0.75;
	// kludge = new Point(400, 500);
	kludge = new Point(750, 450);
	given_content_rect!: Rect;
	printable!: HTMLElement;
	final_page_size!: Size;
	scaleFactor!: number;
	isLandscape = false;
	debug!: HTMLElement;
	scale_size!: Size;

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

	get final_content_rect(): Rect { return this.given_content_rect.multipliedEquallyBy(this.scaleFactor); }
	// get kludge(): Point { return this.final_inset_size.center; } // this.final_inset_size.center.offsetBy(this.final_content_rect.center); }
	get final_origin(): Point { return this.final_content_rect.center.negated.offsetBy(this.kludge); }
	get final_inset_size(): Size { return this.final_page_size.insetEquallyBy(this.margin); }

	get ksludge(): Point {
		// pS / 2 = center of printable area
		const printable_center = this.final_inset_size.center;
		// dC * dpF = scaled content center  
		const scaled_content_center = this.final_content_rect.center;
		
		// Since current code does: -final_content_rect.center + kludge
		// We want: printable_center - scaled_content_center
		// So: kludge = printable_center + scaled_content_center
		return printable_center.offsetBy(scaled_content_center);
	}
	print_element_byClassName_withSize(className: string, rect: Rect) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		this.print_element_withSize(element, rect);
	}

	setup_scaleFactor() {
		this.scale_size = this.final_inset_size.dividedBy(this.given_content_rect.size);
		this.scaleFactor = Math.min(this.scale_size.width, this.scale_size.height) * this.screen_scale_factor / 1.15;
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
	
	setup_printable(element: HTMLElement, size: Size) {
		this.printable = element.cloneNode(true) as HTMLElement;
		this.isLandscape = size.width > size.height;
		this.setup_final_page_size();
		this.setup_scaleFactor();
		this.configure_printable();
		this.add_message('Printing...');
		// this.setup_test();
		this.debug_log();
	}

	configure_printable() {
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
				u.temporarily_setDefaults_while(() => {
					this.setup_printable(element, rect.size);
					this.print_printable();
				});
			} catch (error) {
				console.error('Error printing element:', error);
			}
		}
	}

	private print_printable() {
		printJS({
			type: 'html',
			printable: this.debug,
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
		
		// Add the scaled printable
		this.printable.appendChild(test);
		
		// Remove after 5 seconds
		// setTimeout(() => this.printable.removeChild(test), 15000);
	}

	debug_log() {
		console.log('Screen scale factor:', this.screen_scale_factor);
		console.log('Final DPI:', k.printer_dpi);
		console.log('Final scale size:', this.scale_size);
    	console.log('Final scale factor:', this.scaleFactor);
		console.log('Final margin:', this.margin);
		console.log('Given content origin:', this.given_content_rect.origin);
		console.log('Given content size:', this.given_content_rect.size);
		console.log('Final content center:', this.final_content_rect.center);
		console.log('Final page size:', this.final_page_size);
		console.log('Final page center:', this.final_page_size.center);
		console.log('Final inset size:', this.final_inset_size);
		console.log('Final content size:', this.final_content_rect.size);
		console.log('Final origin:', this.final_origin);
		console.log('Kludge:', this.kludge);
		// const final_margin = Point.square(this.margin);
		// console.log('Manual width ratio:', this.final_inset_size.width / this.given_content_rect.size.width);
		// console.log('Manual height ratio:', this.final_inset_size.height / this.given_content_rect.size.height);
	    // console.log('Scale ratios:', this.scale);
	    // console.log('Width ratio:', this.scale.width);
    	// console.log('Height ratio:', this.scale.height);
		// console.log('Final adjustment:', this.adjustment_toward_center);
		// console.log('Margin + adjustment', this.final_margin.offsetBy(this.adjustment_toward_center));
	}

	add_message(message: string) {
		// Create a debug container that represents the full print page
		const debug = document.createElement('div');
		this.debug = debug;
		debug.style.position = 'absolute';
		debug.style.left = '0px';
		debug.style.top = '0px';
		debug.style.width = `${this.final_page_size.width}px`;
		debug.style.height = `${this.final_page_size.height}px`;
		debug.style.transform = 'scale(1)'; // No scaling
		debug.style.transformOrigin = 'top left';
		
		// Move the existing printable element into the debug container
		// (Keep its existing transform and positioning)
		debug.appendChild(this.printable);
		
		// Create message box with simple coordinates relative to the print page
		const box = document.createElement('div');
		const box_height = 100;
		const box_top = this.final_page_size.height - box_height - this.margin;
		
		box.style.position = 'absolute';
		box.style.left = `${this.margin}px`;
		box.style.top = `${box_top}px`;
		box.style.width = `${this.final_inset_size.width}px`;
		box.style.height = `${box_height}px`;
		box.style.backgroundColor = 'white';
		box.style.border = '1px solid red';
		box.style.padding = '5px';
		box.style.fontSize = '28px';
		box.style.fontFamily = 'monospace';
		box.style.color = 'black';
		box.style.overflow = 'auto';
		box.style.whiteSpace = 'pre-wrap';
		box.style.boxSizing = 'border-box';
		
		box.textContent = message;
		
		// Add message box to the debug container (as sibling to printable)
		debug.appendChild(box);
		
		console.log('Debug container created with printable and message box');
	}

}

export const print = new Print();
