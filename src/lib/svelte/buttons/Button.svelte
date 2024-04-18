<script lang='ts'>
	import { k, u, Point, ZIndex } from '../../ts/common/GlobalImports';
	export let click_closure = (event, isLong) => {};
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let border = 'none';
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let isListening = false;
	let clickTimer;
	let button;

	function handle_mouse_out(event) { hover_closure(false); }
	function handle_mouse_over(event) { hover_closure(true); }

	function handle_click(event) {
		if (!clickTimer) {
			click_closure(event, false);
		}
	}

	function clearTimer() {
		clearTimeout(clickTimer);
		clickTimer = null;
	}

	$: {
		// if mouse is held down, timeout will fire
		// if not, click_closure will fire
		if (!!button && !isListening) {
			isListening = true;
			const foo = button.addEventListener('pointerup', (event) => {
				clearTimer();
			});
			button.addEventListener('pointerdown', (event) => {
				clearTimer();
				clickTimer = setTimeout(() => {
					if (clickTimer) {
						clearTimer();
						click_closure(event, true);
					}
				}, k.threshold_longClick);
			});
		}
	}

</script>

<button class='button'
	bind:this={button}
	on:blur={u.ignore}
	on:focus={u.ignore}
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
