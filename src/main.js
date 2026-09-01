import { createApp } from "vue";
import App from "./App.vue";
import "./styles/style.css";
import router from "./router";
import { registerAdminAlertsWorker } from "./utils/adminAlerts.js";
import { bindAudioUnlock } from "./utils/playBeep.js";

const app = createApp(App);

app.use(router);

app.mount("#app");

bindAudioUnlock();
registerAdminAlertsWorker();
