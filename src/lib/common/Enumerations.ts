export enum ButtonID {
  releaseNotes = 'show release notes',
  help         = '?',
}

export enum DBType {
  firebase = 'firebase',
  airtable = 'airtable',
}

export enum BulkID {
  public = 'Public',
  mine   = 'Jonathan Sand',
}

export enum LocalID {
  details = 'details',
  bulk    = 'bulk',
  db      = 'db',
}

export enum DataKind {
  users         = 'Users',
  access        = 'Access',
  things        = 'Things',
  predicates    = 'Predicates',
  relationships = 'Relationships',
}

export enum CreationFlag {
  none         = '',
  getRemoteID  = 'get',
  isFromRemote = 'isFrom'
}