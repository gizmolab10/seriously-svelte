<script lang='ts'>
    import { w_tag_things, w_thing_tags, w_tag_thing_index } from '../../ts/common/Stores';
    import { k, grabs, T_Request, S_Mouse, Point } from '../../ts/common/Global_Imports';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Separator from '../kit/Separator.svelte';

    enum E_NextPrevious {
        tag = 'tag',
        thing = 'thing'
    }

	function handleClick_onNextPrevious(kind: E_NextPrevious, t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = ['previous', 'next'];
		switch (t_request) {
            case T_Request.name:	   return ids[column];
			case T_Request.is_visible: return true;
			case T_Request.handle_click:
                const next = column == 1;
                if (s_mouse.isDown) {
                    switch (kind) {
                        case E_NextPrevious.tag:   s_details.select_nextTag(next);   break;
                        case E_NextPrevious.thing: s_details.select_nextThing(next); break;
                    }
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
            text-align: center;'>
        {#if !$w_thing_tags || $w_thing_tags.length == 0}
            <p style='text-align: center;'>no tags</p>
        {:else}
            <Next_Previous
                width={106}
                show_box={true}
                has_title={true}
                add_wings={false}
                origin={new Point(7, 2)}
                name={E_NextPrevious.thing}
                closure={(t_request, s_mouse, column) => handleClick_onNextPrevious(E_NextPrevious.thing, t_request, s_mouse, column)}/>
            <Next_Previous
                width={106}
                show_box={true}
                has_title={true}
                name={E_NextPrevious.tag}
                origin={new Point(k.width_details - 107, 2)}
                closure={(t_request, s_mouse, column) => handleClick_onNextPrevious(E_NextPrevious.tag, t_request, s_mouse, column)}/>
			<Separator
				top={5}
                left={110}
				height={30}
				add_wings={true}
                isHorizontal={false}
				margin={k.details_margin}
				thickness={k.thickness.thin}/>
            <div
                class='tags-list'
                style='
                    top:36px;
                    margin: 0;
                    display: flex;
                    padding: 0 10px;
                    position:relative;
                    width:{k.width_details - 20}px;
                    justify-content: space-between;
                    font-size:{k.font_size.smallest}px;'>
                <span style='text-align: left;'>
                    {$w_tag_thing_index + 1} (of {$w_tag_things.length})
                </span>
                <span style='text-align: right;'>
                    {$w_thing_tags.map(t => t.type).join(', ')}
                </span>
            </div>
        {/if}
    </div>
{/key}
