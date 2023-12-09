<script>
    export let half = false;
    export let color;
    export let rect;
</script>

<style>
    div {
        position: fixed;
        backgroundColor: transparent;
    }
</style>

<div class='box'>
<div class='inner'
    style='
        top: {rect.origin.y}px;
        left: {rect.origin.x}px;
        width: {rect.size.width}px;
        height: {rect.size.height}px;
        border: 1px dashed {color};
'>
</div>
{#if half == true}
    <div class='horizontal'
        style='
            top: {rect.center.y}px;
            left: {rect.origin.x}px;
            width: {rect.size.width}px;
            height: 0.1px;
            background-color: {color};
    '>
    </div>
    <div class='vertical'
        style='
            top: {rect.origin.y}px;
            left: {rect.center.x}px;
            height: {rect.size.height}px;
            width: 0.1px;
            background-color: {color};
    '>
    </div>
{/if}
</div>
