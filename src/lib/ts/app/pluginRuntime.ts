import { startHydrationWatcher } from "./hydration";
import { serializeAndSend } from "./serializers";
import { setupIframe } from "./iframe";

export const pluginApp = {
  instance: null,
  properties: null,
  context: null,

  init(instance, properties, context) {
    this.instance = instance;
    this.properties = properties;
    this.context = context;

    setupIframe(this);
    startHydrationWatcher(this);
  },

  update(properties) {
    this.properties = properties;
    serializeAndSend(this);
  },

  publish(key, value) {
    this.instance?.publishState(key, value);
  },

  sendToIframe(message) {
    this.instance?.data.iframe?.contentWindow?.postMessage(message, "*");
  }
};