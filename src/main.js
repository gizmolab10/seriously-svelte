import './styles/app.css';
import SeriouslyApp from "./SeriouslyApp.svelte";

const app = new SeriouslyApp({
		target: document.getElementById('app')
})

export default SeriouslyApp;
