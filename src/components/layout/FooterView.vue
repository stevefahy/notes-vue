<template>
  <div class="page_footer">
    <div class="page_footer_container"><slot></slot></div>
  </div>
</template>

<style scoped>
.page_footer {
  z-index: 1;
  width: 100%;
  position: fixed;
  height: calc(var(--footer-height) * 1px);
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
  bottom: 0px;
  box-shadow:
    rgb(50 50 93 / 25%) 0px -2px 12px -2px,
    rgb(0 0 0 / 30%) 0px -1px 7px -3px;
  background-color: white;
  z-index: 6;
}

.page_footer_container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
}

.page_footer_container button {
  pointer-events: auto;
}
</style>
