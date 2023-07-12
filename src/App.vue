<script setup>
  import { onMounted, ref, watch } from 'vue'
  import Nav from './components/Nav.vue'
  import Modal from './components/Modal.vue'

  import '@picocss/pico/css/pico.min.css'
  import soundUrl from './assets/sound.mp3'
  import backgroundSoundUrl from './assets/background.mp3'

  const inputTimerMinutes = ref(null)
  const inputTimerSeconds = ref(null)
  const model = ref(null)

  const initialNotes = ref('')
  const sessionHistory = ref(null)
  const todayFocus = ref(null)

  const time = ref(null)
  const lastUpdateTime = ref(null)
  const progress = ref(null)
  const recommendedMinutes = 52
  const recommendedAdditionalMinutes = 38
  const timerMinutes = ref('52')
  const timerSeconds = ref('00')
  const initialTime = ref(0)
  const initialAdditionalTime = ref(0)
  const TimeoutID = ref(null)
  const currentTimeInSeconds = ref(null)
  const currentTimeInMilliseconds = ref(null)
  // can be initial, pausing, playing
  const timerState = ref('initial')
  // can be focus, idle, continue
  const cycleState = ref('focus')

  const audio = new Audio(soundUrl)
  const audioLoop = new Audio(backgroundSoundUrl)
  audioLoop.loop = true
  audioLoop.volume = 0.3
  const loopPlaying = ref(false)

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
      clearTimeout(TimeoutID.value)
      audioLoop.pause()
      audio.play()
      window.api.showTime('')
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
          floorToSixtyIncrements(
            Math.round((initialTime.value + initialAdditionalTime.value) / 3)
          )
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

  // control via keyboard shortcuts
  onMounted(() => {
    document.addEventListener('keydown', processKeyPress)
  })

  function processKeyPress(e) {
    // meta + m to play/pause background music
    if (e.keyCode === 77 && e.metaKey) {
      loopMusic()
    }
    // focus on minutes
    if (e.keyCode === 74 && e.metaKey) {
      inputTimerMinutes.value.focus()
    }
    // focus on seconds
    if (e.keyCode === 75 && e.metaKey) {
      inputTimerSeconds.value.focus()
    }
    // close focus
    if (e.keyCode === 27) {
      document.activeElement.blur()
      model.value.closeModel()
    }
    // open/close notes
    if (e.keyCode === 78 && e.metaKey) {
      model.value.toggleModel()
    }
    if (e.keyCode === 80 && e.metaKey) {
      if (timerState.value === 'playing') {
        pause()
      } else if (timerState.value === 'continue') {
        play('continue')
      } else play(cycleState.value)
    }
  }

  // methods for communication with backend
  async function saveFocus(seconds) {
    const data = await window.api.saveFocus(seconds)
    todayFocus.value = data.focus
    sessionHistory.value = data.history
  }

  function updateNotes(notes) {
    window.api.updateNotes(notes)
    initialNotes.value = notes
  }

  // methods for frontend
  function cancel() {
    clearTimeout(TimeoutID.value)
    window.api.showTime('')

    // canceling focus and continue results in idle phase
    if (cycleState.value === 'focus' || cycleState.value == 'continue') {
      cycleState.value = 'idle'
      timerState.value = 'initial'
      setTimerStrings(
        floorToSixtyIncrements(
          Math.round(
            (initialTime.value +
              initialAdditionalTime.value -
              currentTimeInSeconds.value) /
              3
          )
        )
      )
      progress.value.style.width = '0%'
      const focusedTime =
        initialTime.value +
        initialAdditionalTime.value -
        currentTimeInSeconds.value
      // only save relevant time. Below two minute might be an accident
      if (focusedTime >= 120) {
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
      time.value = initialTime.value
    }
    // keep track of idle time
    if (timerState.value === 'initial' && state === 'idle') {
      time.value = currentTimeInSeconds.value
    }
    // keep track of initial continued focus time
    if (timerState.value === 'initial' && state === 'continue') {
      initialAdditionalTime.value = currentTimeInSeconds.value
      time.value = initialAdditionalTime.value
    }
    timerState.value = 'playing'
    lastUpdateTime.value = new Date().getTime()
    currentTimeInMilliseconds.value = currentTimeInSeconds.value * 1000
    runTimer()
  }

  function runTimer() {
    let currentUpdateTime = new Date().getTime()
    let timeDiff = currentUpdateTime - lastUpdateTime.value
    if (timeDiff >= 1000) {
      currentTimeInMilliseconds.value -= timeDiff
      currentTimeInSeconds.value = Math.max(
        Math.round(currentTimeInMilliseconds.value / 1000),
        0
      )
      setTimerStrings(currentTimeInSeconds.value)
      progress.value.style.width =
        ((time.value - currentTimeInSeconds.value) / time.value) * 100 + '%'
      window.api.showTime(' ' + timerMinutes.value + ':' + timerSeconds.value)
      lastUpdateTime.value = currentUpdateTime
    }
    TimeoutID.value = setTimeout(runTimer, 200)
  }

  function pause() {
    timerState.value = 'pausing'
    clearTimeout(TimeoutID.value)
  }

  function setTimerStrings(timeInSeconds) {
    timerMinutes.value = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, '0')
    timerSeconds.value = (timeInSeconds - timerMinutes.value * 60)
      .toString()
      .padStart(2, '0')
  }

  function loopMusic() {
    if (loopPlaying.value) {
      audioLoop.pause()
    } else {
      audioLoop.play()
    }
    loopPlaying.value = !loopPlaying.value
  }

  function floorToSixtyIncrements(number) {
    return Math.max(number - (number % 60), 60)
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
      <circle
        @click="loopMusic"
        class="ellipse__svg__circle"
        cx="470"
        cy="470"
        r="470"
      />
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
          ref="inputTimerMinutes"
          @blur="pad('min')"
        />
        :
        <input
          class="timer__time__seconds"
          :disabled="timerState !== 'initial'"
          v-model="timerSeconds"
          maxlength="2"
          size="2"
          ref="inputTimerSeconds"
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

  <Modal :initialNotes="initialNotes" @update-notes="updateNotes" ref="model" />
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
