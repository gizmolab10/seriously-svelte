<script lang='ts'>
    export let angle = 0; // starting angle in degrees
    export let speed = '1s';
    export let diameter = 48;
    export let strokeWidth = 2;
    export let stroke = 'black';
    export let number_of_dashes = 10;
    const dash_width = Math.PI * (diameter - strokeWidth) / number_of_dashes / 2;
    let circle: SVGCircleElement;

    // Expose this method to parent
    export function getCurrentAngle() {
        const transform = getComputedStyle(circle).transform;
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            let angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
            if (angle < 0) angle += 360;
            return angle;
        }
        return 0;
    }
</script>

<div
    style='
        position:relative;
        width:{diameter}px;
        height:{diameter}px;
        --spinner-speed:{speed};
        --spinner-angle:{angle}deg;'>
    <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        <circle
            cx={diameter/2}
            cy={diameter/2}
            stroke={stroke}
            fill='transparent'
            bind:this={circle}
            class='spinner-circle'
            stroke-width={strokeWidth}
            r={(diameter - strokeWidth) / 2}
            stroke-dasharray='{dash_width} {dash_width}'/>
    </svg>
</div>

<style>
    .spinner-circle {
        transform-origin: center;
        animation: spin var(--spinner-speed) linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(var(--spinner-angle, 0deg)); }
        to { transform: rotate(calc(360deg + var(--spinner-angle, 0deg))); }
    }
</style> 