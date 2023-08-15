import { build } from '../managers/State';
class Releases {
  notes: { [id: string]: string } = {};

  constructor() {
    build.set(25);
    this.notes = {
      10 : 'toss seriously folder, pull Startup from Panel',
      11 : 'panel displays build',
      12 : 'fixed relocate issues',
      17 : 'better help',
      20 : 'firebase Public things',
      21 : 'radio buttons',
      22 : 'persist db type',
      23 : 'sync works!!!',
      24 : 'bulk name, fetch predicates',
      25 : 'switching between dbs works',
    }
  }

}

export const releases = new Releases();
