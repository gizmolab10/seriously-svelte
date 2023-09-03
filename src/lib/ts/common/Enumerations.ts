export enum ButtonID {
  buildNotes = 'show build notes',
  help         = '?',
}

export enum DBType {
  firebase = 'firebase',
  airtable = 'airtable',
  local    = 'local',
}

export enum BulkID {
  public = 'Public',
  mine   = 'Jonathan Sand',
}

export enum LocalID {
  details = 'details',
  debug   = 'debug',
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