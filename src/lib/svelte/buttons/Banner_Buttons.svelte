<script lang='ts'>
    import { k, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import G_Repeater from '../../ts/layout/G_Repeater';
    import Separator from '../kit/Separator.svelte';
    import Glow_Button from './Glow_Button.svelte';
    export let titles: string[];
    export let height: number;
    export let width: number;
    const g_repeater = new G_Repeater(titles, height, width, k.font_size.details);
    let banner_color = colors.bannerFor($w_background_color);

    // width is overall width of the banner
    // height is of the banner
    // titles one for each buttons, separated by a vertical separator with wings
    // handle click separatelyfor each one
    // first button is the widest, at the left

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);

</script>

<div
    style='
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;'>
    <Separator
        origin={Point.y(0)}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
    <Glow_Button
        title={titles[0]}
        height={height}
        width={width}/>
    <Separator
        origin={Point.y(height)}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
</div> 