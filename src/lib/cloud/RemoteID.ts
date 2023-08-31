export default class RemoteID {
  isRemotelyStored: boolean;
  lastWriteDate = new Date();
  needsWrite = false;
  id: string;

  constructor(id: string, isRemotelyStored: boolean) {
    this.isRemotelyStored = isRemotelyStored;
    this.id = id;
  }

  get wasJustModified(): boolean {
    const now = new Date();
    const duration = now.getTime() - this.lastWriteDate.getTime();
    return duration < 500;
  }
}
