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
    <div
        class='tags'
        style='
            width: 100%;
            padding: 4px;
            height: 46px;
            position: relative;
            text-align: center;
            padding-bottom: 9px;
            font-size:{s_details.font_size}px;'>
        {#if !$w_thing_tags || $w_thing_tags.length == 0}
            <p style='
                margin: 0;
                width: 100%;
                height: 100%;
                display: flex;
                text-align: center;
                align-items: center;
                justify-content: center;'>
                no tags
            </p>
        {:else}
            <div
                class='tags-list'
                style='
                    top:3px;
                    margin: 0;
                    display: flex;
                    position:relative;
                    padding: 0 {padding}px;
                    justify-content: center;
                    width:{k.width_details - 30}px;'>
                {$w_thing_tags.map(t => t.type).join(', ')}
            </div>
            <Next_Previous
                name={name}
                margin={28}
                width={width}
                has_title={true}
                add_wings={false}
                has_seperator={true}
                closure={handleClick_onNextPrevious}
                separator_thickness={k.thickness.separator.ultra_thin}
                origin={new Point((k.width_details - width - padding) / 2, 28)}/>
        {/if}
    </div>
{/key}
