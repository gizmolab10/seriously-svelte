<script lang='ts'>
    import { svgPath, onDestroy, Direction, dbDispatch, transparentize, AlteringParent } from '../../ts/common/GlobalImports';
    import { g, k, u, Rect, Size, Point, IDTool, ZIndex, onMount, Wrapper, signals } from '../../ts/common/GlobalImports';
    import { s_user_graphOffset, s_altering_parent, s_path_toolsCluster } from '../../ts/common/State';
    import { s_graphRect, s_show_details } from '../../ts/common/State';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import TriangleButton from '../svg/TriangleButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import RevealDot from './RevealDot.svelte';
	import Trash from '../svg/Trash.svelte';
    const clusterDiameter = 64;
	const toolDiameter = k.dot_size * 1.4;
    const clusterRadius = clusterDiameter / 2;
    const needsMultipleVisibleParents = [IDTool.next, IDTool.delete_parent];
    const parentAltering = [IDTool.add_parent, IDTool.delete_parent];
    const halfCircleViewBox = `0 0 ${clusterDiameter} ${clusterDiameter}`;
    let hovers: { [type: string]: boolean } = {}
    let centers: { [type: string]: Point } = {}
    let countOfVisibleParents = 0;
    let parentSensitiveColor = '';
    let confirmingDelete = false;
    let userOffset = new Point();
    let graphRect = new Rect();
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

    function alterationFor(id: string) {
        return(id == IDTool.add_parent) ? AlteringParent.adding : AlteringParent.deleting;
    }

    function isInvertedFor(id: string) {
        return parentAltering.includes(id) && $s_altering_parent == alterationFor(id);
    }

    function isDisabledFor(id: string) {
        return (path.isHere && (id == IDTool.add_parent)) ||
        ((countOfVisibleParents < 2) && needsMultipleVisibleParents.includes(id));
    }

    function fillColorsFor(id: string, isFilled: boolean): [string, string] {
        const isDisabled = isDisabledFor(id);
        const nextIsDisabled = isDisabled && needsMultipleVisibleParents.includes(id);
        if (isDisabled || (isFilled == isInvertedFor(id))) {
            const extraColor = nextIsDisabled ? k.color_disabled : isDisabled || isFilled ? parentSensitiveColor : color;
            return [k.color_background, extraColor];
        }
        return [color, k.color_background];
    }

    async function handleClick(id: string, event: MouseEvent) {
        switch (id) {
            case IDTool.delete: confirmingDelete = true; break;
            case IDTool.delete_cancel: confirmingDelete = false; break;
            default:
                if (path && !path.isExemplar && !isDisabledFor(id)) {
                    await g.hierarchy.handleToolClicked(id, event);
        		}
                break;
        }
        updateMaybeRedraw();
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
	
	const relayout_signalHandler = signals.handle_relayoutWidgets((path) => {
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
                const hasOneParent = (thing?.parents.length ?? 0) == 1;
                countOfVisibleParents = path.visibleFromPaths(0).length;
                parentSensitiveColor = (hasOneParent || path.isHere) ? k.color_disabled : color ;
                update();
                toggle = !toggle;
            }
        }
    }

	function update(): boolean {
        const rect = path?.titleRect;
        if (rect && $s_path_toolsCluster && rect.size.width != 0) {
            const offsetReveal = new Point(-5.7, -5.5);
            const offsetTitle = titleWidth * (path.isExpanded ? 1 : 1.034);
            const offsetX = 8.8 + offsetTitle - ($s_show_details ? k.width_details : 0);
            const offsetY = (g.titleIsAtTop ? -45 : 0) - clusterDiameter - 5.4;
            const center = rect.centerLeft.offsetBy(new Point(offsetX, offsetY));
            left = center.x - toolDiameter;
            const y = center.y;
            setC(IDTool.cluster,        center);
            setC(IDTool.dismiss,        center.offsetBy(offsetReveal));
            setC(IDTool.confirmation,   center.offsetEquallyBy(1 - clusterRadius));
            setC(IDTool.delete_cancel,  center.offsetBy(new Point(1 - toolDiameter, toolDiameter - 5)));
            setC(IDTool.delete_confirm, center.offsetBy(new Point(2 - toolDiameter, 5 - toolDiameter)));
            setC(IDTool.create,         new Point(center.x + toolDiameter - 3, y - toolDiameter + 6));
            setC(IDTool.more,           new Point(center.x + 1, y + toolDiameter + 4));
            setC(IDTool.next,           new Point(center.x - 2, y - toolDiameter - 2));
            setC(IDTool.delete_parent,  new Point(left - 1, y + toolDiameter - 8));
            setC(IDTool.add_parent,     new Point(left - 1, y - toolDiameter + 6));
            setC(IDTool.delete,         new Point(center.x + 4, y + 3));
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
		border-radius: 17px;
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
                radius={clusterRadius}
                center={getC(IDTool.cluster)}
                color_background={transparentize(k.color_background, 0.05)}/>
            {#if confirmingDelete}
                {#if hovers[IDTool.delete_confirm]}
                    <svg class='delete-confirm' style='
                            left:{getC(IDTool.confirmation).x}px;
                            top:{getC(IDTool.confirmation).y}px;
                            z-index:{ZIndex.lines};'
                        viewBox={halfCircleViewBox}
                        height={clusterDiameter}
                        width={clusterDiameter}
                        stroke=transparent
                        fill={color}>
                        <path d={svgPath.halfCircle(clusterDiameter, Direction.up)}/>
                    </svg>
                {/if}
                {#if hovers[IDTool.delete_cancel]}
                    <svg class='delete-cancel' style='
                            left:{getC(IDTool.confirmation).x}px;
                            top:{getC(IDTool.confirmation).y}px;
                            z-index:{ZIndex.lines};'
                        viewBox={halfCircleViewBox}
                        height={clusterDiameter}
                        width={clusterDiameter}
                        fill={color}>
                        <path d={svgPath.halfCircle(clusterDiameter, Direction.down)}/>
                    </svg>
                {/if}
                <LabelButton
                    hover_closure={(isHovering) => { hovers[IDTool.delete_confirm] = isHovering; }}
                    color={ hovers[IDTool.delete_confirm] ? k.color_background : color}
                    onClick={(event) => handleClick(IDTool.delete_confirm, event)}
                    center={getC(IDTool.delete_confirm)}>
                    delete
                </LabelButton>
                <LabelButton
                    hover_closure={(isHovering) => { hovers[IDTool.delete_cancel] = isHovering; }}
                    color={ hovers[IDTool.delete_cancel] ? k.color_background : color}
                    onClick={(event) => handleClick(IDTool.delete_cancel, event)}
                    center={getC(IDTool.delete_cancel)}>
                    cancel
                </LabelButton>
                <div class='horizontal-line'
                    style='
                        height: 1px;
                        position: absolute;
                        background-color: {color};
                        z-index: {ZIndex.frontmost};
                        width: {clusterDiameter + 1}px;
                        top: {getC(IDTool.cluster).y + 0.5}px;
                        left: {getC(IDTool.cluster).x - clusterRadius}px;'>
                </div>
            {:else}
            <LabelButton
                width=18
                height=16
                color={color}
                center={getC(IDTool.more)}
                onClick={(event) => handleClick(IDTool.more, event)}
                hover_closure={(isHovering) => { hovers[IDTool.more] = isHovering; }}>
                <svg width=18
                    height=16
                    stroke={color}
                    viewBox='0 1 18 16'
                    fill={hovers[IDTool.more] ? color : 'transparent'}>
                    <path d={svgPath.oval(18, true)}/>
                </svg>
                <svg width=16
                    height=10
                    viewBox='-2 -2 14 10'
                    fill={hovers[IDTool.more] ? k.color_background : color}>
                    <path d={svgPath.tinyDots_linear(3, 1)}/>
                </svg>
            </LabelButton>
            <RevealDot thing={thing} path={$s_path_toolsCluster} center={getC(IDTool.dismiss)}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.next, isFilled) }}
                strokeColor={isDisabledFor(IDTool.next) ? k.color_disabled : parentSensitiveColor}
                cursor={isDisabledFor(IDTool.next) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.next, event)}
                extraPath={svgPath.circle(toolDiameter, 4)}
                center={getC(IDTool.next)}
                direction={Direction.up}
                size={toolDiameter}
                id='next'/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.delete_parent, isFilled) }}
                strokeColor={isDisabledFor(IDTool.delete_parent) ? k.color_disabled : parentSensitiveColor}
                cursor={isDisabledFor(IDTool.delete_parent) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.delete_parent, event)}
                extraPath={svgPath.dash(toolDiameter, 4)}
                center={getC(IDTool.delete_parent)}
                direction={Direction.left}
                id='delete_parent'
                size={toolDiameter}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.add_parent, isFilled) }}
                cursor={isDisabledFor(IDTool.add_parent) ? 'normal' : 'pointer'}
                onClick={(event) => handleClick(IDTool.add_parent, event)}
                strokeColor={path.isHere ? parentSensitiveColor : color}
                extraPath={svgPath.tCross(toolDiameter, 3)}
                center={getC(IDTool.add_parent)}
                direction={Direction.left}
                id='add_parent'
                size={toolDiameter}/>
            <TriangleButton
                fillColors_closure={(isFilled) => { return fillColorsFor(IDTool.create, isFilled) }}
                onClick={(event) => handleClick(IDTool.create, event)}
                extraPath={svgPath.tCross(toolDiameter, 3)}
                center={getC(IDTool.create)}
                direction={Direction.right}
                strokeColor={color}
                size={toolDiameter}
                id='add'/>
            <button id='delete'
                on:blur={u.ignore}
                on:focus={u.ignore}
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
