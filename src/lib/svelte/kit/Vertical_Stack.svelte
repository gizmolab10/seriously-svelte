<script lang='ts'>
    import { Point } from '../../ts/common/Global_Imports';
    export let origin = null;
    export let width = 0;
    export let name = '';
    export let gap = 2;
    let style = '';

    $: {
        if (origin) {
            style = `left: ${origin.x}px; top: ${origin.y}px;`;
        }
    }
</script>

<div class='vertical-stack'
    style='
        {style}
        gap: 2px;
        display: flex;
        width: {width}px;
        position: absolute;
        flex-direction: column;'>
    <slot />
</div>
