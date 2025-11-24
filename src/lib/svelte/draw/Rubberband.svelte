<script lang='ts'>
    import { Rect, Size, Point, T_Layer, T_Dragging, T_Hoverable, colors } from '../../ts/common/Global_Imports';
    import { h, k, s, u, x, debug, layout, elements, components } from '../../ts/common/Global_Imports';
    import { onMount, onDestroy } from 'svelte';
    export let strokeWidth = k.thickness.rubberband;
    export let bounds: Rect;
    const enabled = true;
	const { w_separator_color } = colors;
    const { w_dragging_active, w_count_mouse_up, w_s_title_edit } = s;
    const { w_mouse_location, w_scaled_movement, w_user_graph_offset } = layout;
    let mouse_upCount = $w_count_mouse_up;
    let startPoint: Point | null = null;
    let has_rubberbanded_grabs = true;
    let has_intersections = false;
    let original_grab_count = 0;
    let height = 0;
    let width = 0;
    let left = 0;
    let top = 0;

    $w_dragging_active = T_Dragging.none;

    $: if ($w_dragging_active === T_Dragging.rubberband) {
        document.body.classList.add('rubberband-blocking');     // see style:global block below
    } else {
        document.body.classList.remove('rubberband-blocking');
    }

    $: if ($w_dragging_active !== T_Dragging.none && startPoint && $w_mouse_location) {
        const constrainedEnd = constrainToRect($w_mouse_location.x, $w_mouse_location.y);
        height = Math.abs(constrainedEnd.y - startPoint.y);
        width = Math.abs(constrainedEnd.x - startPoint.x);
        left = Math.min(constrainedEnd.x, startPoint.x);
        top = Math.min(constrainedEnd.y, startPoint.y);
        detect_and_grab();
    }

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_dragging_active === T_Dragging.rubberband) {
            if (!!$w_s_title_edit) {
                $w_s_title_edit.stop_editing();
                $w_s_title_edit = null;
            } else if (!has_rubberbanded_grabs) {
                x.si_grabs.reset();
            }
            startPoint = null;
            height = 0;
            width = 0;
        }
        $w_dragging_active = T_Dragging.none;
    }

    $: if ($w_dragging_active === T_Dragging.command) {
        const delta = $w_scaled_movement;
        const userOffset = $w_user_graph_offset;
        if (!!userOffset && !!delta && delta.magnitude > 1) {
            debug.log_action(` command drag GRAPH`);
            layout.set_user_graph_offsetTo(userOffset.offsetBy(delta));
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
        display: ${$w_dragging_active === T_Dragging.rubberband ? 'block' : 'none'};`
    ;

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
        if ($w_dragging_active === T_Dragging.rubberband && target instanceof HTMLElement) {
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
            $w_dragging_active = T_Dragging.command;
        } else {
            const constrained = constrainToRect(startPoint.x, startPoint.y);
            original_grab_count = x.si_grabs.items.length;
            top = constrained.y;
            left = constrained.x;
            $w_dragging_active = T_Dragging.rubberband;
            has_intersections = false;
        }
    }

    function detect_and_grab() {
        if ($w_dragging_active === T_Dragging.rubberband) {
            const rubberbandRect = new Rect( new Point(left, top), new Size(width, height));
            const widget_components = components.components_ofType_withinRect(T_Hoverable.widget, rubberbandRect);
            const intersecting: Ancestry[] = [];
            widget_components.forEach((component) => {
                const ancestry = component.ancestry;
                if (!!ancestry) {
                    intersecting.push(ancestry);
                }
            });
            // Only update if si_grabs.items have changed
            const new_grabbed_IDs = u.descriptionBy_sorted_HIDs(intersecting);
            const prior_grabbed_IDs = u.descriptionBy_sorted_HIDs(x.si_grabs.items);
            has_rubberbanded_grabs = intersecting.length != 0;
            if (prior_grabbed_IDs !== new_grabbed_IDs) {
                if (has_rubberbanded_grabs) {
                    has_intersections = true;
                    x.si_grabs.items = intersecting;
                } else if (has_intersections) {
                    x.si_grabs.reset();
                }
                x.update_ancestry_forDetails();
            }
        }
    }

</script>

{#if enabled && $w_dragging_active === T_Dragging.rubberband}
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