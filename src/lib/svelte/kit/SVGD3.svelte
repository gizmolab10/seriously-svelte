<script lang='ts'>
    import { run } from 'svelte/legacy';

    import { k, Point, colors, T_Layer } from '../ts/common/Global_Imports';
	import { onMount } from 'svelte';
    import * as d3 from 'd3';
    interface Props {
        stroke?: any;
        zindex?: any;
        position?: string;
        svgPath?: any;
        name?: string;
        fill?: string;
        height?: number;
        width?: number;
        left?: number;
        top?: number;
    }

    let {
        stroke = colors.default,
        zindex = T_Layer.common,
        position = 'absolute',
        svgPath = k.empty,
        name = 'SVGD3',
        fill = 'none',
        height = 10,
        width = 10,
        left = 0,
        top = 0
    }: Props = $props();
    let svg = $state();

    onMount(() => {
        d3.select(svg)
            .append('path')
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1)
            .attr('class', `${name}`)
            .attr('shape-rendering', 'geometricPrecision') // anti-alias;
            .attr('d', svgPath);
    })

    run(() => {
        if (!!fill) {
            d3.select(svg)
                .select('path')
                .attr('fill', fill)
                .attr('stroke', stroke)
                .attr('stroke-width', 1)
                .attr('class', `${name}-path`)
                .attr('shape-rendering', 'geometricPrecision') // anti-alias
                .attr('d', svgPath);
            svg = svg;
        }
    });

</script>

<svg class={name}
    bind:this={svg}
    width={width}px
    height={height}px
    viewBox='{left} {top} {width} {height}'
    style='
        top: 0px;
        left: 0px;
        z-index: {zindex};
        position: {position};
        shape-rendering: geometricPrecision;'/>
