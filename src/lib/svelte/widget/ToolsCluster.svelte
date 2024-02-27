<script lang='ts'>
    import { svgPath, onDestroy, Direction, dbDispatch, transparentize, AlteringParent } from '../../ts/common/GlobalImports';
    import { g, k, Rect, Size, Point, IDTool, ZIndex, onMount, Wrapper, signals } from '../../ts/common/GlobalImports';
    import { s_user_graphOffset, s_altering_parent, s_path_toolsCluster } from '../../ts/managers/State';
    import { s_graphRect, s_show_details } from '../../ts/managers/State';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
	import Trash from '../svg/Trash.svelte';
    let hovers: { [type: string]: boolean } = {}
    let centers: { [type: string]: Point } = {}
    let hasOneVisibleParent = false;
    let revealOffset = new Point();
    let parentSensitiveColor = '';
    let userOffset = new Point();
    let bigOffset = new Point();
    let verifyingDelete = false;
    let graphRect = new Rect();
	let diameter = k.dot_size;
	let radius = diameter / 2;
    let hasOneParent = false;
	let toggle = false;
    let titleWidth = 0;
	let color = '';
	let left = 64;
	let thing;
    let path;

	onDestroy( () => { relayout_signalHandler.disconnect(); });
    function getC(type: string) { return centers[type] ?? new Point(); }
    function setC(type: string, center: Point) { return centers[type] = center; }
    function centers_isEmpty(): boolean { return Object.keys(centers).length == 0; }
	onMount(() => { setup(); setTimeout(() => { updateMaybeRedraw(); }, 20) });
    function disableSensitive() { return [IDTool.next, IDTool.delete_parent]; }
    
    function isDisabledFor(id: string) {
        return (path.isHere && (id == IDTool.add_parent)) ||
        (hasOneVisibleParent && (id == IDTool.next)) ||
        (hasOneParent && disableSensitive().includes(id));
    }

    function fillColorsFor(id: string, isFilled: boolean): [string, string] {
        const isDisabled = isDisabledFor(id);
        const same = isFilled == ($s_altering_parent != null);
        const nextIsDisabled = isDisabled && id == IDTool.next;
        if (same || isDisabled) {
            const extraColor = nextIsDisabled ? k.color_disabled : isDisabled || isFilled ? parentSensitiveColor : color;
            return [k.color_background, extraColor];
        }
        return [color, k.color_background];
    }

    async function handleClick(id: string, event: MouseEvent) {
        switch (id) {
            case IDTool.delete: verifyingDelete = true; break;
            case IDTool.delete_cancel: verifyingDelete = false; break;
            default:
                if (path && !path.isExemplar && !isDisabledFor(id)) {
                    await g.hierarchy.handleToolClicked(id, event);
        		}
                break;
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
                color = thing?.color ?? '';
                titleWidth = thing?.titleWidth ?? 0;
                hasOneParent = (thing?.parents.length ?? 0) < 2;
                hasOneVisibleParent = path.visibleFromPaths(0).length < 2;
                parentSensitiveColor = (hasOneParent || path.isHere) ? k.color_disabled : color ;
                update();
                toggle = !toggle;
            }
        }
    }

	function update(): boolean {
        const rect = path?.titleRect;
        bigOffset = new Point(-19 - titleWidth, k.height_toolsCluster / 2 - 43);
        if (rect && $s_path_toolsCluster && rect.size.width != 0) {
            const offsetY = (g.titleIsAtTop ? -45 : 0) - k.height_toolsCluster - 5;
            const offsetX = 8.5 - ($s_show_details ? k.width_details : 0);
            const center = rect.centerLeft.offsetBy(new Point(titleWidth + offsetX, offsetY));
            const right = center.x + diameter * 1.3;
            const y = center.y;
            left = center.x - diameter;
            setC(IDTool.cluster, center);
            setC(IDTool.create, new Point(right - 2, y - radius - 5));
            setC(IDTool.more, new Point(center.x, y + radius * 3 + 1));
            setC(IDTool.add_parent, new Point(left - 7, y - radius - 5));
            setC(IDTool.next, new Point(center.x - 4, y - diameter - 8));
            setC(IDTool.delete_parent, new Point(left - 7, y + diameter - 3));
            setC(IDTool.delete, new Point(right - radius - 6, y + radius - 4));
            setC(IDTool.delete_cancel, center.offsetBy(new Point(-diameter - 3, diameter)));
            setC(IDTool.delete_confirm, center.offsetBy(new Point(-diameter - 2, -diameter)));
            revealOffset = new Point(-19 - titleWidth, k.height_toolsCluster / 2 - 51);
            return true;
        }
        return false;
	}

</script>

<style>
	svg {
		top:0px;
		left:0px;
		position: absolute;
	}
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

