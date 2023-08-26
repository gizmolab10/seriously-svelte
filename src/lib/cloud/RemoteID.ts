export default class RemoteID {
  isRemotelyStored: boolean;
  id: string;

  constructor(id: string, isRemotelyStored: boolean) {
    this.isRemotelyStored = isRemotelyStored;
    this.id = id;
  }
}
