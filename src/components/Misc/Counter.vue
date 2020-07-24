<template>
  <div class="counter">
    <h1>{{ count }}</h1>
    <button @click="count = count + 1;">Increment</button>
    <button @click="count = count - 1;">Decrement</button>
  </div>
</template>

<script>
export default {
  data: function() {
    return {
      count: 0
    };
  }
};
</script>

<style scoped>
.counter {
  display: flex;
  flex-direction: column;
  width: 100px;
}

button {
  background-color: black;
  color: white;
  padding: 5px;
}
</style>