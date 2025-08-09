<svelte:options accessors={true} />

<script lang='ts'>
    import { w_mouse_location, w_rubberband_active } from '../../ts/common/Stores';
    import { Point, Rect, T_Layer, colors } from '../../ts/common/Global_Imports';
    export let color: string = colors.rubberband;
    export let strokeWidth = 1;
    export let bounds: Rect;
    const enabled = false;
    let startPoint: Point | null = null;
    let rubberband: HTMLDivElement;
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

    // Initialize rubberband active state to false
    $w_rubberband_active = false;

    // Update rubberband position and size
    $: {
        if ($w_rubberband_active && startPoint && $w_mouse_location) {
            const constrainedEnd = constrainToRect($w_mouse_location.x, $w_mouse_location.y);
            height = Math.abs(constrainedEnd.y - startPoint.y);
            width = Math.abs(constrainedEnd.x - startPoint.x);
            left = Math.min(constrainedEnd.x, startPoint.x);
            top = Math.min(constrainedEnd.y, startPoint.y);
        }
    }

    // Update styles
    $: style = `
        top: ${top}px;
        left: ${left}px;
        width: ${width}px;
        height: ${height}px;
        border-color: ${color};
        border-width: ${strokeWidth}px;
        display: ${$w_rubberband_active ? 'block' : 'none'};
    `;

    // Set z-index based on state
    $: containerStyle = `z-index: ${$w_rubberband_active ? T_Layer.frontmost : T_Layer.common}`;

    // Reset when rubberband becomes inactive
    $: if (!$w_rubberband_active) {
        startPoint = null;
        height = 0;
        width = 0;
    }

    function handleMouseDown(e: MouseEvent): void {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const draggable = target?.closest('.draggable');
        if (!!draggable && draggable.contains(target)) {
            startPoint = new Point(e.clientX, e.clientY);
            const constrained = constrainToRect(startPoint.x, startPoint.y);
            $w_rubberband_active = true;
            left = constrained.x;
            top = constrained.y;
            e.stopPropagation();
            e.preventDefault();
        }
    }

    function handleMouseUp(e: MouseEvent): void {
        if ($w_rubberband_active) {
            $w_rubberband_active = false;
            e.stopPropagation();
            e.preventDefault();
            startPoint = null;
            height = 0;
            width = 0;
        }
    }

</script>

{#key $w_rubberband_active}
    {#if enabled}
        {#if $w_rubberband_active}
            <div
                {style}
                class='rubberband'
                bind:this={rubberband}
                on:mouseup={handleMouseUp}
            />
        {:else}
            <div
                class='detector'
                on:mousedown={handleMouseDown}
                style='z-index: {T_Layer.frontmost};'
            />
        {/if}
    {/if}
{/key}


<style>

    .rubberband {
        position: fixed;
        pointer-events: all;
        border-style: dashed;
        cursor: crosshair !important;
        background-color: rgba(0, 0, 0, 0.1);
    }

    .detector {
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: fixed;
        pointer-events: all;;
    }

    :global(body:has(.rubberband[style*="display: block"])) {
        user-select: none !important;
        -ms-user-select: none !important;
        -moz-user-select: none !important;
        -webkit-user-select: none !important;
    }

</style>