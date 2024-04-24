<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/state/State';
	export let click_closure = (event, isLong) => {};
	export let background_color = 'transparent';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let style = k.empty;
	export let border = 'none';
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let isListening = false;
	let clickTimer;
	let button;

	function handle_mouse_move(event) {
		handle_hoverAt(new Point(event.x, event.y));
		setTimeout(() => {
			handle_hoverAt(g.mouseLocation);
		}, 100);
	}

	function handle_hoverAt(eventLocation) {
		const isHovering = buttonContains(eventLocation);
		hover_closure(isHovering);
	}

	function clearTimer() {
		clearTimeout(clickTimer);
		clickTimer = null;
	}

	function handle_click(event) {
		if (!clickTimer) {
			click_closure(event, false);
		}
	}

	function buttonContains(eventLocation): boolean {
		if (button) {
			const buttonOrigin = new Point(button.offsetLeft, button.offsetTop).offsetBy($s_graphRect.origin);
			const buttonSize = new Size(button.offsetWidth, button.offsetHeight);
			const buttonRect = new Rect(buttonOrigin, buttonSize);
			return buttonRect.contains(eventLocation);
		}
		return false;
	}

	$: {
		// if mouse is held down, timeout will fire
		// if not, handle_click will fire
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
	on:click={handle_click}
	on:mousemove={handle_mouse_move}
	style='
		color: {color};
		cursor: {cursor};
		border: {border};
		width: {width}px;
		height: {height}px;
		position: {position};
		z-index: {ZIndex.dots};
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;
		background-color: {background_color};'>
	<slot></slot>
</button>
