<template>
  <h1>ConcatMap Test</h1>
  <button @click="incrementCounter">Count: {{ counter }}</button>
  <span>{{ concatMappedRef }}</span>
</template>



<script>
import { ref } from "vue"
import { useConcatMap } from "../../compositions/useConcatMap"

function useCreateNewRef(value, cleanup) {
  const newRef = ref(`${value} is now a string`)

  const interval = setInterval(() => {
    newRef.value += "!"
  }, 2000)


  cleanup(() => {
    clearInterval(interval)
  })

  return newRef;
}

export default {
  name: 'ConcatMapTest',
  setup() {
    const counter = ref(0)

    function incrementCounter() {
      counter.value++
    }


    const concatMappedRef = useConcatMap(counter, useCreateNewRef)

    return { counter, incrementCounter, concatMappedRef }
  }
}
</script>