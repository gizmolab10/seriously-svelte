<script lang='ts'>
	import { k, Point, colors } from '../../ts/common/Global_Imports';
	import Separator from './Separator.svelte';
    export let separatorThickness: number = k.thickness.separator.thick;
    export let corner_radius: number = k.radius.gull_wings.thick;
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
        position: absolute;
        top: {top}px;
        left: {left}px;
        width: {width}px;
        height: {height}px;'>
    {#if showTop}
        <Separator 
            class='top'
            color={color}
            length={width}
			add_wings={false}
            horizontal={true} 
            origin={Point.zero}
			has_thin_divider={false}
            thickness={separatorThickness}
            corner_radius={corner_radius}
        />
    {/if}
    
    <div class='content-wrapper'>
        {#if showLeft}
            <Separator 
                class='left'
                color={color}
                length={height}
                horizontal={false} 
                origin={Point.zero}
				has_thin_divider={false}
                corner_radius={corner_radius}
                thickness={separatorThickness}
            />
        {/if}
        
        <div class='content'>
            <slot />
        </div>
        
        {#if showRight}
            <Separator
                color={color}
                class='right'
                length={height}
                horizontal={false} 
                origin={Point.x(width)}
				has_thin_divider={false}
                corner_radius={corner_radius}
                thickness={separatorThickness}
            />
        {/if}
    </div>

    {#if showBottom}
        <Separator
            color={color}
            class='bottom'
            length={width}
            horizontal={true}
			add_wings={false}
			has_thin_divider={false}
            origin={Point.y(height)}
            corner_radius={corner_radius}
            thickness={separatorThickness}
        />
    {/if}
</div>

<style>
    .box {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }

    .content-wrapper {
        display: flex;
        flex: 1;
        position: relative;
    }

    .content {
        flex: 1;
    }

    .top-separator {
        width: 100%;
    }

    .bottom-separator {
        width: 100%;
    }

    .left-separator {
        height: 100%;
    }

    .right-separator {
        height: 100%;
    }
</style>
