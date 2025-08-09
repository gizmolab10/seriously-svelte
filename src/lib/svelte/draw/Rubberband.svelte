<script lang='ts'>
    import { h, Rect, Size, Point, colors, wrappers } from '../../ts/common/Global_Imports';
    import { w_rubberband_active, w_ancestries_grabbed } from '../../ts/common/Stores';
    import { T_Layer, T_SvelteComponent } from '../../ts/common/Global_Imports';
    import { w_mouse_location, w_count_mouse_up } from '../../ts/common/Stores';
    import { onMount, onDestroy } from 'svelte';
    export let color: string = colors.rubberband;
    export let strokeWidth = 1;
    export let bounds: Rect;
    let mouse_upCount = $w_count_mouse_up;
    let startPoint: Point | null = null;
    let height = 0;
    let width = 0;
    let left = 0;
    let top = 0;

    $w_rubberband_active = false;

    $: if ($w_rubberband_active) {
        document.body.classList.add('rubberband-blocking');     // see style:global block below
    } else {
        document.body.classList.remove('rubberband-blocking');
    }

    $: if ($w_rubberband_active && startPoint && $w_mouse_location) {
        const constrainedEnd = constrainToRect($w_mouse_location.x, $w_mouse_location.y);
        height = Math.abs(constrainedEnd.y - startPoint.y);
        width = Math.abs(constrainedEnd.x - startPoint.x);
        left = Math.min(constrainedEnd.x, startPoint.x);
        top = Math.min(constrainedEnd.y, startPoint.y);
        checkIntersections();
    }

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_rubberband_active) {
            $w_rubberband_active = false;
            startPoint = null;
            height = 0;
            width = 0;
        }
    }

    $: style = `
        top: ${top}px;
        left: ${left}px;
        width: ${width}px;
        height: ${height}px;
        z-index: ${T_Layer.rubberband};
        border-width: ${strokeWidth}px;
        border-color: ${colors.separator};
        display: ${$w_rubberband_active ? 'block' : 'none'};`
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

    export function handleMouseDown(e: MouseEvent): void {
        startPoint = new Point(e.clientX, e.clientY);
        const constrained = constrainToRect(startPoint.x, startPoint.y);
        top = constrained.y;
        left = constrained.x;
        $w_rubberband_active = true;
    }

    function blockEvent(e: Event) {
        const target = e.target;
        // Block all mouse events except for panel, rubberband and draggable
        if ($w_rubberband_active && target instanceof HTMLElement) {
            if (!target.closest('.panel') && !target.closest('.rubberband') && !target.closest('.draggable')) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }

    function checkIntersections() {
        if (!$w_rubberband_active || width == 0 || height == 0) {
            $w_ancestries_grabbed = [];
        } else {
            const rubberbandRect = new Rect( new Point(left, top), new Size(width, height));
            const widget_wrappers = wrappers.wrappers_ofType_withinRect(T_SvelteComponent.widget, rubberbandRect);
            const intersecting = [];
            widget_wrappers.forEach((wrapper) => {
                const ancestry = h.ancestry_forHID(wrapper.hid);
                if (!!ancestry) {
                    intersecting.push(ancestry);
                }
            });
            // Only update if the list has changed
            const newIds = intersecting.map(a => a.hid).sort().join(',');
            const currentIds = $w_ancestries_grabbed.map(a => a.hid).sort().join(',');
            if (currentIds !== newIds) {
                $w_ancestries_grabbed = intersecting;
            }
        }
    }

</script>

{#if $w_rubberband_active}
    <div class='rubberband' {style}/>
{/if}

<style>
    :global(.rubberband-blocking .controls, .rubberband-blocking .bottom-controls) {
        pointer-events: none !important;
    }

    .rubberband {
        position: fixed;
        pointer-events: none;
        border-style: dashed;
        cursor: crosshair !important;
        background-color: rgba(0, 0, 0, 0.05);
    }
</style>