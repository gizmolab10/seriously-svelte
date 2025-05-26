<script lang='ts'>
    import { w_hierarchy, w_thing_tags, w_ancestries_grabbed } from '../../ts/common/Stores';
    import { k, T_Request, S_Mouse, Point } from '../../ts/common/Global_Imports';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
    const ancestry = s_details.ancestry;
    let tags = ancestry.tags;

    $: $w_thing_tags, tags = $w_thing_tags ?? [];

	function handleClick_onNextPrevious(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = ['previous', 'next'];
		switch (t_request) {
			case T_Request.is_visible:   return true;
			case T_Request.name:		 return ids[column];
			case T_Request.handle_click: if (s_mouse.isDown) { s_details.select_nextTag(column == 1); }
		}
		return false;
	}

</script>

<div class='tags' style='text-align: center;'>
	<Next_Previous
		origin={new Point(104, 4)}
		closure={handleClick_onNextPrevious}/>
    <div
        class='tags-list'
        style='
            top:25px;
            width:100%;
            position:absolute;
            text-align: center;
            font-size:{k.font_size.smaller}px;'>
        {#if !!tags && tags.length > 0}
            {tags.map(t => t.type).join(', ')}
        {:else}
            no tags
        {/if}
    </div>
</div>
