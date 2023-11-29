<script>
	import { signal, Signals, PersistID, persistLocal } from '../../ts/common/GlobalImports'
	import { line_gap } from "../../ts/managers/State"

	function handleInput(event) {
		signal(Signals.layout);
		persistLocal.writeToKey(PersistID.line_gap, $line_gap);
	}
</script>

<input
  type='range'
  min='15'
  max='30'
  width='60'
  bind:value={$line_gap}
  on:input={handleInput}
/>
Size: {$line_gap}

<style>
  input {
    width: 60px;
    background: green;
  }
</style>
