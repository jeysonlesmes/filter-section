import FilterSection from './components/FilterSection'

const FilterSectionPlugin = {
  install(Vue, options) {
    Vue.component(FilterSection.name, {
      ...options,
      ...FilterSection
    })
  },
}

// User has to install the component by themselves, to allow to pass options
if (typeof window !== 'undefined' && window.Vue) {
  window.FilterSection = FilterSectionPlugin
}

export default FilterSectionPlugin
