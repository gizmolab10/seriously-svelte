<script>
    import { Rect, Size, Point, onMount } from '../../ts/common/GlobalImports';
    import * as d3 from 'd3';
    export let size = new Size();
    export let stroke = 'black';
    export let fill = 'white';
    export let zIndex = 0;
    export let path = '';
    let svg;

    onMount(() => {
        d3.select(svg)
            .append('path')
            .attr('d', path)
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'geometricPrecision'); // anti-alias
    });
    $: {
        d3.select(svg)
            .select('path')
            .attr('fill', fill)
            .attr('shape-rendering', 'geometricPrecision'); // anti-alias
        svg = svg;
    }

</script>

<svg bind:this={svg}
    width={size.width}
    height={size.height}
    style='z-index: {zIndex};
        position: absolute;
        shape-rendering: geometricPrecision;'/>
