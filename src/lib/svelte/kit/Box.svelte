<script>
    import { Rect, Datum } from '../../ts/common/GlobalImports'
    export let half = false;
    export let color;
    export let rect;
</script>

<div
    style='
        top: {rect.origin.y}px;
        left: {rect.origin.x}px;
        width: {rect.size.width}px;
        height: {rect.size.height}px;
        border: 1px dashed {color};
'>
</div>
{#if half}
    <div
        style='
            top: {rect.center.y}px;
            left: {rect.origin.x}px;
            width: {rect.size.width}px;
            height: 0.1px;
            background-color: {color};
    '>
    </div>
{/if}
<style>
    div {
        position: absolute;
        backgroundColor: transparent;
    }
</style>
