import { SignalKinds, entities, grabbing, signal } from "../common/Imports";

export default class TreeBrowser {

  moveGrabUpAndRedraw(up: boolean) {
    if (grabbing.hasGrab) {
      const all = entities.all;
      const grab = grabbing.firstGrabbedEntity;
      if  (grab != undefined) {
        const index = all.indexOf(grab!);
        const newIndex = index.increment(!up, all.length - 1);
        const newGrab = all[newIndex];
        grabbing.grabOnly(newGrab);
        signal([SignalKinds.widget], null);
      }
    }
  }

}

export const treeBrowser = new TreeBrowser();
