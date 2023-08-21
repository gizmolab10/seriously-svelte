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
  things        = 'Things',
  predicates    = 'Predicates',
  relationships = 'Relationships',
}

export enum Needs {
  none   = 0,
  remind = 1,
  create = 2,
  delete = 4,
  update = 8,
}
