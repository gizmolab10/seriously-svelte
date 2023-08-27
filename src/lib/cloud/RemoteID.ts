export default class RemoteID {
  isRemotelyStored: boolean;
  needsPush = false;
  id: string;

  constructor(id: string, isRemotelyStored: boolean) {
    this.isRemotelyStored = isRemotelyStored;
    this.id = id;
  }
}
