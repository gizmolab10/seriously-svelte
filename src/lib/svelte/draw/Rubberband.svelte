<script lang='ts'>
    import { h, Rect, Size, Point, colors, wrappers } from '../../ts/common/Global_Imports';
    import { w_rubberband_active, w_ancestries_grabbed } from '../../ts/common/Stores';
    import { T_Layer, T_SvelteComponent } from '../../ts/common/Global_Imports';
    import { w_mouse_location, w_count_mouse_up } from '../../ts/common/Stores';
    export let color: string = colors.rubberband;
    export let strokeWidth = 1;
    export let bounds: Rect;
    let mouse_upCount = $w_count_mouse_up;
    let startPoint: Point | null = null;
    let height = 0;
    let width = 0;
    let left = 0;
    let top = 0;

    function constrainToRect(x: number, y: number): Point {
        return new Point(
            Math.max(bounds.origin.x, Math.min(bounds.origin.x + bounds.size.width, x)),
            Math.max(bounds.origin.y, Math.min(bounds.origin.y + bounds.size.height, y))
        );
    }

    $w_rubberband_active = false;

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_rubberband_active) {
            $w_rubberband_active = false;
            startPoint = null;
            height = 0;
            width = 0;
        }
    }

    function checkIntersections() {
        if (!$w_rubberband_active || width == 0 || height == 0) {
            w_ancestries_grabbed.set([]);
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
            w_ancestries_grabbed.set(intersecting);
        }
    }

    $: if ($w_rubberband_active && startPoint && $w_mouse_location) {
        const constrainedEnd = constrainToRect($w_mouse_location.x, $w_mouse_location.y);
        height = Math.abs(constrainedEnd.y - startPoint.y);
        width = Math.abs(constrainedEnd.x - startPoint.x);
        left = Math.min(constrainedEnd.x, startPoint.x);
        top = Math.min(constrainedEnd.y, startPoint.y);
        checkIntersections();
    }

    $: style = `
        top: ${top}px;
        left: ${left}px;
        width: ${width}px;
        height: ${height}px;
        border-color: ${color};
        z-index: ${T_Layer.frontmost - 1};
        border-width: ${strokeWidth}px;
        display: ${$w_rubberband_active ? 'block' : 'none'};
    `;

    export function handleMouseDown(e: MouseEvent): void {
        startPoint = new Point(e.clientX, e.clientY);
        const constrained = constrainToRect(startPoint.x, startPoint.y);
        top = constrained.y;
        left = constrained.x;
        $w_rubberband_active = true;
    }

</script>

{#if $w_rubberband_active}
    <div class='rubberband' {style}/>
{/if}

<style>
    .rubberband {
        position: fixed;
        pointer-events: none;
        border-style: dashed;
        cursor: crosshair !important;
        background-color: rgba(0, 0, 0, 0.1);
    }

    :global(body:has(.rubberband[style*="display: block"])) {
        user-select: none !important;
        -ms-user-select: none !important;
        -moz-user-select: none !important;
        -webkit-user-select: none !important;
    }
</style>