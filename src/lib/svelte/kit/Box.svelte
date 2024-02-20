<script>
    import { Rect } from '../../ts/common/GlobalImports'
    export let half = false;
    export let color;
    export let rect;
</script>

<div class='box'
    style='
        position: absolute;
        top: {rect.origin.y}px;
        left: {rect.origin.x}px;
        width: {rect.size.width}px;
        height: {rect.size.height}px;
        border: 1px dashed {color};
'>
</div>
{#if half == true}
    <div
        style='
            position: absolute;
            top: {rect.center.y}px;
            left: {rect.origin.x}px;
            width: {rect.size.width}px;
            height: 0.1px;
            background-color: {color};
    '>
    </div>
    <div
        style='
            position: absolute;
            top: {rect.origin.y}px;
            left: {rect.center.x}px;
            height: {rect.size.height}px;
            width: 0.1px;
            background-color: {color};
    '>
    </div>
{/if}
<style>
    div {
        position: fixed;
        backgroundColor: transparent;
    }
</style>
