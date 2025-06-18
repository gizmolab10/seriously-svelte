<script lang='ts'>
    import { k, u, Rect, Size, Point, colors, svgPaths, T_Layer, T_Detail } from '../../ts/common/Global_Imports';
    import { w_background_color, w_show_details_ofType, w_count_resize_hideables } from '../../ts/common/Stores';
    import { createEventDispatcher, tick, setContext } from 'svelte';
    import { s_details } from '../../ts/state/S_Details';
    import Glows_Banner from './Glows_Banner.svelte';
    import { tick } from 'svelte';
    export let extra_titles: string[] = [];    // extra titles added into banner
    export let t_detail: T_Detail;
    const title = T_Detail[t_detail];
    const titles = [title, ...extra_titles];
    const dispatch = createEventDispatcher();
    const banner_height = k.height.banner.details;
    const s_hideable = s_details.s_hideables_byType[t_detail];
    const banner_rect = new Rect(Point.zero, new Size(k.width_details, banner_height));
    let banner_color = colors.ofBannerFor($w_background_color);
	let slot_isVisible = compute_slot_isVisible();
    let element: HTMLElement;
    let prior_height = 22;
    let height = 22;

    $: dispatch('heightChange', { height });
    $: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);
    
    $: (async () => {
        if (!!element && s_hideable.hasBanner) {
            await tick();
            height = slot_isVisible ? element.scrollHeight - 1 : s_hideable.hasBanner ? banner_height : 0;
        }
    })();

	function compute_slot_isVisible() {
        if (s_hideable.hasBanner) {
            const type = T_Detail[s_hideable.t_detail];
            return $w_show_details_ofType?.includes(type) ?? false;
        }
        return true;
    }

	function toggle_hidden(t_detail: string) {
		let t_details = $w_show_details_ofType;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_show_details_ofType = t_details;
		slot_isVisible = compute_slot_isVisible();
        height = slot_isVisible ? element.scrollHeight - 1 : s_hideable.hasBanner ? banner_height : 0;
	}

</script>

<div
    class='hideable'
    bind:this={element}
    style='
        top: 0px;
        display: flex;
        flex-shrink: 0;
        height: {height}px;
        position: relative;
        flex-direction: column;
        width: {k.width_details - 12}px;'>
    {#if s_hideable.hasBanner}
        <div
            class='banner'
            style='
                top: 0px;
                width: 100%;
                display: flex;
                cursor: pointer;
                position: absolute;
                align-items: stretch;
                height: {banner_height}px;'>
            <Glows_Banner
                titles={titles}
                height={banner_height}
                width={k.width_details}
                toggle_hidden={toggle_hidden}/>
        </div>
    {/if}
    {#if slot_isVisible}
        <div class={'hideable-content-' + title}
            style='
                height: {height}px;
                position: relative;
                padding-bottom: 9px;
                top: {s_hideable.hasBanner ? banner_height : 0}px;'>
            <slot/>
        </div>
    {/if}
</div>