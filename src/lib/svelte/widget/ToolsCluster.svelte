<script lang='ts'>
    import { svgPath, Direction, dbDispatch, AlteringParent, TypeCT } from '../../ts/common/GlobalImports';
    import { k, Rect, Size, Point, Wrapper, ZIndex, onMount, signals } from '../../ts/common/GlobalImports';
	import { s_tools_inWidgets, s_user_graphOffset, s_path_toolsCluster } from '../../ts/managers/State';
	import { s_dot_size, s_row_height, s_graphRect, s_altering_parent } from '../../ts/managers/State';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
    import { transparentize } from 'color2k';
	import Trash from '../svg/Trash.svelte';
	let thing = $s_path_toolsCluster.thing();
    let c: { [type: string]: Point } = {}
    let titleWidth = thing.titleWidth;
    let revealOffset = new Point();
    let userOffset = new Point();
    let bigOffset = new Point();
	let diameter = $s_dot_size;
	let radius = diameter / 2;
	let color = thing.color;
	let left = 64;

	onMount(() => { setTimeout(() => { update(); }, 10) });
    const relayoutHandler = signals.handle_relayout(() => { update(); });
    function centers_isEmpty(): boolean { return Object.keys(c).length == 0; }
    function setC(type: string, center: Point) { return c[type] = center; }
    
    function getC(type: string) {
        if (centers_isEmpty()) {
            console.log(`empty c array for \"${type}\"`);
        }
        return c[type] ?? new Point();
    }

    $: {
        if ($s_user_graphOffset || $s_graphRect) {
            update();
        }
    }

    $: {
        if (userOffset != $s_user_graphOffset) {
            userOffset = $s_user_graphOffset
            update();
        }
    }

	async function handleClick(buttonID: string) {
		if (!thing.isExemplar) {
            await dbDispatch.db.hierarchy.handleToolClicked(buttonID);
		}
	}

	function update() {
        bigOffset = new Point(-19 - titleWidth, k.toolsClusterHeight / 2 - 51);
        if ($s_tools_inWidgets) {
            updateForInsideWidget();
        } else if ($s_path_toolsCluster && $s_path_toolsCluster.titleWrapper) {
            updateForOverlay();
        }
	}

	function updateForOverlay() {
		const toolsHeight = k.toolsClusterHeight;
		const halfHeight = toolsHeight / 2;
		const rect = Rect.createFromDOMRect($s_path_toolsCluster.titleWrapper.component.getBoundingClientRect());
		const center = rect.centerLeft.offsetBy(new Point(titleWidth - 92, -34));
		const leftLeft = center.x + radius * 0.8;
		const top = center.y - 6;
		left = center.x - diameter * 2.1;
		setC(TypeCT.cluster, center);
		setC(TypeCT.add, new Point(leftLeft, top - diameter));
		setC(TypeCT.addParent, new Point(left, top - diameter));
		setC(TypeCT.delete, new Point(leftLeft, top + diameter - 5));
		setC(TypeCT.deleteParent, new Point(left, top + diameter - 8));
		setC(TypeCT.more, new Point(center.x - diameter - 1, top + diameter + 3));
		setC(TypeCT.next, new Point(center.x - diameter + 2, top - diameter - 10));
        revealOffset = new Point(-19 - titleWidth, k.toolsClusterHeight / 2 - 51)
		color = thing.color;
	}

	function updateForInsideWidget() {
		const offsetX = Math.max(0, (k.toolsClusterHeight - titleWidth - 21) / 8);
		const offsetY = Math.max(0, (k.toolsClusterHeight - $s_row_height - 21) / 8);
		const top = -offsetY - 3;
		left = offsetX + titleWidth - 3;
		const otherLeft = left - diameter * 1.2;
		setC(TypeCT.add, new Point(left, top - diameter));
		setC(TypeCT.delete, new Point(left, top + diameter + 12));
		setC(TypeCT.addParent, new Point(otherLeft, top - diameter));
		setC(TypeCT.deleteParent, new Point(otherLeft, top + diameter + 10));
		setC(TypeCT.cluster, new Point(left + radius - 2, top + diameter + 2));
		setC(TypeCT.more, new Point(center.x - diameter - 1, top + diameter + 3));	// TODO: test
		setC(TypeCT.next, new Point(center.x - diameter + 2, top - diameter - 10));	// TODO: test
		color = thing.color;
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
    <div class='toolsCluster' style='
        position:absolute;
        z-index: {ZIndex.lines}'>
        {#if !$s_tools_inWidgets}
            <TransparencyCircle
                thickness=1
                opacity=0.15
                zindex={ZIndex.lines}
                color={transparentize(color, 0.2)}
                backgroundColor={k.backgroundColor}
                radius={k.toolsClusterHeight / 2.5}
                center={getC(TypeCT.cluster)}/>
            <RevealDot path={$s_path_toolsCluster} center={getC(TypeCT.cluster).offsetBy(bigOffset)}/>
            <LabelButton
                color={color}
                center={getC(TypeCT.more)}
                onClick={() => handleClick(TypeCT.more)}>
                <svg style='position:absolute'
                    width='28'
                    height='16'
                    fill={'transparent'}
                    stroke={color}
                    viewBox='6 2 16 16'>
                    <path d={svgPath.oval(20, true)}/>
                </svg>
                <svg style='position:absolute'
                    width='16'
                    height='10'
                    fill={color}
                    viewBox='-2 -2 14 10'>
                    <path d={svgPath.ellipses(1, 2)}/>
                </svg>
            </LabelButton>
            {#if thing.parents.length > 1}
                <TriangleButton
                    fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
                    extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
                    onClick={() => handleClick(TypeCT.next)}
                    extra={svgPath.circle(diameter, 4)}
                    center={getC(TypeCT.next)}
                    direction={Direction.up}
                    strokeColor={color}
                    size={diameter}
                    id='next'/>
            {/if}
        {/if}
        <TriangleButton
            fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
            extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
            onClick={() => handleClick(TypeCT.addParent)}
            center={getC(TypeCT.addParent)}
            extra={svgPath.tCross(diameter, 2)}
            direction={Direction.left}
            strokeColor={color}
            id='addParent'
            size={diameter}/>
        {#if thing.parents.length > 1}
            <TriangleButton
                fillColor_closure={() => { return ($s_altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
                extraColor={($s_altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
                onClick={() => handleClick(TypeCT.deleteParent)}
                center={getC(TypeCT.deleteParent)}
                extra={svgPath.dash(diameter, 2)}
                direction={Direction.left}
                strokeColor={color}
                id='deleteParent'
                size={diameter}/>
        {/if}
        <TriangleButton
            fillColor_closure={() => { return k.backgroundColor; }}
            onClick={() => handleClick(TypeCT.add)}
            extra={svgPath.tCross(diameter, 2)}
            center={getC(TypeCT.add)}
            direction={Direction.right}
            extraColor={thing.color}
            strokeColor={color}
            size={diameter}
            id='add'/>
        <button class='delete'
            on:click={() => handleClick(TypeCT.delete)}
            style='border: none;
                cursor: pointer;
                background: none;
                z-index: {ZIndex.lines};
                left: {getC(TypeCT.delete).x}px;
                top: {getC(TypeCT.delete).y}px;'>
            <Trash color={color}/>
        </button>
    </div>
{/key}
