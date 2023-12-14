<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleDot from './TriangleDot.svelte'
    const origin = new Point(12, 10);
    const size = 24;
    let toggle = false;
    export let display;
    export let hit;

	function newFillColor(isFilled) { return isFilled ? 'black' : k.backgroundColor; }

	function onClick(event) {
        const pointsLeft = event.clientX > 234;
        hit(pointsLeft);
        toggle = !toggle;
	}

</script>

{#key toggle}
    <TriangleDot
        newFillColor={newFillColor}
        direction={Direction.left}
        display={display(true)}
        strokeColor={'black'}
        onClick={onClick}
        center={origin}
        size={size}
    />

    <TriangleDot
        center={origin.offsetByX(size)}
        newFillColor={newFillColor}
        direction={Direction.right}
        display={display(false)}
        strokeColor={'black'}
        onClick={onClick}
        size={size}
    />
{/key}
