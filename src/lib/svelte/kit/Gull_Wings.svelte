<script lang="ts">
    import { k, Point, Angle, E_Layer, Direction, svgPaths } from '../../ts/common/Global_Imports';
    export let thickness = k.thickness.separator;
    export let radius = k.radius.gull_wings;
    export let direction = Direction.down;
    export let zindex = E_Layer.lines;
    export let center = Point.zero;
    export let color = 'black';
    const diameter = radius * 2;
    let leftArcPath: string = k.empty;
    let rightArcPath: string = k.empty;

    $: {
        const origin = Point.zero;
        const baseAngle = direction + Angle.half;
        const leftEndAngle = baseAngle + Angle.quarter;
        const rightEndAngle = baseAngle - Angle.quarter;
        leftArcPath = svgPaths.arc(origin, radius, 0, leftEndAngle, baseAngle);
        rightArcPath = svgPaths.arc(origin, radius, 0, baseAngle, rightEndAngle);
    }

</script>

<svg
    style='
        z-index: {zindex};
        position: absolute;
        pointer-events: none;
        top: {center.y - radius}px;
        left: {center.x - radius}px;'
    class='gull-wings'
    width={diameter}
    height={diameter}
    viewBox={`${-radius} ${-radius} ${diameter} ${diameter}`}> 
    <path 
        stroke={color}
        d={leftArcPath}
        fill='transparent'
        stroke-width={thickness}/>
    <path 
        stroke={color}
        d={rightArcPath}
        fill='transparent'
        stroke-width={thickness} />
</svg>
