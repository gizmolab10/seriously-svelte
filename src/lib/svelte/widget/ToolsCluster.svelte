<script lang='ts'>
    import { k, Size, Point, Widget, ZIndex, onMount, svgPath, Direction, dbDispatch, graphEditor, AlteringParent } from '../../ts/common/GlobalImports';
    import { dot_size, altering_parent, row_height, path_toolsGrab } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import Trash from '../svg/Trash.svelte';
    export let widget: Widget;
	export let thing: Thing;
	let diameter = $dot_size;
    let center_deleteParent = new Point();
    let center_addParent = new Point();
    let center_addChild = new Point();
	let radius = $dot_size / 2;
    let color = thing.color;
    let left = 60;
    let top = 24;

    onMount( () => {
        const width = thing.titleWidth;
        const offsetX = Math.max(0, (k.toolsClusterHeight - width - 21) / 8)
        const offsetY = Math.max(0, (k.toolsClusterHeight - $row_height - 21) / 8)

        top = 24 - offsetY;
        color = thing.color;
		left = width + offsetX - 1;
        const otherLeft = left - diameter * 1.2;
        center_addChild = new Point(left, top - diameter);
        center_addParent = new Point(otherLeft, top - diameter);
        center_deleteParent = new Point(otherLeft, top + diameter + 9);
	});

	async function handleClick(buttonID: string) {
        if (!thing.isExemplar) {
            switch (buttonID) {
                case 'addParent': toggleAlteration(AlteringParent.adding); return;
                case 'deleteParent': toggleAlteration(AlteringParent.deleting); return;
                case 'addChild': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'delete': await dbDispatch.db.hierarchy.things_redraw_remoteTraverseDelete([thing]); break;
                default: break;
            }
            $path_toolsGrab = null;
        }
    }

    function toggleAlteration(alteration: AlteringParent) {
        $altering_parent = ($altering_parent == alteration) ? null : alteration;
    }

</script>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
    @keyframes colorFade {
        0%, 100% { color: black; }
        50% { color: lightgray; }
    }
</style>

<TriangleButton
	fillColor_closure={() => { return ($altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
    extraColor={($altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
	onClick={() => handleClick('addParent')}
    extra={svgPath.tCross(diameter, 2)}
	direction={Direction.left}
	center={center_addParent}
	strokeColor={color}
    size={diameter}
	id='addParent'/>
{#if thing.parents.length > 1}
    <TriangleButton
        fillColor_closure={() => { return ($altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
        extraColor={($altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
        onClick={() => handleClick('deleteParent')}
        extra={svgPath.dash(diameter, 2)}
        center={center_deleteParent}
        direction={Direction.left}
        strokeColor={color}
        id='deleteParent'
        size={diameter}/>
{/if}
<TriangleButton
	fillColor_closure={() => { return k.backgroundColor; }}
	onClick={() => handleClick('addChild')}
    extra={svgPath.tCross(diameter, 2)}
	direction={Direction.right}
	center={center_addChild}
    extraColor={thing.color}
	strokeColor={color}
    size={diameter}
	id='addChild'/>
<button class='delete'
    on:click={() => handleClick('delete')}
	style='top: {top + diameter + 13}px;
        left: {left - 1}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index: {ZIndex.overlay};'>
    <Trash color={color}/>
</button>
