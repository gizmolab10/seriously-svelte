<script lang='ts'>
    import { k, grabs, T_Request, S_Mouse, Point, T_Direction } from '../../ts/common/Global_Imports';
    import { w_tag_things, w_thing_tags, w_tag_thing_index } from '../../ts/common/Stores';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Separator from '../kit/Separator.svelte';
    const padding = 10;
    const width = 100;
    let reattachments = 0;

    $: name = `thing ${$w_tag_thing_index + 1} (of ${$w_tag_things.length})`; reattachments++;

	function handleClick_onNextPrevious(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		switch (t_request) {
            case T_Request.name:	   return T_Direction[column];
			case T_Request.is_visible: return true;
			case T_Request.handle_click:
                if (s_mouse.isDown) {
                    s_details.selectNext_thing(column == 1);
                    name = `thing ${$w_tag_thing_index + 1} (of ${$w_tag_things.length})`;
                    reattachments++;
                }
		}
		return false;
	}

</script>

{#key `${grabs.latest.id} ${name} ${$w_thing_tags} ${reattachments}`}
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
{/key}
