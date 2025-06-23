<script lang='ts'>
	import { k, Rect, Point, colors, T_Layer, svgPaths } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from './SVG_Gradient.svelte';
	import Separator from './Separator.svelte';
    export let corner_radius: number = k.radius.gull_wings.thick;
    export let thickness: number = k.thickness.separator.thick;
    export let color: string = colors.separator;
    export let showBottom: boolean = true;
    export let showRight: boolean = true;
	export let zindex = T_Layer.details;
    export let showLeft: boolean = true;
    export let showTop: boolean = true;
    export let name: string = k.empty;
    export let height: number = 0;
    export let width: number = 0;
    export let left: number = 0;
    export let top: number = 0;
    const box_rect = Rect.createWHRect(width, height);
    let banner_color = colors.ofBannerFor($w_background_color);

    $: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);

    </script>

<div class='box-{name}'
    style='
        top: {top}px;
        display: flex;
        left: {left}px;
        width: {width}px;
        z-index: {zindex};
        height: {height}px;
        position: absolute;
        box-sizing: border-box;
        flex-direction: column;'>
    <div class='box-central-{name}' style='
        flex: 1;
        display: flex;'>
        {#if showLeft}
            <Separator
                name='left-{name}'
                length={height + 2}
                isHorizontal={false}
                thickness={thickness}
                origin={new Point(2, 2)}
				has_thin_divider={false}
                corner_radius={corner_radius}/>
        {/if}
        <SVG_Gradient
            isInverted={true}
            color={banner_color}
            size={box_rect.size}
            name={`gradient-${name}`}
            zindex={T_Layer.frontmost}
            path={svgPaths.rectangle(box_rect)}/>
        <div class='box-content-{name}' style='flex: 1;'>
            <slot />
        </div>
        {#if showRight}
            <Separator
                length={height + 2}
                name='right-{name}'
                isHorizontal={false}
                thickness={thickness}
				has_thin_divider={false}
                corner_radius={corner_radius}
                origin={new Point(width - 1.5, 2)}/>
        {/if}
    </div>
    {#if showTop}
        <Separator 
            length={width}
            name='top-{name}'
			add_wings={false}
            origin={Point.zero}
            isHorizontal={true}
            thickness={thickness}
			has_thin_divider={false}
            corner_radius={corner_radius}/>
    {/if}
    {#if showBottom}
        <Separator
            length={width}
			add_wings={false}
            isHorizontal={true}
            name='bottom-{name}'
            thickness={thickness}
			has_thin_divider={false}
            corner_radius={corner_radius}
            origin={Point.y(height - thickness)}/>
    {/if}
</div>
