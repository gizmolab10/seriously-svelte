<script lang='ts'>
    import { k, Path, Rect, Size, Point, Wrapper, ZIndex, onMount } from '../../ts/common/GlobalImports';
    import { svgPath, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
    import { s_dot_size, s_altering_parent, s_row_height } from '../../ts/managers/State';
    import { s_path_toolsGrab, s_tools_inWidgets } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import RevealDot from './RevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Trash from '../svg/Trash.svelte';
	export let path: Path;
    let center_deleteParent = new Point();
    let center_addParent = new Point();
    let center_addChild = new Point();
    let center_cluster = new Point();
	let diameter = $s_dot_size;
	let radius = diameter / 2;
    let thing = path.thing();
    let color = thing.color;
    let left = 60;
    let top = 24;

    onMount( () => {
        setTimeout(() => {
            const rect = Rect.createFromDOMRect(path.widgetWrapper.component.getBoundingClientRect());
            const center = rect.centerLeft.offsetBy(new Point(-6, -50));
            const titleWidth = thing.titleWidth;
            const offsetX = Math.max(0, (k.toolsClusterHeight - titleWidth - 21) / 8)
            const offsetY = Math.max(0, (($s_tools_inWidgets ? k.toolsClusterHeight : 0) - $s_row_height - 21) / 8)

            color = thing.color;
            top = ($s_tools_inWidgets ? -3 : center.y) - offsetY;
            left = ($s_tools_inWidgets ? -3 : center.x - 80) + titleWidth + offsetX;
            const otherLeft = left - diameter * 1.2;
            center_addChild = new Point(left, top - diameter);
            center_addParent = new Point(otherLeft, top - diameter);
            center_cluster = new Point(left + radius - 2, top + diameter + 2);
            center_deleteParent = new Point(otherLeft, top + diameter + 10);
        }, 10)
	});

	async function handleClick(buttonID: string) {
        if (!thing.isExemplar) {
            switch (buttonID) {
                case 'addParent': toggleAlteration(AlteringParent.adding); return;
                case 'deleteParent': toggleAlteration(AlteringParent.deleting); return;
                case 'addChild': await dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf(path.parentPath); break;
                case 'delete': await dbDispatch.db.hierarchy.paths_rebuild_remoteTraverseDelete([path]); break;
                default: break;
            }
            $s_path_toolsGrab = null;
        }
    }

    function toggleAlteration(alteration: AlteringParent) {
        $s_altering_parent = ($s_altering_parent == alteration) ? null : alteration;
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
    .toolsCluster {
        position: absolute;
    }
</style>

<div class='toolsCluster' style='top: {path.widgetWrapper} z-index: {ZIndex.lines}'>
    {#if !$s_tools_inWidgets}
        <Circle radius={k.toolsClusterHeight / 2.5} center={center_cluster} color={color} thickness=1 zindex={ZIndex.lines}/>
		<RevealDot path={path} center={center_cluster.offsetBy(new Point(-19 - thing.titleWidth, k.toolsClusterHeight / 2 - 51))}/>
    {/if}
    <TriangleButton
        fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
        extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
        onClick={() => handleClick('addParent')}
        extra={svgPath.tCross(diameter, 2)}
        direction={Direction.left}
        center={center_addParent}
        strokeColor={color}
        size={diameter}
        id='addParent'/>
    {#if thing.parents.length > 1}
        <TriangleButton
            fillColor_closure={() => { return ($s_altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
            extraColor={($s_altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
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
        style='border: none;
            cursor: pointer;
            background: none;
            left: {left - 1}px;
            z-index: {ZIndex.lines};
            top: {top + diameter + 13}px;'>
        <Trash color={color}/>
    </button>
</div>
