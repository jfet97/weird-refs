<template>
  <h1>SwitchMap Test</h1>
  <button @click="incrementCounter">Count: {{ counterRef }}</button>
  <span>{{ switchMappedRef }}</span>
</template>



<script>
import { ref } from "vue"
import { useSwitchMap } from "../../compositions/useSwitchMap"

function useCreateNewRef(value, cleanup) {
  const newRef = ref(`${value} is now a string`)

  const interval = setInterval(() => {
    newRef.value += "!"
  }, 1000)


  cleanup(() => {
    clearInterval(interval)
  })

  return newRef;
}

export default {
  name: 'SwitchMapTest',
  setup() {
    const counterRef = ref(0)

    function incrementCounter() {
      counterRef.value++
    }


    const switchMappedRef = useSwitchMap(counterRef, useCreateNewRef)

    return { counterRef, incrementCounter, switchMappedRef }
  }
}
</script>