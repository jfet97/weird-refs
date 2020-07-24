<template>
  <div>
    <h1>{{ text }}</h1>
    <button @click="$emit('clicka', $event)">Let the magic happen!</button>
  </div>
</template>



<script>
import { ref } from "vue"

export default {
    name: 'SimpleEmitter',
    setup() {
        const text = ref("Click Me")
        return { text }
    }
}
</script>