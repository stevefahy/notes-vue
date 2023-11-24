<template>
  <div class="loading_outer">
    <div class="loading_inner">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
  </div>
</template>

<style scoped>
.loading_outer {
  z-index: 5;
  position: absolute;
  width: 100%;
  height: 100%;
}

.loading_inner {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-direction: row;
  position: relative;
  align-items: center;
  background-color: #ffffff;
}
</style>
