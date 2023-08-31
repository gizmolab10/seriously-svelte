import { build } from '../managers/State';
class Builds {
  notes: { [id: number]: string[] } = {};

  constructor() {
    build.set(32);
    this.notes = {
      10 : ['August 2, 2023', 'refactor Panel into Startup'],
      11 : ['August 8, 2023', 'display build number'],
      12 : ['August 10, 2023', 'relocate things'],
      17 : ['August 12, 2023', 'better help'],
      20 : ['August 13, 2023', 'firebase private databases'],
      21 : ['August 13, 2023', 'select db type'],
      22 : ['August 13, 2023', 'locally persist db type'],
      23 : ['August 14, 2023', 'synchronization works, a goal 8 years long'],
      24 : ['August 15, 2023', 'bulk for private/public, shared predicates'],
      25 : ['August 15, 2023', 'switch between db types'],
      26 : ['August 17, 2023', 'cloud abstraction layer'],
      27 : ['August 20, 2023', 'firebase relationships'],
      28 : ['August 21, 2023', 'synchronize title edits'],
      29 : ['August 22, 2023', 'synchronize relocated things'],
      30 : ['August 26, 2023', 'clean construction of relationships'],
      31 : ['August 30, 2023', 'add child, duplicate and delete'],
      32 : ['August 31, 2023', 'manage order changes in snapshots'],
    }
  }

}

export const builds = new Builds();
