export enum ViewIDs {
  details = 'd',
  help    = '?',
}

export namespace ViewIDs {
  // usage: ViewIDs.details.buttonImageName() ... or ... $viewID.buttonImageName()
  export function buttonImageName(this: ViewIDs): string | null {
    switch (this) {
      case ViewIDs.details: return 'Details';
      case ViewIDs.help:    return null;
    }
  }
}

