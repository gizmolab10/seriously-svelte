<script>
	import { Point, Rect, Size } from '../../ts/utilities/Geometry';
	import { k } from '../../ts/common/Constants';
	export let element; // The HTML element (E) to print
	export let rect; // The rect (position and size of D)
	const margin = k.printer_dpi * 0.75; // 3/4 inch margins
	const screen_scale_factor = window.devicePixelRatio;``
	const message_height = 290;
	let final_content_rect;
	let final_inset_size;
	let final_page_size;
	let final_origin;
	let log_message;
	let isLandscape;
	let scaleFactor;
	let scale_size;
	let printable;
	let kludge
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//	Printing origin calculation:
	//
	//	pO		k - dC * dpF
	//	dC		dO + dS / 2
	//
	//	scalars:
	//
	//	dpF		scaleFactor
	//	m		margin
	//
	//	vectors:
	//
	// 	k		kludge								BROKEN, doesn't work for many variants of D
	//	pO		final_origin						top left for print style
	//	pS		final_inset_size
	//	dS		given_content_rect . size
	//	dC		given_content_rect . center
	//	dO		given_content_rect . origin			location of the drawn sub element within the given element
	//
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	layout();

	$: if (!!printable) {
		printable.innerHTML = k.empty;
		printable.appendChild(element.cloneNode(true));
	}
	
	function debug_log() {
		return `Screen scale factor: ${screen_scale_factor}
Given content origin: ${rect.description}
Given content size: ${rect.size.description}
Kludge: ${kludge.description}
Final DPI: ${k.printer_dpi}
Final scale factor: ${scaleFactor.toFixed(4)}
Final margin: ${margin}
Final page size: ${final_page_size.description}
Final page center: ${final_page_size.center.description}
Final inset size: ${final_inset_size.description}
Final content size: ${final_content_rect.size.description}
Final content center: ${final_content_rect.center.description}
Final origin: ${final_origin.description}
`;
	}

	function layout() {
		const w = k.printer_pixel_width;
		const h = w * k.printer_aspect_ratio;
		isLandscape = rect.size.width > rect.size.height;
		final_page_size = new Size(
			isLandscape ? h : w,
			isLandscape ? w : h
		);
		final_inset_size = final_page_size.insetEquallyBy(margin);
		scale_size = final_inset_size.dividedBy(rect.size);
		scaleFactor = Math.min(scale_size.width, scale_size.height) * screen_scale_factor;
		final_content_rect = rect.multipliedEquallyBy(scaleFactor);
		kludge = new Point(-60, -300);
		final_origin = final_page_size.center.offsetBy(rect.center.negated).offsetBy(kludge);
		log_message = debug_log();
	}
	
</script>

<div class='print-container'>
	{#if !!final_origin && !!scaleFactor}
		<div class='printable-content'
			bind:this={printable}
			style='
				transform: scale({scaleFactor});
				transform-origin: 50% 50%;
				left: {final_origin.x}px;
				top: {final_origin.y}px;
				position: absolute;
			'>
		</div>
	{/if}
	{#if !!log_message && !!final_page_size && !!final_inset_size}
		<div class='message-box'
			style='
				top: {final_page_size.height - message_height}px;
				width: {final_inset_size.width}px;
				background-color: transparent;
				height: {message_height}px;
				box-sizing: border-box;
				font-family: monospace;
				white-space: pre-wrap;
				border: 2px solid red;
				position: absolute;
				font-size: 16px;
				overflow: auto;
				padding: 8px;
				color: black;
				left: 0px;
			'>
			{log_message}
		</div>
	{/if}
</div>