{#key toggle}
    {#if $s_path_toolsCluster}
        <div class='tools-cluster' style='
            position:absolute;
            z-index: {ZIndex.lines}'>
            <TransparencyCircle
                thickness=1
                opacity=0.15
                color={color}
                zindex={ZIndex.lines}
                center={getC(IDTool.cluster)}
                radius={k.height_toolsCluster / 2}
                color_background={transparentize(k.color_background, 0.05)}/>
            {#if verifyingDelete}
                {#if hovers[IDTool.delete_confirm]}
                    <svg width=20
                        height=16
                        fill={color}
                        viewBox='0 2 20 16'>
                        <path d={svgPath.halfCircle(k.height_toolsCluster, true, Direction.up)}/>
                    </svg>
                {/if}
                <LabelButton
                    color={ hovers[IDTool.delete_confirm] ? k.color_background : color}
                    center={getC(IDTool.delete_confirm)}
                    onClick={(event) => handleClick(IDTool.delete_confirm, event)}
                    hover_closure={(isHovering) => { hovers[IDTool.delete_confirm] = isHovering; }}>
                    delete
                </LabelButton>
                <div class='horizontal-line'
                    style='
                        height: 1px;
                        position: absolute;
                        background-color: {color};
                        z-index: {ZIndex.frontmost};
                        top: {getC(IDTool.cluster).y + 0.5}px;
                        width: {(k.height_toolsCluster) + 1}px;
                        left: {getC(IDTool.cluster).x - (k.height_toolsCluster / 2)}px;'>
                </div>
                {#if hovers[IDTool.delete_cancel]}
                    <svg width=20
                        height=16
                        fill={color}
                        viewBox='0 2 20 16'>
                        <path d={svgPath.halfCircle(k.height_toolsCluster, true, Direction.down)}/>
                    </svg>
                {/if}
                <LabelButton
                    color={ hovers[IDTool.delete_cancel] ? k.color_background : color}
                    center={getC(IDTool.delete_cancel)}
                    onClick={(event) => handleClick(IDTool.delete_cancel, event)}
                    hover_closure={(isHovering) => { hovers[IDTool.delete_cancel] = isHovering; }}>
                    cancel
                </LabelButton>
            {:else}
            <LabelButton
                width=20
                height=16
                color={color}
                cursor='pointer'
                center={getC(IDTool.more)}
                onClick={(event) => handleClick(IDTool.more, event)}
                hover_closure={(isHovering) => { hovers[IDTool.more] = isHovering; }}>
                <svg width=20
                    height=16
                    stroke={color}
                    fill={hovers[IDTool.more] ? color : 'transparent'}
                    viewBox='0 2 20 16'>
                    <path d={svgPath.oval(20, true)}/>
                </svg>
                <svg width=16
                    height=10
                    fill={hovers[IDTool.more] ? k.color_background : color}
                    viewBox='-2 -2 14 10'>
                    <path d={svgPath.ellipses(1, 2)}/>
                </svg>
            </LabelButton>
            <RevealDot thing={thing} path={$s_path_toolsCluster} center={getC(IDTool.cluster).offsetBy(bigOffset)}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.next, isFilled) }}
                cursor={isDisabledFor(IDTool.next) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.next, event)}
                extraPath={svgPath.circle(diameter, 4)}
                strokeColor={isDisabledFor(IDTool.next) ? k.color_disabled : parentSensitiveColor}
                center={getC(IDTool.next)}
                direction={Direction.up}
                size={diameter}
                id='next'/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.delete_parent, isFilled) }}
                cursor={isDisabledFor(IDTool.delete_parent) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.delete_parent, event)}
                center={getC(IDTool.delete_parent)}
                strokeColor={parentSensitiveColor}
                extraPath={svgPath.dash(diameter, 2)}
                direction={Direction.left}
                id='delete_parent'
                size={diameter}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.add_parent, isFilled) }}
                cursor={isDisabledFor(IDTool.add_parent) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.add_parent, event)}
                strokeColor={path.isHere ? parentSensitiveColor : color}
                extraPath={svgPath.tCross(diameter, 2)}
                center={getC(IDTool.add_parent)}
                direction={Direction.left}
                id='add_parent'
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
                on:mouseout={() => { hovers[IDTool.delete] = false; }}
                on:mouseover={() => { hovers[IDTool.delete] = true; }}
                on:click={(event) => handleClick(IDTool.delete, event)}
                style='
                    left: {getC(IDTool.delete).x}px;
                    top: {getC(IDTool.delete).y}px;
                    z-index: {ZIndex.lines};
                    background: none;
                    cursor: pointer;
                    border: none;'>
                <Trash color={color} invert={hovers[IDTool.delete]}/>
            </button>
            {/if}
        </div>
    {/if}
{/key}
