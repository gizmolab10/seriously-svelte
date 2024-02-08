<script lang='ts'>
    import { k, Rect, Size, Point, TypeCT, ZIndex, onMount, Wrapper } from '../../ts/common/GlobalImports';
    import { s_tools_inWidgets, s_user_graphOffset, s_path_toolsCluster } from '../../ts/managers/State';
	import { s_dot_size, s_row_height, s_graphRect, s_altering_parent } from '../../ts/managers/State';
	import { svgPath, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
    import { transparentize } from 'color2k';
	import Trash from '../svg/Trash.svelte';
    let c: { [type: string]: Point } = {}
    let revealOffset = new Point();
    let userOffset = new Point();
    let bigOffset = new Point();
    let graphRect = new Rect();
	let diameter = $s_dot_size;
	let radius = diameter / 2;
	let jiggle = false;
    let titleWidth = 0;
	let color = '';
	let left = 64;
	let thing;
    let path;

    function getC(type: string) { return c[type] ?? new Point(); }
    function setC(type: string, center: Point) { return c[type] = center; }
    function centers_isEmpty(): boolean { return Object.keys(c).length == 0; }
	onMount(() => { setup(); setTimeout(() => { updateMaybeRedraw(); }, 20) });

	async function handleClick(buttonID: string) {
		if (!thing.isExemplar) {
            await dbDispatch.db.hierarchy.handleToolClicked(buttonID);
		}
	}

    function setup() {
        userOffset = $s_user_graphOffset;
        path = $s_path_toolsCluster;
        thing = path?.thing();
    }

    function updateMaybeRedraw() {
        if (update()) {
            jiggle = !jiggle;
        }
    }

    $: {
        if ((graphRect != $s_graphRect) || (userOffset != $s_user_graphOffset)) {
            userOffset = $s_user_graphOffset;
            graphRect = $s_graphRect;
            updateMaybeRedraw();
        }
    }

    $: {
        if (!path || !path.matchesPath($s_path_toolsCluster)) {
            path = $s_path_toolsCluster;
            thing = path?.thing();
            if (thing) {
                color = thing.color;
                titleWidth = thing.titleWidth;
            } else {
                color = '';
                titleWidth = 0;
            }
            update();
            jiggle = !jiggle;
        }
    }

	function update() {
        bigOffset = new Point(-19 - titleWidth, k.toolsClusterHeight / 2 - 51);
        const path = $s_path_toolsCluster;
        if (path) {
            if ($s_tools_inWidgets) {
                updateForInsideWidget();
                return true;
            } else if (updateForInFront()) {
                return true;
            }
        }
        return false;
	}

    function updateForInFront(): boolean {
        debug();
        const rect = path?.thingTitleRect;
        if (rect && rect.size.width != 0) {
            const center = rect.centerLeft.offsetBy(new Point(titleWidth + 9, -33.5));
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
            revealOffset = new Point(-19 - titleWidth, k.toolsClusterHeight / 2 - 51);
            return true;
        }
        return false;
	}

    function debug() {
        const wrapKeys = Object.keys(path?.wrappers ?? []);
        if (path && wrapKeys.length > 0) {
            console.log(`${path.thingTitles} ${wrapKeys}`);
        }
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

{#key jiggle}
    {#if $s_path_toolsCluster}
        <div class='toolsCluster' style='
            position:absolute;
            z-index: {ZIndex.lines}'>
            {#if !$s_tools_inWidgets}
                <TransparencyCircle
                    thickness=1
                    opacity=0.15
                    color={color}
                    zindex={ZIndex.lines}
                    backgroundColor={transparentize(k.backgroundColor, 0.05)}
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
    {/if}
{/key}
