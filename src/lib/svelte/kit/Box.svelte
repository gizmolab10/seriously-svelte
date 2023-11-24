<script>
    import { Rect, Datum } from '../../ts/common/GlobalImports'
    export let color;
    export let rect;
</script>

<div
    style='
        top: {rect.origin.y}px;
        left: {rect.origin.x}px;
        width: {rect.size.width}px;
        height: {rect.size.height}px;
        border: 20px solid {color};'>
</div>

<style>
    div {
        position: absolute;
        backgroundColor: transparent;
    }
</style>
