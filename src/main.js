import SeriouslyApp from "./SeriouslyApp.svelte";
import './styles/app.css';

const app = new SeriouslyApp({
	target: document.getElementById('app')
})

// NOTE: `ALLOW-FROM` is not supported in most browsers.
app.use((req, res, next) => {
	res.setHeader("X-Frame-Options", "ALLOW-FROM https://www.catalist.network");
	next();
});

export default SeriouslyApp;
