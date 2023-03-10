<script setup>
  import { ref } from '@vue/reactivity'

  defineProps({
    sessions: Number,
    sessionSeconds: Number,
    sessionHistory: Object,
  })

  const showReflect = ref(false)

  function secondsToHours(seconds) {
    return Math.floor(seconds / 3600)
  }

  function secondsToRemainingMinutes(seconds) {
    const hours = secondsToHours(seconds)
    return Math.floor((seconds - hours * 3600) / 60)
  }
</script>

<template>
  <div class="nav">
    <div class="nav__title">focle</div>
    <div class="nav__element">
      <div
        class="nav__element__tracker"
        v-if="sessions"
        :data-tooltip="
          secondsToHours(sessionSeconds) +
          ':' +
          secondsToRemainingMinutes(sessionSeconds)
            .toString()
            .padStart(2, '0') +
          'h'
        "
        data-placement="bottom"
      >
        <div class="nav__element__tracker__icon" v-for="n in sessions" :key="n">
          <img src="../assets/asterisk.svg" class="asterisk" alt="asterisk" />
        </div>
      </div>
      <div class="nav__element__reflect" @click="showReflect = true">
        <img src="../assets/asterisk.svg" class="asterisk" alt="asterisk" />
      </div>
    </div>
  </div>
  <div class="reflect" v-if="showReflect && sessionHistory">
    <div class="reflect__container">
      <div class="reflect__container__close" @click="showReflect = false">
        <img src="../assets/close_grey.svg" class="close" alt="close" />
      </div>
      <div class="reflect__container__title">reflect</div>
      <div class="reflect__container__sessions">
        <div
          class="reflect__container__sessions__notfound"
          v-if="sessionHistory.length === 0"
        >
          no past focus data found.
        </div>
        <div
          v-for="item in sessionHistory"
          :key="item.date"
          class="reflect__container__sessions__single"
          :data-tooltip="
            secondsToHours(item.seconds) +
            ':' +
            secondsToRemainingMinutes(item.seconds)
              .toString()
              .padStart(2, '0') +
            'h'
          "
          data-placement="right"
        >
          <div
            class="reflect__container__sessions__single__icon"
            v-for="n in item.sessions"
            :key="n"
          >
            <img src="../assets/asterisk.svg" class="asterisk" alt="asterisk" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .asterisk {
    height: 0.7rem;
  }

  .close {
    height: 1rem;
  }

  .nav {
    position: absolute;
    top: 0;
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    width: 100%;
  }

  .nav__element {
    display: flex;
    gap: 2rem;
  }

  .nav__element__tracker {
    background-color: #ffffff;
    padding: 0 0.5rem;
    border-radius: 0.3rem;
    border: none;
    display: flex;
  }

  .nav__element__tracker__icon {
    padding: 0 0.2rem;
  }

  .reflect {
    background-color: #f7f7f7;
    position: absolute;
    z-index: 100;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .reflect__container {
    max-width: 600px;
    margin: 0 auto;
    padding: 3rem 1rem;
  }

  .reflect__container__close {
    position: absolute;
    right: 0;
    top: 0;
    padding: 0.5rem 1rem;
    color: #c0c0c0;
  }

  .reflect__container__title {
    font-size: 3rem;
    font-weight: 200;
    padding-bottom: 2rem;
  }

  .reflect__container__sessions__notfound {
    color: #c0c0c0;
    font-weight: 300;
  }

  .reflect__container__sessions__single {
    background-color: #ffffff;
    padding: 0 0.5rem;
    border-radius: 0.3rem;
    border: none;
    margin: 0.5rem 0;
    width: fit-content;
    display: flex;
  }

  .reflect__container__sessions__single__icon {
    padding: 0 0.5rem;
  }
</style>
