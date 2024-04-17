<script lang='ts'>
	import { k, u, Point, ZIndex } from '../../ts/common/GlobalImports';
	export let onClick = (event, isLong) => {};
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let border = 'none';
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let isListening = false;
	let isTiming = false;
	let isLong = false;
	let labelButton;
	let clickTimer;

	function handle_mouse_out(event) { hover_closure(false); }
	function handle_mouse_over(event) { hover_closure(true); }
	function handle_click(event) { if (!isTiming) { onClick(event, false); } }

	function clearTimer() {
		isTiming = false;
		clearTimeout(clickTimer);
	}

	$: {
		// if mouse is held down, timeout will fire
		// if not, 
		if (!!labelButton && !isListening) {
			isListening = true;
			labelButton.addEventListener('pointerup', (event) => { clearTimer(); });
			labelButton.addEventListener('pointerdown', (event) => {
				clearTimer();
				isTiming = true;
				clickTimer = setTimeout(() => {
					if (isTiming) {
						clearTimer();
						onClick(event, true);
					}
				}, k.threshold_longClick);
			});
		}
	}

</script>

<button class='label-button'
	on:blur={u.ignore}
	on:focus={u.ignore}
	bind:this={labelButton}
	on:click={handle_click}
	on:mouseout={handle_mouse_out}
	on:mouseover={handle_mouse_over}
	style='
		color: {color};
		cursor: {cursor};
		border: {border};
		width: {width}px;
		height: {height}px;
		position: {position};
		z-index: {ZIndex.dots};
		background-color: transparent;
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;'>
	<slot></slot>
</button>
