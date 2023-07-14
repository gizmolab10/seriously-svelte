import { Entity, signal, SignalKinds } from '../common/Imports';

export default class Relatives {
  children: [Entity];
  parent: Entity;

  constructor(parent: Entity, children: [Entity]) {
    this.children = children;
    this.parent = parent;
  }
}