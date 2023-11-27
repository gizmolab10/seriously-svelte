<script>
	import { signal, Signals, PersistID, persistLocal } from '../../ts/common/GlobalImports'
	import { lineGap } from "../../ts/managers/State"

	function handleInput(event) {
		signal(Signals.childrenOf);
		persistLocal.writeToKey(PersistID.lineGap, $lineGap);
	}
</script>

<input
  type='range'
  min='15'
  max='30'
  width='60'
  bind:value={$lineGap}
  on:input={handleInput}
/>
Row gap: {$lineGap}

<style>
  input {
    width: 60px;
    background: green;
  }
</style>
