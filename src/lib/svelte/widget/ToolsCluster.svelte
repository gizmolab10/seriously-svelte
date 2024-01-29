<script lang='ts'>
	import { k, Rect, Size, Point, Wrapper, ZIndex, onMount, signals } from '../../ts/common/GlobalImports';
	import { s_path_toolsGrab, s_tools_inWidgets, s_user_graphOffset } from '../../ts/managers/State';
	import { svgPath, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_row_height, s_altering_parent } from '../../ts/managers/State';
    import { transparentize } from 'color2k';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
	import Trash from '../svg/Trash.svelte';
    let centers: { [id: string]: Point } = {}
    let revealOffset = new Point();
    let userOffset = new Point();
	let diameter = $s_dot_size;
	let radius = diameter / 2;
	let thing = $s_path_toolsGrab.thing();
	let color = thing.color;
	let left = 64;

	export enum ToolType {
		deleteParent = 'P',
		addParent	 = 'A',
		cluster		 = 'c',
		delete		 = 'd',
		next		 = 'n',
		more		 = 'm',
		add     	 = 'a',
	}

	onMount(() => { setTimeout(() => { update(); }, 10) });
    const relayoutHandler = signals.handle_relayout(() => { update(); });

    $: {
        if (userOffset != $s_user_graphOffset) {
            userOffset = $s_user_graphOffset
            update();
        }
    }

	function update() {
        if ($s_tools_inWidgets) {
            updateForInsideWidget();
        } else if ($s_path_toolsGrab.widgetWrapper) {
            updateForOverlay();
        }
	}

	function updateForOverlay() {
		const toolsHeight = k.toolsClusterHeight;
		const halfHeight = toolsHeight / 2;
		const titleWidth = thing.titleWidth;
		const rect = Rect.createFromDOMRect($s_path_toolsGrab.titleWrapper.component.getBoundingClientRect());
		const center = rect.centerLeft.offsetBy(new Point(titleWidth - 92, -34));
		const top = center.y - 6;
		left = center.x - diameter * 2.1;
		const leftLeft = center.x + radius * 0.8;
		centers[ToolType.cluster] = center;
		centers[ToolType.add] = new Point(leftLeft, top - diameter);
		centers[ToolType.addParent] = new Point(left, top - diameter);
		centers[ToolType.delete] = new Point(leftLeft, top + diameter - 5);
		centers[ToolType.deleteParent] = new Point(left, top + diameter - 8);
		centers[ToolType.next] = new Point(center.x - diameter + 2, top - diameter - 10);
		centers[ToolType.more] = new Point(center.x - diameter - 1, top + diameter + 3);
        revealOffset = new Point(-19 - thing.titleWidth, k.toolsClusterHeight / 2 - 51)
		color = thing.color;
	}

	function updateForInsideWidget() {
		const titleWidth = thing.titleWidth;
		const offsetX = Math.max(0, (k.toolsClusterHeight - titleWidth - 21) / 8);
		const offsetY = Math.max(0, (k.toolsClusterHeight - $s_row_height - 21) / 8);
		const top = -offsetY - 3;
		left = offsetX + titleWidth - 3;
		const otherLeft = left - diameter * 1.2;
		centers[ToolType.add] = new Point(left, top - diameter);
		centers[ToolType.delete] = new Point(left, top + diameter + 12);
		centers[ToolType.addParent] = new Point(otherLeft, top - diameter);
		centers[ToolType.deleteParent] = new Point(otherLeft, top + diameter + 10);
		centers[ToolType.cluster] = new Point(left + radius - 2, top + diameter + 2);
		color = thing.color;
	}

	async function handleClick(buttonID: string) {
		if (!thing.isExemplar) {
			switch (buttonID) {
				case ToolType.addParent: toggleAlteration(AlteringParent.adding); return;
				case ToolType.deleteParent: toggleAlteration(AlteringParent.deleting); return;
				case ToolType.add: await dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf($s_path_toolsGrab); break;
				case ToolType.delete: await dbDispatch.db.hierarchy.paths_rebuild_remoteTraverseDelete([$s_path_toolsGrab]); break;
                case ToolType.more: console.log('needs more'); break;
                case ToolType.next: console.log('needs next'); break;
				default: break;
			}
			$s_path_toolsGrab = null;
			signals.signal_relayout_fromHere();
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

{#key thing}
    <div class='toolsCluster' style='position:absolute; z-index: {ZIndex.lines}'>
        {#if !$s_tools_inWidgets}
            <TransparencyCircle
                thickness=1
                opacity=0.15
                zindex={ZIndex.lines}
                color={transparentize(color, 0.2)}
                backgroundColor={k.backgroundColor}
                radius={k.toolsClusterHeight / 2.5}
                center={centers[ToolType.cluster]}/>
            <RevealDot path={$s_path_toolsGrab} center={centers[ToolType.cluster].offsetBy(new Point(-19 - thing.titleWidth, k.toolsClusterHeight / 2 - 51))}/>
            <LabelButton
                color={color}
                center={centers[ToolType.more]}
                onClick={() => handleClick(ToolType.more)}>
                <svg style='position:absolute' width='28' height='16' fill={'transparent'} stroke={color} viewBox='6 2 16 16'>
                    <path d={svgPath.oval(20, true)}/>
                </svg>
                <svg style='position:absolute' width='16' height='10' fill={color} viewBox='-2 -2 14 10'>
                    <path d={svgPath.ellipses(1, 2)}/>
                </svg>
            </LabelButton>
            <TriangleButton
                fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
                extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
                onClick={() => handleClick(ToolType.next)}
                extra={svgPath.circle(diameter, 4)}
                center={centers[ToolType.next]}
                direction={Direction.up}
                strokeColor={color}
                size={diameter}
                id='next'/>
        {/if}
        <TriangleButton
            fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
            extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
            onClick={() => handleClick(ToolType.addParent)}
            center={centers[ToolType.addParent]}
            extra={svgPath.tCross(diameter, 2)}
            direction={Direction.left}
            strokeColor={color}
            id='addParent'
            size={diameter}/>
        {#if thing.parents.length > 1}
            <TriangleButton
                fillColor_closure={() => { return ($s_altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
                extraColor={($s_altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
                onClick={() => handleClick(ToolType.deleteParent)}
                center={centers[ToolType.deleteParent]}
                extra={svgPath.dash(diameter, 2)}
                direction={Direction.left}
                strokeColor={color}
                id='deleteParent'
                size={diameter}/>
        {/if}
        <TriangleButton
            fillColor_closure={() => { return k.backgroundColor; }}
            onClick={() => handleClick(ToolType.add)}
            extra={svgPath.tCross(diameter, 2)}
            center={centers[ToolType.add]}
            direction={Direction.right}
            extraColor={thing.color}
            strokeColor={color}
            size={diameter}
            id='add'/>
        <button class='delete'
            on:click={() => handleClick('delete')}
            style='border: none;
                cursor: pointer;
                background: none;
                z-index: {ZIndex.lines};
                left: {centers[ToolType.delete].x}px;
                top: {centers[ToolType.delete].y}px;'>
            <Trash color={color}/>
        </button>
    </div>
{/key}
