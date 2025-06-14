<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link
			rel="stylesheet"
			href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css"
		/>
		<link
			rel="icon"
			type="image/png"
			sizes="32x32"
			href="/src/favicon/favicon-32x32.png"
		/>
		<link
			rel="icon"
			type="image/png"
			sizes="16x16"
			href="/src/favicon/favicon-16x16.png"
		/>
		<meta name="viewport" content="width=900" />
		<meta
			name="description"
			content="EmailBuilder.js interactive playground. Brought to you by Waypoint."
		/>
		<title>EmailBuilder.js &mdash; Free and Open Source Template Builder</title>
		<style>
			html {
				margin: 0px;
				height: 100vh;
				width: 100%;
			}
			body {
				min-height: 100vh;
				width: 100%;
			}
			#root {
				height: 100vh;
				width: 100%;
			}
		</style>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
useEffect(() => {
		const jsonAndHtmlCode = { htmlCode, jsonCode }
		const jsonAndHtmlCodeStringified = JSON.stringify(jsonAndHtmlCode)
		const targetOrigin = '*'
		window.parent.postMessage(jsonAndHtmlCodeStringified, targetOrigin)
	}, [document])