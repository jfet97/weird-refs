import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import flow from "./directives/flow"

const app = createApp(App)

app.directive('flow', flow)

app.mount('#app')
