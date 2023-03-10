<script setup>
  import { ref, watch } from 'vue'
  import Nav from './components/Nav.vue'
  import Modal from './components/Modal.vue'
  import '@picocss/pico/css/pico.min.css'

  const initialNotes = ref('')
  const sessionHistory = ref(null)
  const todayFocus = ref(null)

  const progress = ref(null)
  const recommendedMinutes = 52
  const recommendedAdditionalMinutes = 38
  const timerMinutes = ref('52')
  const timerSeconds = ref('00')
  const initialTime = ref(0)
  const initialAdditionalTime = ref(0)
  const timerIntervalID = ref(null)
  const currentTimeInSeconds = ref(null)
  // can be initial, pausing, playing
  const timerState = ref('initial')
  // can be focus, idle, continue
  const cycleState = ref('focus')

  // TODO download sound
  const audio = new Audio('https://cdn.freesound.org/previews/409/409468_7952991-lq.mp3')

  window.api.onHistoryFocus((data) => {
    sessionHistory.value = data
  })
  window.api.onNotes((data) => {
    initialNotes.value = data
  })
  window.api.onTodayFocus((data) => {
    todayFocus.value = data
  })

  // switch phases if timer reaches zero
  watch(currentTimeInSeconds, async (newTime, oldTime) => {
    if (newTime === 0) {
      clearInterval(timerIntervalID.value)
      audio.play()
      window.api.showWindow()
      if (cycleState.value === 'focus') {
        // after focus comes continue
        cycleState.value = 'continue'
        timerState.value = 'initial'
        setTimerStrings(recommendedAdditionalMinutes * 60)
        progress.value.style.width = '0%'
        return
      }
      if (cycleState.value === 'continue') {
        // after continue comes idle
        cycleState.value = 'idle'
        timerState.value = 'initial'
        setTimerStrings(
          Math.round((initialTime.value + initialAdditionalTime.value) / 3)
        )
        progress.value.style.width = '0%'
        saveFocus(initialTime.value + initialAdditionalTime.value)
        // reset timer values
        initialTime.value = 0
        initialAdditionalTime.value = 0
        return
      }
      if (cycleState.value === 'idle') {
        // after idle comes focus
        cycleState.value = 'focus'
        timerState.value = 'initial'
        setTimerStrings(recommendedMinutes * 60)
        progress.value.style.width = '0%'
        return
      }
    }
  })

  async function saveFocus(seconds) {
    const data = await window.api.saveFocus(seconds)
    todayFocus.value = data.focus
    sessionHistory.value = data.history
  }

  function updateNotes(notes) {
    window.api.updateNotes(notes)
    initialNotes.value = notes
  }

  function cancel() {
    clearInterval(timerIntervalID.value)

    // canceling focus and continue results in idle phase
    if (cycleState.value === 'focus' || cycleState.value == 'continue') {
      cycleState.value = 'idle'
      timerState.value = 'initial'
      setTimerStrings(
        Math.round(
          (initialTime.value +
            initialAdditionalTime.value -
            currentTimeInSeconds.value) /
            3
        )
      )
      progress.value.style.width = '0%'
      const focusedTime =
        initialTime.value +
        initialAdditionalTime.value -
        currentTimeInSeconds.value
      // only save relevant time. Below one minute might be an accident
      if (focusedTime >= 60) {
        saveFocus(focusedTime)
      }
      // reset timer values
      initialTime.value = 0
      initialAdditionalTime.value = 0
      return
    }

    // canceling idle results in focus phase
    if (cycleState.value === 'idle') {
      cycleState.value = 'focus'
      timerState.value = 'initial'
      setTimerStrings(recommendedMinutes * 60)
      progress.value.style.width = '0%'
      return
    }
  }

  function pad(time) {
    if (time === 'min') {
      timerMinutes.value = timerMinutes.value.padStart(2, '0')
    } else if (time === 'sec') {
      timerSeconds.value = timerSeconds.value.padStart(2, '0')
    }
  }

  function play(state) {
    currentTimeInSeconds.value =
      parseInt(timerMinutes.value) * 60 + parseInt(timerSeconds.value)
    cycleState.value = state
    // keep track of initial focus time
    if (timerState.value === 'initial' && state === 'focus') {
      initialTime.value = currentTimeInSeconds.value
      var time = initialTime.value
    }
    // keep track of initial continued focus time
    if (timerState.value === 'initial' && state === 'continue') {
      initialAdditionalTime.value = currentTimeInSeconds.value
      var time = initialAdditionalTime.value
    }
    timerState.value = 'playing'
    timerIntervalID.value = setInterval(() => {
      currentTimeInSeconds.value -= 1
      setTimerStrings(currentTimeInSeconds.value)
      progress.value.style.width =
        ((time - currentTimeInSeconds.value) / time) * 100 + '%'
    }, 1000)
  }

  function pause() {
    timerState.value = 'pausing'
    clearInterval(timerIntervalID.value)
  }

  function setTimerStrings(timeInSeconds) {
    timerMinutes.value = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, '0')
    timerSeconds.value = (timeInSeconds - timerMinutes.value * 60)
      .toString()
      .padStart(2, '0')
  }
</script>

<template>
  <div class="progress" ref="progress"></div>
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

  <Nav
    v-if="todayFocus"
    :sessions="todayFocus['sessions']"
    :sessionSeconds="todayFocus['seconds']"
    :sessionHistory="sessionHistory"
  />

  <main>
    <div class="timer">
      <div class="timer__state" v-text="cycleState"></div>
      <div class="timer__time">
        <input
          class="timer__time__minutes"
          :disabled="timerState !== 'initial'"
          v-model="timerMinutes"
          maxlength="2"
          size="2"
          @blur="pad('min')"
        />
        :
        <input
          class="timer__time__seconds"
          :disabled="timerState !== 'initial'"
          v-model="timerSeconds"
          maxlength="2"
          size="2"
          @blur="pad('sec')"
        />
      </div>
    </div>
    <div class="control">
      <div v-if="timerState === 'playing'" @click="pause">
        <img src="./assets/pause.svg" class="control__button" alt="pause" />
      </div>
      <div v-else-if="timerState === 'continue'" @click="play('continue')">
        <img
          src="./assets/fast-forward.svg"
          class="control__button"
          alt="continue"
        />
      </div>
      <div v-else @click="play(cycleState)">
        <img src="./assets/play.svg" class="control__button" alt="play" />
      </div>
      <div
        v-if="cycleState !== 'focus' || timerState !== 'initial'"
        @click="cancel"
      >
        <img src="./assets/close.svg" class="control__button" alt="close" />
      </div>
    </div>
  </main>

  <Modal :initialNotes="initialNotes" @update-notes="updateNotes"/>
</template>

<style scoped>
  input:disabled {
    background-color: transparent;
    color: #555555;
    opacity: 1;
  }

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
    z-index: 20;
  }

  .ellipse {
    position: absolute;
    width: 100%;
    display: flex;
    bottom: -15vh;
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
    stroke-width: 30px;
  }

  img {
    height: 1.5rem;
  }

  .progress {
    height: 4px;
    background-color: #e2cbcd;
    width: 0%;
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
