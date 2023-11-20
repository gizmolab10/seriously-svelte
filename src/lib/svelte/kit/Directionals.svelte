<script>
    import FatTriangleButton from './FatTriangleButton.svelte'
    import { noop } from '../../ts/common/GlobalImports';
    import { dotSize } from '../../ts/managers/State';
	const rightPath = svgPath.triangle(Size.square($dotSize), Direction.right);
	const leftPath = svgPath.triangle(Size.square($dotSize), Direction.left);
	export let size = 20;
</script>

<FatTriangleButton
<div class='close-button' style='
    width: {size}px;
    height: {size}px;
    font-size: {size - 1}px;;
    line-height: {size}px;'
    on:keypress={() => { noop(); }}
    on:click={() => { noop(); }}>
    ×
</div>

<style>
	.close-button {
		display: inline-block;
		text-align: center;
		cursor: pointer;
		color: #000;
		position: absolute;
		border: 1px solid black;
		border-radius: 50%;
		top: 10px;
		right: 10px;
	}
</style>