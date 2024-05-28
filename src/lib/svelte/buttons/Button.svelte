<script lang='ts'>
	import { g, k, s, u, Point, ZIndex, onMount, Appearance } from '../../ts/common/GlobalImports';
	import MouseButton from '../buttons/MouseButton.svelte';
	export let background_color = k.color_background;
	export let closure = (mouseData) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let zindex = ZIndex.dots;
	export let border = 'none';
	export let color = 'black';
	export let style = k.empty;
	export let name = k.empty;
	export let height = 16;
	export let width = 16;

	function update() { updateFor(s.appearance_forName(name)); }
	onMount(() => { update(); })
	$: { update(); }

	function updateFor(appearance: Appearance) {
		if (!!appearance) {
			color = appearance.color;
			background_color = appearance.background_color;
		}
	}

	function button_closure(mouseData) {
		closure(mouseData);
		if (mouseData.isHover) {
			update();
		}
	}

</script>

<MouseButton
	name={name}
	width={width}
	height={height}
	center={center}
	closure={button_closure}>
	<button class='button' id={name}
		style='
			color:{color};
			cursor:pointer;
			border:{border};
			width:{width}px;
			z-index:{zindex};
			height:{height}px;
			position:{position};
			border-radius:{height / 2}px;
			background-color:{background_color};'>
		<slot></slot>
	</button>
</MouseButton>
