<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/state/State';
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

	function clearTimer() {
		clearTimeout(clickTimer);
		clickTimer = null;
	}

	function handle_click(event) {
		if (!clickTimer) {
			click_closure(event, false);
		}
	}

	function handle_mouse_event(event) {
		const square = Point.square(1.5);
		const eventLocation = new Point(event.x, event.y);
		const buttonOrigin = new Point(button.offsetLeft, button.offsetTop).offsetBy($s_graphRect.origin).offsetBy(square);
		const buttonSize = new Size(button.offsetWidth, button.offsetHeight).reducedBy(square.doubled);
		const buttonRect = new Rect(buttonOrigin, buttonSize);
		const contains = buttonRect.contains(eventLocation);
		hover_closure(contains);
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
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:click={handle_click}
	on:mouseout={handle_mouse_event}
	on:mouseover={handle_mouse_event}
	on:mousemove={handle_mouse_event}
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
