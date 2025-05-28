<script lang='ts'>
    import { w_tag_things, w_thing_tags, w_thing_traits, w_tag_thing_index } from '../../ts/common/Stores';
    import { k, T_Request, S_Mouse, Point } from '../../ts/common/Global_Imports';
    import { w_hierarchy, w_ancestries_grabbed } from '../../ts/common/Stores';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
    const ancestry = s_details.ancestry;

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

    enum E_NextPrevious {
        tag = 'tag',
        thing = 'thing'
    }

</script>

<div
    class='tags'
    style='
        width: 100%;
        position:relative;
        text-align: center;'>
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
		closure={(t_request, s_mouse, column) => handleClick_onNextPrevious(E_NextPrevious.tag, t_request, s_mouse, column)   }/>
    <div
        class='tags-list'
        style='
            top:33px;
            display: flex;
            padding: 0 10px;
            position:relative;
            width:{k.width_details - 20}px;
            justify-content: space-between;
            font-size:{k.font_size.smallest}px;'>
        {#if !$w_thing_tags || $w_thing_tags.length == 0}
            <span style='text-align: center;'>
                no tags
            </span>
        {:else}
            <span style='text-align: left;'>
                thing {$w_tag_thing_index + 1} (of {$w_tag_things.length})
            </span>
            <span style='text-align: right;'>
                {$w_thing_tags.map(t => t.type).join(', ')}
            </span>
        {/if}
    </div>
</div>
