const FORM_ERROR = Symbol('FORM_ERROR')

function makeForm({ form, fields, validate, submit }) {
  const fieldsWithValidation = { ...fields, [FORM_ERROR]: null }
  const submitButton = form.querySelector('[type=submit]')

  const isFormValid = () =>
    !fieldsWithValidation[FORM_ERROR] &&
    Object.values(fieldsWithValidation).every(x => !x.error)

  // cool hack :)
  const getValues = () =>
    [...new FormData(form)].reduce((acc, kv) => {
      acc[kv[0]] = kv[1]
      return acc
    }, {})

  function validateField({ value, name }) {
    const fieldInfo = fieldsWithValidation[name]
    if (!fieldInfo) return

    if (!fieldInfo.container) {
      let el = form.elements[name]
      if (el instanceof NodeList) {
        el = el[0]
      }

      while (el && !el.classList.contains('field')) {
        el = el.parentElement
      }
      if (!el) {
        throw new Error(
          'Form elements must be wrapped into `.field` container.'
        )
      }
      fieldInfo.container = el
    }

    if (!fieldInfo.errorMessage) {
      const el = document.createElement('div')
      el.className = 'field__error'
      fieldInfo.container.append(el)
      fieldInfo.errorMessage = el
    }

    const { validate, errorMessage } = fieldInfo

    const res = validate(value)
    const error = typeof res === 'string' ? res : null
    errorMessage.textContent = error
    fieldInfo.container.classList.toggle('field--invalid', error)
    fieldInfo.error = error
    fieldInfo.touched = true

    validateForm(true)
  }

  function validateForm(singleField) {
    if (!singleField) {
      for (const k in fieldsWithValidation) {
        const fieldInfo = fieldsWithValidation[k]
        if (!fieldInfo.touched) {
          const { value } = form.elements[k]
          validateField({ name: k, value })
        }
      }
    }

    let values

    if (isFormValid()) {
      values = getValues()

      if (validate) {
        const errors = validate(values) || {}
        for (const k in errors) {
          const fieldInfo = fieldsWithValidation[k]
          if (fieldInfo) {
            fieldInfo.error = errors[k]
          }
        }
        fieldsWithValidation[FORM_ERROR] = errors[FORM_ERROR]
      }
    }

    const error = !isFormValid()
    submitButton.disabled = error

    return { error, values }
  }

  function handleSubmit(ev) {
    ev.preventDefault()

    const { error, values } = validateForm()
    if (!error) {
      submit(values)
    }
  }

  function handleFieldChange(ev) {
    validateField(ev.target)
  }

  form.addEventListener('submit', handleSubmit)
  form.addEventListener('input', handleFieldChange)
  form.addEventListener('focusout', handleFieldChange)

  return function() {
    form.removeEventListener('submit', handleSubmit)
    form.removeEventListener('input', handleFieldChange)
    form.removeEventListener('focusout', handleFieldChange)
  }
}

const compose = (...fns) => x => {
  let res
  for (const f of fns) {
    res = f(x)
    if (typeof res === 'string') break
  }
  return res
}

const required = x => (x ? null : 'Обязательное поле')
const isFloat = x => !isNaN(Number(x)) || 'Введите число'
const isEmail = x => /\w+@\w+\.\w+/.test(x) || 'Некорректный email' // naive
const isPhone = x => /\d[\d- ]+/.test(x) || 'Некорректный номер телефона' // naive

const form = document.getElementById('delivery-form')
const costInput = form.querySelector('[name="cost"]')

makeForm({
  form,
  fields: {
    description: {
      validate: required,
    },
    weight: {
      validate: compose(required, isFloat),
    },
    dimensions: {
      validate: required,
    },
    'delivery-type': {
      validate: required,
    },
    'customer-name': {
      validate: required,
    },
    'customer-email': {
      validate: compose(required, isEmail),
    },
    'customer-phone': {
      validate: compose(required, isPhone),
    },
  },
  validate(values) {
    // trick
    costInput.value = calculateDeliveryCost(values) || ''
  },
  submit(values) {
    alert(JSON.stringify(values, null, 2))
  },
})

const calculateDeliveryCost = ({
  weight,
  dimensions,
  'delivery-type': type,
}) => {
  const w = +weight
  const d = +dimensions
  const t = { truck: 1, ship: 2, plane: 2.5, 'plane-fast': 3.45 }[type]

  if (isNaN(w)) return
  if (isNaN(d)) return
  if (!t) return

  return w * d * t
}
