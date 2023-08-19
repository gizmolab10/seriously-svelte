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

export enum PersistenceIDs {
  details = 'details',
  bulk    = 'bulk',
  db      = 'db',
}

export enum DataKinds {
  things        = 'Things',
  predicates    = 'Predicates',
  relationships = 'Relationships',
}

export enum Needs {
  create = 1,
  delete = 2,
  save   = 4,
}
