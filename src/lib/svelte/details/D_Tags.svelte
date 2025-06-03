<script lang='ts'>
    import { k, grabs, T_Request, S_Mouse, Point, T_Direction } from '../../ts/common/Global_Imports';
    import { w_tag_things, w_thing_tags, w_tag_thing_index } from '../../ts/common/Stores';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Separator from '../kit/Separator.svelte';
    
    $: name = `thing ${$w_tag_thing_index + 1} (of ${$w_tag_things.length})`;

	function handleClick_onNextPrevious(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		switch (t_request) {
            case T_Request.name:	   return T_Direction[column];
			case T_Request.is_visible: return true;
			case T_Request.handle_click:
                const next = column == 1;
                if (s_mouse.isDown) {
                    s_details.select_nextThing(next);
                }
		}
		return false;
	}

</script>

{#key grabs.latest}
    <div
        class='tags'
        style='
            width: 100%;
            position:relative;
            text-align: center;
            font-size:{s_details.font_size}px;'>
        {#if !$w_thing_tags || $w_thing_tags.length == 0}
            <p style='text-align: center;'>no tags</p>
        {:else}
            <div
                class='tags-list'
                style='
                    top:3px;
                    margin: 0;
                    display: flex;
                    padding: 0 10px;
                    position:relative;
                    justify-content: center;
                    width:{k.width_details - 30}px;'>
                {$w_thing_tags.map(t => t.type).join(', ')}
            </div>
            <Next_Previous
                name={name}
                show_box={true}
                has_title={true}
                add_wings={false}
                origin={new Point(53, 22)}
                width={k.width_details - 120}
                closure={handleClick_onNextPrevious}
                separator_thickness={k.thickness.separator.ultra_thin}/>
        {/if}
    </div>
{/key}
