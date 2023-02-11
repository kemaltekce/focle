<script setup>
  import { ref } from '@vue/reactivity'
  import Nav from './components/Nav.vue'
  import Modal from './components/Modal.vue'
  import '@picocss/pico/css/pico.min.css'

  const sessionHistory = [
    { id: 1, sessions: 3, minutes: 130 },
    { id: 2, sessions: 5, minutes: 210 },
    { id: 3, sessions: 4, minutes: 110 },
  ]

  const timerMinutes = ref('52')
  const timerSeconds = ref('00')

  function pad(time) {
    if (time === 'min') {
      timerMinutes.value = timerMinutes.value.padStart(2, '0')
    } else if (time === 'sec') {
      timerSeconds.value = timerSeconds.value.padStart(2, '0')
    }
  }
</script>

<template>
  <div class="progress"></div>
  <div class="ellipse">
    <svg
      class="ellipse__svg"
      width="940"
      height="940"
      viewBox="0 0 940 940"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle class="ellipse__svg__circle" cx="470" cy="470" r="470" />
    </svg>
  </div>

  <Nav :sessions="5" :sessionMinutes="104" :sessionHistory="sessionHistory" />

  <main>
    <div class="timer">
      <div class="timer__state">focus</div>
      <div class="timer__time">
        <input
          class="timer__time__minutes"
          v-model="timerMinutes"
          maxlength="2"
          size="2"
          @blur="pad('min')"
        />
        :
        <input
          class="timer__time__seconds"
          v-model="timerSeconds"
          maxlength="2"
          size="2"
          @blur="pad('sec')"
        />
      </div>
    </div>
    <div class="control">
      <div>
        <img src="./assets/close.svg" class="control__button" alt="close" />
      </div>
      <div>
        <img src="./assets/play.svg" class="control__button" alt="play" />
      </div>
    </div>
  </main>

  <Modal />
</template>

<style scoped>
  main {
    display: flex;
    height: 100vh;
    flex-direction: column;
  }

  .control {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3rem;
    padding: 0.5rem 1rem;
    width: 100%;
  }

  .ellipse {
    position: absolute;
    width: 100%;
    display: flex;
    bottom: -15vh;
    /* z-index: -10; */
  }

  .ellipse__svg {
    position: relative;
    max-width: 70%;
    margin: 0 auto;
    height: 50vh;
    overflow: visible;
  }

  .ellipse__svg__circle {
    transition: all 1s;
    fill: #e2cbcd;
    stroke: #e2cbcd;
    stroke-width: 0px;
  }

  .ellipse__svg__circle:hover {
    fill: #e8c2c5;
    stroke: #e8c2c5;
    stroke-width: 20px;
  }

  img {
    height: 1.5rem;
  }

  .progress {
    height: 4px;
    background-color: #e2cbcd;
    width: 27%;
  }

  .timer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 auto;
    font-weight: 300;
    flex-grow: 1;
  }

  .timer__state {
    color: #c0c0c0;
    font-size: 0.8rem;
    padding-left: 0.4rem;
  }

  .timer__time {
    display: flex;
    font-size: 2rem;
    line-height: 1.2;
  }

  .timer__time input {
    border: none;
    padding: 0;
    margin: 0;
    font-size: 2rem;
    font-weight: 300;
  }

  input:focus {
    box-shadow: none;
  }

  .timer__time__minutes {
    text-align: center;
    --line-height: 1;
  }

  .timer__time__seconds {
    text-align: center;
    --line-height: 1;
  }
</style>
