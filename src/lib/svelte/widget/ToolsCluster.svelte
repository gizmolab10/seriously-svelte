<script lang='ts'>
    import { g, k, Rect, Size, Point, IDTool, ZIndex, onMount, Wrapper, signals } from '../../ts/common/GlobalImports';
    import { svgPath, onDestroy, Direction, dbDispatch, AlteringParent } from '../../ts/common/GlobalImports';
    import { s_user_graphOffset, s_altering_parent, s_path_toolsCluster } from '../../ts/managers/State';
    import { s_dot_size, s_row_height, s_graphRect, s_show_details } from '../../ts/managers/State';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
    import { transparentize } from 'color2k';
	import Trash from '../svg/Trash.svelte';
    let c: { [type: string]: Point } = {}
    let revealOffset = new Point();
    let parentSensitiveColor = '';
    let userOffset = new Point();
    let bigOffset = new Point();
    let graphRect = new Rect();
    let hoveringOnMore = false;
	let diameter = $s_dot_size;
	let radius = diameter / 2;
    let hasOneParent = false;
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
    function disableSensitive() { return [IDTool.next, IDTool.deleteParent]; }
    function isDisabledFor(id: string) { return hasOneParent && disableSensitive().includes(id); }

    function fillColorsFor(id: string, isFilled: boolean): [string, string] {
        const same = isFilled == ($s_altering_parent != null);
        const isDisabled = isDisabledFor(id);
        if (same || isDisabled) {
            const extraColor = isDisabled || isFilled ? parentSensitiveColor : color;
            return [k.backgroundColor, extraColor];
        }
        return [color, k.backgroundColor];
    }

    async function handleClick(id: string, event: MouseEvent) {
		if (path && !path.isExemplar && !isDisabledFor(id)) {
            await g.hierarchy.handleToolClicked(id, event);
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
            if (path) {
                thing = path?.thing;
                if (!thing) {
                    color = '';
                    titleWidth = 0;
                    parentSensitiveColor = '';
                    hasOneParent = true;
                } else {
                    color = thing.color;
                    titleWidth = thing.titleWidth;
                    hasOneParent = thing.parents.length < 2;
                    parentSensitiveColor = hasOneParent ? transparentize('lightgray', 0.3) : color ;
                }
                update();
                toggle = !toggle;
            }
        }
    }

	function update(): boolean {
        const rect = path?.thingTitleRect;
        bigOffset = new Point(-21 - titleWidth, k.toolsClusterHeight / 2 - 50);
        if (rect && $s_path_toolsCluster && rect.size.width != 0) {
            const offsetY = (g.titleIsAtTop ? -45 : 0) - 73.5;
            const offsetX = 7 - ($s_show_details ? k.detailsWidth : 0);
            const center = rect.centerLeft.offsetBy(new Point(titleWidth + offsetX, offsetY));
            const right = center.x + diameter * 1.3;
            const y = center.y;
            left = center.x - diameter - 2;
            setC(IDTool.create, new Point(right, y - radius));
            setC(IDTool.addParent, new Point(left, y - radius));
            setC(IDTool.cluster, center.offsetBy(new Point(4, 3)));
            setC(IDTool.deleteParent, new Point(left, y + diameter));
            setC(IDTool.next, new Point(center.x + 2, y - diameter - 4));
            setC(IDTool.delete, new Point(right - radius - 3, y + radius + 1));
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
                onClick={(event) => handleClick(IDTool.more, event)}
                hover_closure={(isHovering) => { hoveringOnMore = isHovering; }}>
                <svg style='position:absolute;'
                    width=28
                    height=16
                    stroke={color}
                    fill={hoveringOnMore ? color : 'transparent'}
                    viewBox='6 2 16 16'>
                    <path d={svgPath.oval(20, true)}/>
                </svg>
                <svg style='position:absolute;'
                    width=16
                    height=10
                    fill={hoveringOnMore ? k.backgroundColor : color}
                    viewBox='-2 -2 14 10'>
                    <path d={svgPath.ellipses(1, 2)}/>
                </svg>
            </LabelButton>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.next, isFilled) }}
                cursor={isDisabledFor(IDTool.next) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.next, event)}
                extraPath={svgPath.circle(diameter, 4)}
                strokeColor={parentSensitiveColor}
                center={getC(IDTool.next)}
                direction={Direction.up}
                size={diameter}
                id='next'/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.deleteParent, isFilled) }}
                cursor={isDisabledFor(IDTool.deleteParent) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.deleteParent, event)}
                center={getC(IDTool.deleteParent)}
                strokeColor={parentSensitiveColor}
                extraPath={svgPath.dash(diameter, 2)}
                direction={Direction.left}
                id='deleteParent'
                size={diameter}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.addParent, isFilled) }}
                onClick={(event) => handleClick(IDTool.addParent, event)}
                extraPath={svgPath.tCross(diameter, 2)}
                center={getC(IDTool.addParent)}
                direction={Direction.left}
                strokeColor={color}
                id='addParent'
                size={diameter}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.create, isFilled) }}
                onClick={(event) => handleClick(IDTool.create, event)}
                extraPath={svgPath.tCross(diameter, 2)}
                center={getC(IDTool.create)}
                direction={Direction.right}
                strokeColor={color}
                size={diameter}
                id='add'/>
            <button class='delete'
                on:click={(event) => handleClick(IDTool.delete, event)}
                style='
                    left: {getC(IDTool.delete).x}px;border: none;
                    top: {getC(IDTool.delete).y}px;
                    z-index: {ZIndex.lines};
                    background: none;
                    cursor: pointer;'>
                <Trash color={color}/>
            </button>
        </div>
    {/if}
{/key}
