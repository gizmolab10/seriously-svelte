<script lang='ts'>
    import { k, grabs, T_Request, S_Mouse, Point, T_Direction } from '../../ts/common/Global_Imports';
    import { w_thing_tags, w_tag_thing_index } from '../../ts/managers/Stores';
	import { s_details } from '../../ts/state/S_Details';
	import Separator from '../draw/Separator.svelte';
    const padding = 10;
    const width = 100;
</script>

{#if !$w_thing_tags || $w_thing_tags.length == 0}
        <div
            class='tags'
            style='
                width: 100%;
                display: flex;
                position: relative;
                text-align: center;
                align-items: center;
                justify-content: center;
                min-height:{k.height.empty}px;
                font-size:{k.font_size.details}px;'>
                no tags
        </div>
    {:else}
        <div
            class='tags-list'
            style='
                width:100%;
                display: flex;
                padding: 4px 0;
                flex-wrap:wrap;
                text-align: center;
                align-items: center;
                white-space:pre-line;
                word-break:break-word;
                justify-content: center;
                min-height: {k.height.empty}px;
                font-size:{k.font_size.details}px;'>
                {$w_thing_tags.map(t => t.type).join(', ')}
            </div>
        {/if}
