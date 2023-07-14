<script>
	import TodoList from './lib/practice/TodoList.svelte';
	import { v4 as uuid } from 'uuid';

	let todoList;
	let todos = [
		{
			id: uuid(),
			title: 'Write a todo',
			completed: true
		},
		{
			id: uuid(),
			title: 'Write another todo',
			completed: false
		},
		{
			id: uuid(),
			title: 'And...',
			completed: true
		},
		{
			id: uuid(),
			title: 'A long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long, long task',
			completed: true
		}
	];
	function handleAddEvent(event) {
		const title = event.detail.title
		if (title) {
			todos = [
				...todos,
				{
					id: uuid(),
					title: event.detail.title,
					completed: false
				}
			]
			todoList.clearInputAndRefocus();
		} else {
			todoList.focusInput();
		}
	};
	function handleRemoveEvent(event) {
		todos = todos.filter(t => t.id !== event.detail.id)

		todoList.focusInput();
	};
	function handleToggleEvent(event) {
		todos = todos.map (todo => {
			todoList.focusInput();
			if  (todo.id === event.detail.id) {
				return {...todo, completed: event.detail.value}
			}
			return { ...todo }
		})
	}
</script>
<div style="max-width: 400px;">
	<TodoList
		{todos}
		bind:this={todoList}
		on:addTodo={handleAddEvent}
		on:removeTodo={handleRemoveEvent}
		on:toggleTodo={handleToggleEvent}
	/>
</div>

<style>
	div {
		color: white;
	}
</style>