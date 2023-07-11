import { Entity, entities, grabbing } from "../common/imports";

export default class TreeBrowser {

  moveGrabUp(up: boolean) {
    console.log(up);
  }

}

export const treeBrowser = new TreeBrowser();
