<script>
	import { u, Point } from '../../ts/common/GlobalImports';
	import Mouse from '../kit/Mouse.svelte';
	export let closure = (mouseData) => {};
	export let center = Point.square(7);
	export let borderColor = '#333';
	export let textColor = '#400';
	export let color = '#ccc';
	export let size = 14;
</script>

<Mouse
	width={size}
	height={size}
	center={center}
	closure={closure}
	name='circle-button'
	detect_mouseDown={false}
	detect_longClick={false}
	detect_doubleClick={false}
	style='
		display: flex;
		cursor: pointer;
		color: {textColor}
		font-weight: bold;
		border-radius: 50%;
		align-items: center;
		line-height: {size}px;
		justify-content: center;
		font-size: {size - 1}px;;
		background-color: {color};
		border: 1px solid {borderColor};
		transform: translate(-50%, -50%);
	'>
	<slot></slot>
</Mouse>
