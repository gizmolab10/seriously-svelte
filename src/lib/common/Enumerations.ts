export enum ButtonIDs {
  releaseNotes = 'show release notes',
  help         = '?',
}

export enum DBTypes {
  firebase = 'firebase',
  airtable = 'airtable',
}

export enum BulkIDs {
  public = 'Public',
  mine   = 'Jonathan Sand',
}

export enum LocalIDs {
  details = 'details',
  bulk    = 'bulk',
  db      = 'db',
}

export enum DataKinds {
  users         = 'Users',
  access        = 'Access',
  things        = 'Things',
  predicates    = 'Predicates',
  relationships = 'Relationships',
}

export enum Needs {
  none     = 0,
  create   = 1,
  delete   = 2,
  update   = 4,
  remember = 8,
}
