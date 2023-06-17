<svelte:options immutable={true} />

<script>
	import Button from './Button.svelte';
	import { createEventDispatcher, afterUpdate } from 'svelte';
	import FaRegTrashAlt from 'svelte-icons/fa/FaRegTrashAlt.svelte';

	export let todos = [];
	export function clearInputAndRefocus() {
		inputText = '';

		focusInput();
	}
	export function focusInput() {
		input.focus();
	}

	let priorTodos = todos;
	let inputText = '';
	let input, listDiv, shouldScroll, listHeight;
	const dispatch = createEventDispatcher();

	$: {
		shouldScroll = todos.length > priorTodos.length;
		priorTodos = todos;
	}

	afterUpdate(() => {
		if (shouldScroll && listDiv) {
			shouldScroll = false;
			listDiv.scrollTo(0, listHeight);
		}
	});
	function handleAddTodo() {
		dispatch('addTodo', {
			title: inputText
		});
	}
	function handleRemoveTodo(id) {
		dispatch('removeTodo', {
			id
		});
	}
	function handleToggleTodo(id, value) {
		dispatch('toggleTodo', {
			id,
			value
		});
	}
</script>

<div class="todo-list-wrapper">
	<div class="todo-list" bind:this={listDiv}>
		<div bind:offsetHeight={listHeight}>
			{#if todos.length === 0}
				<p class="no-todos">No items yet</p>
			{:else}
				<ul>
					{#each todos as { id, title, completed } (id)}
						<li>
							<label>
								<input
									on:input={(event) => {
										event.currentTarget.checked = completed;
										handleToggleTodo(id, !completed);
									}}
									type="checkbox"
									checked={completed}
								/>
								{title}
								<button 
									class="remove-todo-button" 
									aria-label="Remove {title}"
									on:click={() => handleRemoveTodo(id)}>
									<span style:width="10px" style:display="inline-block">
										<FaRegTrashAlt />
									</span>
								</button>
							</label>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
	<form class="add-todo-form" on:submit|preventDefault={handleAddTodo}>
		<input bind:this={input} bind:value={inputText} placeholder="Enter a new task here" />
		<Button>Add</Button>
	</form>
</div>

<style lang="scss">
	.todo-list-wrapper {
		background-color: #424242;
		border: 5px solid #000000;
		border-radius: 15px;
		padding: 5px;
		.no-todos {
			margin: 0;
			padding: 15px;
			text-align: center;
		}
		.todo-list {
			max-height: 200px;
			overflow: auto;
			ul {
				margin: 0;
				padding: 10px;
				list-style: none;
				li {
					margin-bottom: 5px;
					display: flex;
					align-items: center;
					background-color: #303030;
					border-radius: 5px;
					padding: 10px;
					position: relative;
					label {
						cursor: pointer;
						font-size: 18px;
						display: flex;
						align-items: baseline;
						padding-right: 20px;
						input [type=checkbox] {
							cursor: pointer;
						}
					}
					// &.completed > label {
					// 	opacity: 0.5;
					// 	text-decoration: line-through;
					// }
					.remove-todo-button {
						background: none;
						padding: 8px;
						position: absolute;
						right: 10px;
						top: 5px;
						cursor: pointer;
						border: 1px solid #d03030;
						border-radius: 5px;
						:global(svg) {
							fill: #ff3c3c;
						}
					}
				}
			}
		}
		.add-todo-form {
			padding: 15px;
			// background-color: #303030;
			display: flex;
			border-top: 5px solid #000000;
		}
	}
</style>
