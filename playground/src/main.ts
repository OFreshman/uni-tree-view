import * as Pinia from "pinia";
import { createSSRApp } from "vue";
import App from "./App.vue";

export function createApp(): any {
  const app = createSSRApp(App);

  app.use(Pinia.createPinia());

  return {
    app,
    Pinia
  };
}