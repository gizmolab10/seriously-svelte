<script lang='ts'>
    import { g, k, Rect, Size, Point, IDTool, ZIndex, onMount, Wrapper, signals } from '../../ts/common/GlobalImports';
    import { s_dot_size, s_row_height, s_graphRect, s_show_details } from '../../ts/managers/State';
	import { svgPath, onDestroy, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
    import { s_user_graphOffset, s_altering_parent, s_path_toolsCluster } from '../../ts/managers/State';
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
	let toggle = false;
    let titleWidth = 0;
	let color = '';
	let left = 64;
	let thing;
    let path;

	onDestroy( () => { relayout_signalHandler.disconnect(); });
    function getC(type: string) { return c[type] ?? new Point(); }
    function setC(type: string, center: Point) { return c[type] = center; }
    function centers_isEmpty(): boolean { return Object.keys(c).length == 0; }
	onMount(() => { setup(); setTimeout(() => { updateMaybeRedraw(); }, 20) });

	async function handleClick(IDButton: string, event: MouseEvent) {
		if (path && !path.isExemplar) {
            await g.hierarchy.handleToolClicked(IDButton, event);
		}
	}

    function setup() {
        userOffset = $s_user_graphOffset;
        path = $s_path_toolsCluster;
        thing = path?.thing;
    }

    function updateMaybeRedraw() {
        if (update()) {
            toggle = !toggle;
        }
    }
	
	const relayout_signalHandler = signals.handle_relayout((path) => {
        setTimeout(() => {
            update();
            toggle = !toggle;
        }, 1);      // wait for graph to relayout
	});

    $: {
        if ((graphRect != $s_graphRect) || (userOffset != $s_user_graphOffset)) {
            userOffset = $s_user_graphOffset;
            graphRect = $s_graphRect;
            updateMaybeRedraw();
        }
    }

    $: {
        if (!$s_path_toolsCluster?.matchesPath(path) ?? false) {
            path = $s_path_toolsCluster;
            thing = path?.thing;
            if (thing) {
                color = thing.color;
                titleWidth = thing.titleWidth;
            } else {
                color = '';
                titleWidth = 0;
            }
            update();
            toggle = !toggle;
        }
    }

	function update(): boolean {
        const rect = path?.thingTitleRect;
        bigOffset = new Point(-21 - titleWidth, k.toolsClusterHeight / 2 - 51.5);
        if (rect && $s_path_toolsCluster && rect.size.width != 0) {
            const offsetY = (g.titleIsAtTop ? -45 : 0) - 73.5;
            const offsetX = 7 - ($s_show_details ? k.detailsWidth : 0);
            const center = rect.centerLeft.offsetBy(new Point(titleWidth + offsetX, offsetY));
            const right = center.x + diameter * 1.3;
            const y = center.y;
            left = center.x - diameter - 2;
            setC(IDTool.add, new Point(right, y - radius));
            setC(IDTool.addParent, new Point(left, y - radius));
            setC(IDTool.cluster, center.offsetBy(new Point(4, 4)));
            setC(IDTool.deleteParent, new Point(left, y + diameter));
            setC(IDTool.next, new Point(center.x + 2, y - radius - 10));
            setC(IDTool.delete, new Point(right - radius - 3, y + diameter - 5));
            setC(IDTool.more, new Point(center.x - diameter + 2, y + diameter + 1));
            revealOffset = new Point(-19 - titleWidth, k.toolsClusterHeight / 2 - 51);
            return true;
        }
        return false;
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

{#key toggle}
    {#if $s_path_toolsCluster}
        <div class='toolsCluster' style='
            position:absolute;
            z-index: {ZIndex.lines}'>
            <TransparencyCircle
                thickness=1
                opacity=0.15
                color={color}
                zindex={ZIndex.lines}
                center={getC(IDTool.cluster)}
                radius={k.toolsClusterHeight / 2.5}
                backgroundColor={transparentize(k.backgroundColor, 0.05)}/>
            <RevealDot thing={thing} path={$s_path_toolsCluster} center={getC(IDTool.cluster).offsetBy(bigOffset)}/>
            <LabelButton
                color={color}
                center={getC(IDTool.more)}
                onClick={(event) => handleClick(IDTool.more, event)}>
                <svg style='position:absolute'
                    width='28'
                    height='16'
                    stroke={color}
                    fill={'transparent'}
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
                    onClick={(event) => handleClick(IDTool.next, event)}
                    extra={svgPath.circle(diameter, 4)}
                    center={getC(IDTool.next)}
                    direction={Direction.up}
                    strokeColor={color}
                    size={diameter}
                    id='next'/>
            {/if}
            <TriangleButton
                fillColor_closure={() => { return ($s_altering_parent == AlteringParent.adding) ? thing.color : k.backgroundColor }}
                extraColor={($s_altering_parent == AlteringParent.adding) ? k.backgroundColor : thing.color}
                onClick={(event) => handleClick(IDTool.addParent, event)}
                center={getC(IDTool.addParent)}
                extra={svgPath.tCross(diameter, 2)}
                direction={Direction.left}
                strokeColor={color}
                id='addParent'
                size={diameter}/>
            {#if thing.parents.length > 1}
                <TriangleButton
                    fillColor_closure={() => { return ($s_altering_parent == AlteringParent.deleting) ? thing.color : k.backgroundColor }}
                    extraColor={($s_altering_parent == AlteringParent.deleting) ? k.backgroundColor : thing.color}
                    onClick={(event) => handleClick(IDTool.deleteParent, event)}
                    center={getC(IDTool.deleteParent)}
                    extra={svgPath.dash(diameter, 2)}
                    direction={Direction.left}
                    strokeColor={color}
                    id='deleteParent'
                    size={diameter}/>
            {/if}
            <TriangleButton
                fillColor_closure={() => { return k.backgroundColor; }}
                onClick={(event) => handleClick(IDTool.add, event)}
                extra={svgPath.tCross(diameter, 2)}
                center={getC(IDTool.add)}
                direction={Direction.right}
                extraColor={thing.color}
                strokeColor={color}
                size={diameter}
                id='add'/>
            <button class='delete'
                on:click={(event) => handleClick(IDTool.delete, event)}
                style='border: none;
                    cursor: pointer;
                    background: none;
                    z-index: {ZIndex.lines};
                    left: {getC(IDTool.delete).x}px;
                    top: {getC(IDTool.delete).y}px;'>
                <Trash color={color}/>
            </button>
        </div>
    {/if}
{/key}
