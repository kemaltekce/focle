<script setup>
  import { computed, ref } from 'vue'

  const props = defineProps({
    initialNotes: String
  })

  defineEmits(['updateNotes'])

  // computed cause notes have to be updated once the initial notes are loaded
  const notes = computed(() => props.initialNotes)

  const displayModal = ref(false)
</script>

<template>
  <!-- <div class="modal">^</div> -->

  <div class="modal">
    <div
      class="modal__background"
      v-if="displayModal"
      @click="displayModal = false"
    ></div>
    <div
      class="modal__card"
      :class="{
        'modal__card--active': displayModal,
      }"
    >
      <div class="modal__content">
        <div
          class="modal__content__button"
          @click="displayModal = !displayModal"
        >
          <div>
            <img
              v-if="displayModal"
              src="../assets/arrow-down.svg"
              class="arrow"
              alt="arrow"
            />
            <img
              v-else
              src="../assets/arrow-up.svg"
              class="arrow"
              alt="arrow"
            />
          </div>
        </div>
        <textarea
          class="modal__content__textarea"
          id=""
          placeholder="dump vague thoughts..."
          spellcheck="false"
          v-model="notes"
          @input="$emit('updateNotes', $event.target.value)"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .arrow {
    height: 1rem;
  }

  .modal {
    display: flex;
  }

  .modal__background {
    background-color: #e2cbcd50;
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 10;
  }

  .modal__card {
    background-color: #ffffff;
    position: fixed;
    left: 0px;
    width: 100%;
    border-radius: 0.7rem 0.7rem 0 0;
    overflow: auto;
    z-index: 20;
    height: 90%;
    transition: all 0.5s;
    transform: translateY(100%);
    bottom: 3rem;
  }

  .modal__card--active {
    transform: translateY(0%);
    bottom: 0;
  }

  .modal__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #c0c0c0;
    padding: 0.5rem;
  }

  .modal__content__button {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .modal__content__textarea {
    width: 90vw;
    height: 80vh;
    resize: none;
    border: none;
    color: #555555;
    font-family: 'Roboto Mono';
  }

  .modal__content__textarea:focus {
    box-shadow: none;
  }
</style>
