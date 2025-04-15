<script lang="ts">
    export let derivedValue: { value: number; isEven: boolean };
</script>

<div class="component-b" class:even={derivedValue.isEven}>
    <p>Current value: {derivedValue.value}</p>
    <p>Status: {derivedValue.isEven ? 'Even' : 'Odd'}</p>
</div>

<style>
    .component-b {
        padding: 1rem;
        margin: 1rem;
        border: 1px solid #ddd;
        transition: background-color 0.3s ease;
    }

    .even {
        background-color: #e6ffe6;
    }
</style> 