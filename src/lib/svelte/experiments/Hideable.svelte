<script lang='ts'>
    import { k, u, Rect, Size, Point, colors, svgPaths, T_Layer, T_Details } from '../../ts/common/Global_Imports';
    import { w_background_color, w_show_details_ofType, w_count_resize_hideables } from '../../ts/common/Stores';
    import { s_details } from '../../ts/state/S_Details';
    import Glows_Banner from './Glows_Banner.svelte';
    import { tick } from 'svelte';
    export let extra_titles: string[] = [];
    export let t_detail: T_Details;
    const title = T_Details[t_detail];
    const titles = [title, ...extra_titles];
    const glows_banner_height = k.height.banner.details;
    const s_hideable = s_details.s_hideables_byType[t_detail];
    const banner_rect = new Rect(Point.zero, new Size(k.width_details, glows_banner_height));
    let banner_color = colors.ofBannerFor($w_background_color);
    let entire: HTMLElement;
    let slot: HTMLElement;
    let slot_height = 0;
    let height = 22;

    $: slot_isVisible = compute_slot_isVisible();
    $: banner_color = colors.ofBannerFor($w_background_color);
    
    $: (async () => {
        if (!!entire && !!s_hideable) {
            await tick();
            slot_height = slot?.scrollHeight ?? 0;
            height = slot_isVisible ? entire.scrollHeight - 1 : s_hideable.hasBanner ? glows_banner_height : 0;
        }
    })();

	function compute_slot_isVisible() {
        if (!!s_hideable && s_hideable.hasBanner) {
            const type = T_Details[s_hideable.t_detail];
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
        height = slot_isVisible ? entire.scrollHeight - 1 : (!!s_hideable && s_hideable.hasBanner) ? glows_banner_height : 0;
	}

</script>

<div
    class='hideable'
    bind:this={entire}
    style='
        top: 0px;
        display: flex;
        flex-shrink: 0;
        height: {height}px;
        position: relative;
        flex-direction: column;
        width: {k.width_details - 12}px;'>
    {#if !!s_hideable && s_hideable.hasBanner}
        <div
            class='banner'
            style='
                top: 0px;
                width: 100%;
                display: flex;
                cursor: pointer;
                position: relative;
                align-items: stretch;
                height: {glows_banner_height}px;'>
            <Glows_Banner
                titles={titles}
                height={glows_banner_height}
                width={k.width_details}
                toggle_hidden={toggle_hidden}/>
        </div>
    {/if}
    {#if slot_isVisible}
        <div
            bind:this={slot}
            class={'hideable-slot-' + title}
            style='
                height: 22px;
                position: relative;
                top: {(!!s_hideable && s_hideable.hasBanner) ? glows_banner_height : 0}px;'>
            <slot/>
        </div>
    {/if}
</div>