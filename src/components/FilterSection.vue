<template>
  <div
    :id="wrapperId"
    class="filter-section__wrapper"
    v-show="showFilter"
    :class="wrapperClasses"
    :style="showFullscreen ? undefined : wrapperStyles"
    v-click-outside="handleClickOutside"
  >
    <div class="filter-section__mobile-header filter-section__mobile-only" v-if="showFullscreen">
      <button
        type="button"
        class="filter-section__mobile-close"
        @click="closeDatepicker"
        :aria-label="ariaLabels.closeDatepicker"
      >
        <slot v-if="$slots['close-icon']" name="close-icon"></slot>
        <div v-else class="filter-section__mobile-close-icon" aria-hidden="true">X</div>
      </button>
      <h3>{{ mobileHeader || mobileHeaderFallback }}</h3>
    </div>
    <div class="filter-section__inner-wrapper">
      <slot></slot>

      <div class="filter-section__action-buttons" v-if="showActionButtons" :style="stylesFooter">
        <button @click="closeDatepickerCancel" type="button">{{ texts.cancel }}</button>
        <button
          ref="apply-button"
          @click="apply"
          :style="{backgroundColor: colors.selected, color: '#fff', width: '150px', height: '30px'}"
          type="button"
        >{{ texts.apply }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { debounce, copyObject, findAncestor, randomString } from './../helpers'
import vClickOutside from 'v-click-outside'
import ResizeSelect from '../directives/ResizeSelect'

export default {
  name: 'FilterSection',
  directives: {
    clickOutside: vClickOutside.directive,
    resizeSelect: ResizeSelect,
  },
  props: {
    triggerElementId: { type: String },
    fullscreenMobile: { type: Boolean },
    mobileHeader: { type: String },
    trigger: { type: Boolean, default: false },
    offsetY: { type: Number, default: 0 },
    offsetX: { type: Number, default: 0 },
    startOpen: { type: Boolean, default: false },
    showActionButtons: { type: Boolean, default: true },
    type: { type: String },
    width: { type: Number, default: 300 },
    big: { default: false }
  },
  data() {
    return {
      wrapperId: 'airbnb-style-datepicker-wrapper-' + randomString(5),
      showFilter: false,
      alignRight: false,
      triggerPosition: {},
      triggerWrapperPosition: {},
      viewportWidth: undefined,
      isMobile: undefined,
      isTablet: undefined,
      triggerElement: undefined,
      inline: false,
      ariaLabels: {
        chooseDate: date => date,
        chooseStartDate: date => `Choose ${date} as your start date.`,
        chooseEndDate: date => `Choose ${date} as your end date.`,
        selectedDate: date => `Selected. ${date}`,
        unavailableDate: date => `Not available. ${date}`,
        previousMonth: 'Move backward to switch to the previous month.',
        nextMonth: 'Move forward to switch to the next month.',
        closeDatepicker: 'Close calendar',
        openKeyboardShortcutsMenu: 'Open keyboard shortcuts menu.',
        closeKeyboardShortcutsMenu: 'Close keyboard shortcuts menu',
      },
      texts: {
        apply: 'Apply',
        cancel: 'Cancel',
        keyboardShortcuts: 'Keyboard Shortcuts',
      },
      colors: {
        selected: '#00a699',
        inRange: '#66e2da',
        selectedText: '#fff',
        text: '#565a5c',
        inRangeBorder: '#33dacd',
        disabled: '#fff',
        hoveredInRange: '#67f6ee',
      },
    }
  },
  computed: {
    wrapperClasses() {
      return {
        'filter-section__wrapper--datepicker-open': this.showFilter,
        'filter-section__wrapper--full-screen': this.showFullscreen,
        'filter-section__wrapper--inline': this.inline,
      }
    },
    wrapperStyles() {
      var styles = {
        position: !this.big ? (this.inline ? 'static' : 'absolute') : 'fixed',
        left: this.calculateLeftPosition,
        right: this.alignRight
          ? this.triggerWrapperPosition.right - this.triggerPosition.right + this.offsetX + 'px'
          : '',
        width: !this.big ? this.width + 'px' : this.big + '%',
        zIndex: this.inline ? '0' : '100',
      }

      if (!this.big) {
        styles.top = this.inline ? '0' : this.triggerPosition.height + this.offsetY + 'px'
      } else {
        styles.bottom = '49px'
        styles.top = this.triggerPosition.y + this.triggerPosition.height + this.offsetY + 'px'
      }

      if (this.showFullscreen) {
        styles.paddingBottom = '70px'
      }

      return styles
    },
    stylesFooter() {
      if (this.isMobile || this.big) {
        var styles = {
          position: 'fixed',
          bottom: '-12px',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #ddd'
        }

        if (this.big && !this.showFullscreen) {
          styles.width = `${this.big}%`
        }

        return styles
      }

      return {}
    },
    calculateLeftPosition() {
      if (!this.alignRight && !this.big) {
        return this.triggerPosition.left - this.triggerWrapperPosition.left + this.offsetX + 'px'
      } else if (this.big) {
        return '0px'
      }

      return ''
    },
    innerStyles() {
      return {
        'margin-left': this.showFullscreen ? '-' + this.viewportWidth : `-${this.width}px`,
      }
    },
    showFullscreen() {
      return this.isMobile && this.fullscreenMobile
    }
  },
  methods: {
    positionDatepicker() {
      const triggerWrapperElement = findAncestor(this.triggerElement, `.datepicker-trigger`)
      this.triggerPosition = this.triggerElement.getBoundingClientRect()

      if (triggerWrapperElement) {
        this.triggerWrapperPosition = triggerWrapperElement.getBoundingClientRect()
      } else {
        this.triggerWrapperPosition = { left: 0, right: 0, width: 0 }
      }

      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      this.viewportWidth = viewportWidth + 'px'
      this.isMobile = viewportWidth < 768
      this.isTablet = viewportWidth >= 768 && viewportWidth <= 1024

      this.$nextTick(function() {
        const datepickerWrapper = document.getElementById(this.wrapperId)
        if (!this.triggerElement || !datepickerWrapper) {
          return
        }

        const rightPosition =
          this.triggerElement.getBoundingClientRect().left +
          datepickerWrapper.getBoundingClientRect().width
        this.alignRight = rightPosition > viewportWidth
      })
    },
    toggleDatepicker() {
      if (this.showFilter) {
        this.closeDatepicker()
      } else {
        this.openDatepicker()
      }
    },
    openDatepicker() {
      this.positionDatepicker()
      this.triggerElement.classList.add('datepicker-open')
      this.showFilter = true
      this.$emit('opened')

      window.EventBus.$emit('filter-opened', this.type)
    },
    closeDatepicker() {
      if (this.inline) {
        return
      }
      this.showFilter = false
      this.showKeyboardShortcutsMenu = false
      this.triggerElement.classList.remove('datepicker-open')
      this.$emit('closed', this.type)
    },
    closeDatepickerCancel() {
      if (this.showFilter) {
        this.$emit('cancelled', this.type)
        this.closeDatepicker()
      }
    },
    handleClickOutside(event) {
      if (event.target.id === this.triggerElementId || !this.showFilter || this.inline) {
        return
      }
      this.closeDatepicker()
    },
    apply() {
      this.$emit('applied', this.type)
      this.closeDatepicker()
    },
    setupDatepicker() {
      if (this.$options.texts) {
        const texts = copyObject(this.$options.texts)
        this.texts.apply = texts.apply || this.texts.apply
        this.texts.cancel = texts.cancel || this.texts.cancel
      }
    }
  },
  mounted() {
    this.viewportWidth = window.innerWidth + 'px'
    this.isMobile = window.innerWidth < 768
    this.isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024
    this._handleWindowResizeEvent = debounce(() => {
      this.positionDatepicker()
    }, 200)
    this._handleWindowClickEvent = event => {
      if (event.target.id === this.triggerElementId) {
        event.stopPropagation()
        event.preventDefault()
        this.toggleDatepicker()
      }
    }
    window.addEventListener('resize', this._handleWindowResizeEvent)

    this.triggerElement = this.isTest
      ? document.createElement('input')
      : document.getElementById(this.triggerElementId)

    if (this.startOpen || this.inline) {
      this.openDatepicker()
    }

    this.$el.addEventListener('keyup', this.handleKeyboardInput)
    this.$el.addEventListener('keydown', this.trapKeyboardInput)
    this.triggerElement.addEventListener('keyup', this.handleTriggerInput)
    this.triggerElement.addEventListener('click', this._handleWindowClickEvent)
  },
  created() {
    this.setupDatepicker()

    window.EventBus.$on('filter-opened', function (type) {
      if (type != this.type && this.showFilter) {
        this.closeDatepicker()
      }
    }.bind(this))
  }
}
</script>

<style lang="scss">
@import './../styles/transitions';

$tablet: 768px;
$color-gray: rgba(0, 0, 0, 0.2);
$border-normal: 1px solid $color-gray;
$border: 1px solid #e4e7e7;
$transition-time: 0.3s;
$height-footer-header: 50px;

.datepicker-trigger {
  position: relative;
  overflow: visible;
}

.filter-section {
  &__wrapper {
    border: $border-normal;
    white-space: nowrap;
    overflow: hidden;
    overflow-y: auto;
    background-color: white;

    *,
    *:after,
    *:before {
      box-sizing: border-box;
    }

    &--full-screen {
      position: fixed;
      top: $height-footer-header;
      right: 0;
      bottom: $height-footer-header;
      left: 0;
      border: none;
      z-index: 100;
    }
  }
  &__inner-wrapper {
    transition: all $transition-time ease;
    position: relative;
    padding: 15px;
    padding-bottom: 0;
  }
  &__datepicker-header {
    position: relative;
  }
  &__keyboard-shortcuts-trigger-wrapper {
    position: relative;
  }
  &__keyboard-shortcuts-trigger {
    background-color: transparent;
    cursor: pointer;
    position: absolute;
    bottom: 0px;
    right: 0px;
    font: inherit;
    border-width: 26px 33px 0px 0px;
    border-top: 26px solid transparent;
    border-right: 33px solid rgb(0, 166, 153);

    span {
      color: rgb(255, 255, 255);
      position: absolute;
      bottom: 0px;
      right: -28px;
    }
  }
  &__keyboard-shortcuts-show {
    display: block !important;
  }
  &__keyboard-shortcuts-close {
    background-color: transparent;
    border: none;
    position: absolute;
    top: 7px;
    right: 5px;
    padding: 5px;
    z-index: 100;
    cursor: pointer;
  }
  &__keyboard-shortcuts-menu {
    display: none;
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
    z-index: 10;
    overflow: auto;
    background: rgb(255, 255, 255);
    border-width: 1px;
    border-style: solid;
    border-color: rgb(219, 219, 219);
    border-image: initial;
    border-radius: 2px;
    padding: 22px;
    margin: 33px;
    text-align: left;
  }
  &__keyboard-shortcuts-title {
    font-size: 16px;
    font-weight: bold;
    margin: 0px;
  }
  &__keyboard-shortcuts-list {
    list-style: none;
    margin: 6px 0px;
    padding: 0px;
    white-space: initial;
  }
  &__keyboard-shortcuts-symbol {
    font-family: monospace;
    font-size: 12px;
    text-transform: uppercase;
    background: rgb(242, 242, 242);
    padding: 2px 6px;
    margin-right: 4px;
  }
  &__change-month-button {
    position: absolute;
    top: 12px;
    z-index: 10;
    background: white;

    &--previous {
      left: 0;
      padding-left: 15px;
    }
    &--next {
      right: 0;
      padding-right: 15px;
    }

    > button {
      background-color: white;
      border: $border;
      border-radius: 3px;
      padding: 4px 8px;
      cursor: pointer;

      &:hover {
        border: 1px solid #c4c4c4;
      }

      > svg {
        height: 19px;
        width: 19px;
        fill: #82888a;
      }
    }
  }

  &__days-legend {
    position: absolute;
    top: 50px;
    left: 10px;
    padding: 0 10px;
  }
  &__day-title {
    display: inline-block;
    width: percentage(1/7);
    text-align: center;
    margin-bottom: 4px;
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.8em;
    margin-left: -1px;
  }

  &__month-table {
    border-collapse: collapse;
    border-spacing: 0;
    background: white;
    width: 100%;
    max-width: 100%;
  }

  &__month {
    transition: all $transition-time ease;
    display: inline-block;
    padding: 15px;

    &--hidden {
      height: 275px;
      visibility: hidden;
    }
  }
  &__month-name {
    font-size: 1.3em;
    text-align: center;
    margin: 0 0 30px;
    line-height: 1.4em;
    font-weight: bold;
  }
  &__month-year-select {
    &::-ms-expand {
      display: none;
    }
    -webkit-appearance: none;
    border: none;
    background-color: inherit;
    cursor: pointer;
    color: blue;
    font-size: inherit;
    font-weight: inherit;
    padding: 0;
  }

  &__day {
    $size: 38px;
    line-height: $size;
    height: $size;
    padding: 0;
    overflow: hidden;
    &--enabled {
      border: $border;
      &:hover {
        background-color: #e4e7e7;
      }
      &:focus {
        outline: auto 5px Highlight;
        outline: auto 5px -webkit-focus-ring-color;
      }
    }
    &--disabled,
    &--empty {
      opacity: 0.5;

      button {
        cursor: default;
      }
    }
    &--empty {
      border: none;
    }
    &--disabled {
      &:hover {
        background-color: transparent;
      }
    }
  }
  &__day-button {
    background: transparent;
    width: 100%;
    height: 100%;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: center;
    user-select: none;
    font-size: 15px;
    font-weight: inherit;
    padding: 0;
  }

  &__action-buttons {
    min-height: $height-footer-header;
    max-height: $height-footer-header;
    height: $height-footer-header;
    padding-top: 10px;
    margin-bottom: 12px;
    button {
      display: block;
      position: relative;
      background: transparent;
      border: none;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
      &:nth-child(1) {
        float: left;
        left: 15px;
      }
      &:nth-child(2) {
        float: right;
        right: 15px;
      }
    }
  }

  &__mobile-header {
    border-bottom: $border-normal;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 15px 15px 15px 15px !important;
    text-align: center;
    min-height: $height-footer-header;
    max-height: $height-footer-header;
    height: $height-footer-header;
    background-color: #fff;
    h3 {
      font-size: 20px;
      margin: 0;
    }
  }
  &__mobile-only {
    display: none;
    @media (max-width: 600px) {
      display: block;
    }
  }
  &__mobile-close {
    border: 1px solid #ddd;
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 5px;
    z-index: 100;
    cursor: pointer;
    background: transparent;
    border-radius: 150px;
    width: 35px;
    color: #aaa;
    font-weight: bold;

    &__icon {
      position: relative;
      font-size: 1.6em;
      font-weight: bold;
      padding: 0;
    }
  }
}
</style>

