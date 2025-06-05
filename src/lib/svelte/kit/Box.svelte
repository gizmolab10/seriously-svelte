<script lang='ts'>
	import { k, Point, colors } from '../../ts/common/Global_Imports';
	import Separator from './Separator.svelte';
    export let corner_radius: number = k.radius.gull_wings.thick;
    export let thickness: number = k.thickness.separator.thick;
    export let color: string = colors.separator;
    export let showBottom: boolean = true;
    export let showRight: boolean = true;
    export let showLeft: boolean = true;
    export let showTop: boolean = true;
    export let name: string = k.empty;
    export let height: number = 0;
    export let width: number = 0;
    export let left: number = 0;
    export let top: number = 0;
</script>

<div class='box {name}'
    style='
        top: {top}px;
        display: flex;
        left: {left}px;
        width: {width}px;
        height: {height}px;
        position: absolute;
        box-sizing: border-box;
        flex-direction: column;'>
    <div style='
        flex: 1;
        display: flex;'>
        {#if showLeft}
            <Separator 
                class='left'
                color={color}
                length={height + 2}
                isHorizontal={false}
                thickness={thickness}
                origin={new Point(2, 2)}
				has_thin_divider={false}
                corner_radius={corner_radius}/>
        {/if}        
        <div style='flex: 1;'>
            <slot />
        </div>
        {#if showRight}
            <Separator
                color={color}
                class='right'
                length={height + 2}
                isHorizontal={false}
                thickness={thickness}
				has_thin_divider={false}
                origin={new Point(width - 2, 2)}
                corner_radius={corner_radius}/>
        {/if}
    </div>
    {#if showTop}
        <Separator 
            class='top'
            color={color}
            length={width}
			add_wings={false}
            isHorizontal={true} 
            origin={Point.zero}
            thickness={thickness}
			has_thin_divider={false}
            corner_radius={corner_radius}/>
    {/if}
    {#if showBottom}
        <Separator
            color={color}
            class='bottom'
            length={width}
			add_wings={false}
            isHorizontal={true}
            thickness={thickness}
			has_thin_divider={false}
            corner_radius={corner_radius}
            origin={Point.y(height - thickness)}/>
    {/if}
</div>
