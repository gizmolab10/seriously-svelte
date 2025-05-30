<script lang="ts">
    export let size = 48;
    export let stroke = "black";
    export let strokeWidth = 2;
    export let speed = "1s";
</script>

<div style="position: relative; width: {size}px; height: {size}px;">
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
        <circle
            cx={size/2}
            cy={size/2}
            r={size/2 - strokeWidth}
            fill="none"
            stroke={stroke}
            stroke-width={strokeWidth}
            stroke-dasharray="30 100"
            style="transform-origin: center; animation: spin {speed} linear infinite;"/>
    </svg>
</div>

<style>
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style> 