export enum WorkState {
  graph = 'g',
  idea  = 'i'
}

export default class States {
  workingState = WorkState.graph;

  constructor() {}
}

export let states = new States()
export function setWorkState(state: WorkState) { states.workingState = state; }
