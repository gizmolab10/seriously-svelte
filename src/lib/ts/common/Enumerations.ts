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

export enum PersistID {
  details = 'details',
  debug   = 'debug',
  bulk    = 'bulk',
  here    = 'here',
  grab    = 'grab',
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

export enum LineCurveType {
  up,
  down,
  flat,
}
