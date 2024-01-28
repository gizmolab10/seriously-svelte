<script lang='ts'>
    import { k, Path, Rect, Size, Point, Wrapper, ZIndex, onMount } from '../../ts/common/GlobalImports';
    import { s_path_toolsGrab, s_tools_inWidgets, s_user_graphOffset } from '../../ts/managers/State';
    import { svgPath, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
    import { s_dot_size, s_row_height, s_altering_parent } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import RevealDot from './RevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Trash from '../svg/Trash.svelte';
	export let path: Path;
    let c_deleteParent = new Point();
    let c_addParent = new Point();
    let c_addChild = new Point();
    let c_cluster = new Point();
    let c_delete = new Point();
	let diameter = $s_dot_size;
	let radius = diameter / 2;
    let thing = path.thing();
    let color = thing.color;
    let left = 64;

    $: { if ($s_user_graphOffset) { update(); } }
    onMount(() => { setTimeout(() => { update(); }, 10) });

    function update() {
        if ($s_tools_inWidgets) {
            updateForInsideWidget();
        } else if (path.widgetWrapper) {
            updateForOverlaysReveal();
        }
    }

    function updateForInsideWidget() {
        const titleWidth = thing.titleWidth;
        const offsetX = Math.max(0, (k.toolsClusterHeight - titleWidth - 21) / 8);
        const offsetY = Math.max(0, (k.toolsClusterHeight - $s_row_height - 21) / 8);
        const top = -offsetY - 3;
        left = offsetX + titleWidth - 3;
        const otherLeft = left - diameter * 1.2;
        c_addChild = new Point(left, top - diameter);
        c_delete = new Point(left, top + diameter + 12);
        c_addParent = new Point(otherLeft, top - diameter);
        c_deleteParent = new Point(otherLeft, top + diameter + 10);
        c_cluster = new Point(left + radius - 2, top + diameter + 2);
        color = thing.color;
    }

    function updateForOverlaysReveal() {
        const toolsHeight = k.toolsClusterHeight;
        const halfHeight = toolsHeight / 2;
        const titleWidth = thing.titleWidth;
        const rect = Rect.createFromDOMRect(path.widgetWrapper.component.getBoundingClientRect());
        const center = rect.centerLeft.offsetBy(new Point(titleWidth - 82, -35));
        const top = center.y - 6;
        left = center.x - diameter * 2.3;
        const leftLeft = center.x + radius;
        c_cluster = center;
        c_addParent = new Point(left, top - diameter);
        c_addChild = new Point(leftLeft, top - diameter);
        c_delete = new Point(leftLeft, top + diameter - 5);
        c_deleteParent = new Point(left, top + diameter - 8);
        color = thing.color;
    }

	async function handleClick(buttonID: string) {
        if (!thing.isExemplar) {
            switch (buttonID) {
                case 'addParent': toggleAlteration(AlteringParent.adding); return;
                case 'deleteParent': toggleAlteration(AlteringParent.deleting); return;
                case 'addChild': await dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf(path); break;
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

<div class='toolsCluster' style='position:absolute; z-index: {ZIndex.lines}'>
    {#if !$s_tools_inWidgets}
        <Circle radius={k.toolsClusterHeight / 2.5} center={c_cluster} color={color} thickness=1 zindex={ZIndex.lines}/>
		<RevealDot path={path} center={c_cluster.offsetBy(new Point(-19 - thing.titleWidth, k.toolsClusterHeight / 2 - 51))}/>
    {/if}
    <TriangleButton
        fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
        extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
        onClick={() => handleClick('addParent')}
        extra={svgPath.tCross(diameter, 2)}
        direction={Direction.left}
        center={c_addParent}
        strokeColor={color}
        size={diameter}
        id='addParent'/>
    {#if thing.parents.length > 1}
        <TriangleButton
            fillColor_closure={() => { return ($s_altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
            extraColor={($s_altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
            onClick={() => handleClick('deleteParent')}
            extra={svgPath.dash(diameter, 2)}
            center={c_deleteParent}
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
        center={c_addChild}
        extraColor={thing.color}
        strokeColor={color}
        size={diameter}
        id='addChild'/>
    <button class='delete'
        on:click={() => handleClick('delete')}
        style='border: none;
            cursor: pointer;
            background: none;
            left: {c_delete.x}px;
            z-index: {ZIndex.lines};
            top: {c_delete.y}px;'>
        <Trash color={color}/>
    </button>
</div>
