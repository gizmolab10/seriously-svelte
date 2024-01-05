<script lang='ts'>
    import { k, Size, Point, ZIndex, onMount, svgPath, Direction, dbDispatch, graphEditor } from '../../ts/common/GlobalImports';
    import { dot_size, adding_parent, row_height, id_toolsGrab } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import Trash from '../svg/Trash.svelte';
	export let thing: Thing;
	let diameter = $dot_size;
    // let deleteParentCenter = new Point();
    let center_addParent = new Point();
    let center_addChild = new Point();
	let radius = $dot_size / 2;
    let color = thing.color;
    let left = 60;
    let top = 24;

    onMount( () => {
        const width = thing.titleWidth;
        const offsetX = Math.max(0, (k.clusterHeight - width - 21) / 8)
        const offsetY = Math.max(0, (k.clusterHeight - $row_height - 21) / 8)

        top = 24 - offsetY;
        color = thing.color;
		left = width + offsetX - 1;
        center_addChild = new Point(left, top - diameter);
        center_addParent = new Point(left - diameter * 1.2, top - diameter);
        // deleteParentCenter = new Point(7 - offsetX, top + diameter + 10);
	});

	async function handleClick(id: string) {
        if (!thing.isExemplar) {
            switch (id) {
                case 'addParent': $adding_parent = !$adding_parent; return;
                case 'child': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'delete': await dbDispatch.db.hierarchy.things_redraw_remoteTraverseDelete([thing]); break;
                default: break;
            }
            $id_toolsGrab = null;
        }
    }

    // <TriangleButton
    //     fillColor_closure={() => { return k.backgroundColor; }}
    //     onClick={() => handleClick('????')}
    //     extra={svgPath.dash(diameter, 2)}
    //     direction={Direction.left}
    //     center={deleteParentCenter}
    //     strokeColor={color}
    //     id={'deleteParent'}
    //     size={diameter}/>

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
	fillColor_closure={() => { return $adding_parent ? thing.color : k.backgroundColor }}
    extraColor = {$adding_parent ? k.backgroundColor : thing.color}
	onClick={() => handleClick('addParent')}
    extra={svgPath.tCross(diameter, 2)}
	direction={Direction.left}
	center={center_addParent}
	strokeColor={color}
    size={diameter}
	id={'addParent'}/>
<TriangleButton
	fillColor_closure={() => { return k.backgroundColor; }}
	onClick={() => handleClick('child')}
    extra={svgPath.tCross(diameter, 2)}
	direction={Direction.right}
    extraColor = {thing.color}
	center={center_addChild}
	strokeColor={color}
    size={diameter}
	id={'child'}/>
<button class='delete'
    on:click={() => handleClick('delete')}
	style='top: {top + diameter + 13}px;
        left: {left - 1}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <Trash color={color}/>
</button>
