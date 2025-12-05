<script lang='ts'>
    import { g, k, s, u, x, hits, debug, colors } from '../../ts/common/Global_Imports';
    import { T_Layer, T_Drag, T_Hit_Target } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, Ancestry } from '../../ts/common/Global_Imports';
    import { onMount, onDestroy } from 'svelte';
    export let strokeWidth = k.thickness.rubberband;
    export let bounds: Rect;
    const enabled = true;
    const { w_dragging } = hits;
	const { w_separator_color } = colors;
    const { w_count_mouse_up, w_s_title_edit } = s;
    const { w_mouse_location, w_scaled_movement, w_user_graph_offset } = g;
    let mouse_upCount = $w_count_mouse_up;
    let startPoint: Point | null = null;
    let has_rubberbanded_grabs = true;
    let has_intersections = false;
    let original_grab_count = 0;
    let height = 0;
    let width = 0;
    let left = 0;
    let top = 0;

    $: if ($w_dragging === T_Drag.rubberband) {
        document.body.classList.add('rubberband-blocking');     // see style:global block below
    } else {
        document.body.classList.remove('rubberband-blocking');
    }

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_dragging === T_Drag.rubberband) {
            if (!!$w_s_title_edit) {
                $w_s_title_edit.stop_editing();
                $w_s_title_edit = null;
            } else if (!has_rubberbanded_grabs) {
                x.si_grabs.reset();
            }
            startPoint = null;
            height = 0;
            width = 0;
            $w_dragging = T_Drag.none;
        }
    }

    $: if ($w_dragging === T_Drag.graph) {
        const delta = $w_scaled_movement;
        const userOffset = $w_user_graph_offset;
        if (!!userOffset && !!delta && delta.magnitude > 1) {
            debug.log_action(` command drag GRAPH`);
            g.set_user_graph_offsetTo(userOffset.offsetBy(delta));
        }
    }

    $: style = `
        top: ${top}px;
        left: ${left}px;
        width: ${width}px;
        height: ${height}px;
        z-index: ${T_Layer.rubberband};
        border-width: ${strokeWidth}px;
        border-color: ${$w_separator_color};
        display: ${$w_dragging === T_Drag.rubberband ? 'block' : 'none'};`
    ;

    $: if ($w_dragging !== T_Drag.none && startPoint && $w_mouse_location) {
        const constrainedEnd = constrainToRect($w_mouse_location.x, $w_mouse_location.y);
        height = Math.abs(constrainedEnd.y - startPoint.y);
        width = Math.abs(constrainedEnd.x - startPoint.x);
        left = Math.min(constrainedEnd.x, startPoint.x);
        top = Math.min(constrainedEnd.y, startPoint.y);
        detect_and_grab();
    }

    function detect_and_grab() {
        if ($w_dragging === T_Drag.rubberband) {
            const ancestries = ancestries_intersecting_rubberband();
            if (ancestries.length != 0) {
                x.si_grabs.items = ancestries;
                debug.log_hits(`${ancestries.map(ancestry => ancestry.relationship?.id ?? k.root).join(', ')}`);
            } else {
                x.si_grabs.reset();
            }
            x.update_ancestry_forDetails();
        }
    }

    function ancestries_intersecting_rubberband(): Array<Ancestry> {
        const rect = new Rect( new Point(left, top), new Size(width, height));
        const found = hits.targets_inRect(rect).filter(hit => hit.type === T_Hit_Target.widget);
        return found.map((hit) => hit.identifiable as Ancestry);
    }

    // Add event handlers at document level
    onMount(() => {
        document.addEventListener('pointerenter', blockEvent, true);
        document.addEventListener('pointerleave', blockEvent, true);
        document.addEventListener('pointermove', blockEvent, true);
        document.addEventListener('pointerdown', blockEvent, true);
        document.addEventListener('pointerup', blockEvent, true);
    });

    onDestroy(() => {
        document.removeEventListener('pointerenter', blockEvent, true);
        document.removeEventListener('pointerleave', blockEvent, true);
        document.removeEventListener('pointermove', blockEvent, true);
        document.removeEventListener('pointerdown', blockEvent, true);
        document.removeEventListener('pointerup', blockEvent, true);
    });

    function constrainToRect(x: number, y: number): Point {
        return new Point(
            Math.max(bounds.origin.x, Math.min(bounds.origin.x + bounds.size.width, x)),
            Math.max(bounds.origin.y, Math.min(bounds.origin.y + bounds.size.height, y))
        );
    }

    function blockEvent(e: Event) {
        const target = e.target;
        // Only block events when rubberband is active and target is not an interactive element
        if ($w_dragging === T_Drag.rubberband && target instanceof HTMLElement) {
            if (!target.closest('.panel') && 
                !target.closest('.rubberband') && 
                !target.closest('.draggable') && 
                !target.closest('.tree-preferences')) {
                u.consume_event(e);
            }
        }
    }

    export function handleMouseDown(e: MouseEvent): void {
        startPoint = new Point(e.clientX, e.clientY);
        if (e.metaKey) {
            $w_dragging = T_Drag.graph;
        } else {
            const constrained = constrainToRect(startPoint.x, startPoint.y);
            original_grab_count = x.si_grabs.items.length;
            top = constrained.y;
            left = constrained.x;
            $w_dragging = T_Drag.rubberband;
        }
    }

</script>

{#if enabled && $w_dragging === T_Drag.rubberband}
    <div class='rubberband' {style}/>
{/if}

<style>
    :global(.rubberband-blocking .button,
            .rubberband-blocking .controls, 
            .rubberband-blocking .segmented, 
            .rubberband-blocking .details-stack,
            .rubberband-blocking .bottom-controls,
            .rubberband-blocking .mouse-responder) {
        pointer-events: none !important;
    }

    .rubberband {
        position: fixed;
        border-style: dashed;
        pointer-events: none;
        box-sizing: border-box;
        background-color: rgba(0, 0, 0, 0.05);
    }
</style>