import { removeAll } from '../common/Utilities';
import { v4 as uuid } from 'uuid';
export default class CloudStub {
  hasCloud = false;
  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
}
export const cloud = new CloudStub();
