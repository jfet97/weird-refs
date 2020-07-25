import { warn, isReactive } from "vue"

// ----------------------------------------------------------------------------------------------------
// map each supported modifier to the correspondent function that modify the event
// native is supported as well, but it does not change the event itself
// extract modifier will extract the target.value if it is not a vue event
const modifiersFunctions = Object.freeze({
    stop: e => e.stopPropagation(),
    prevent: e => e.preventDefault()
})

const createFlowModifiers = (modifiers, isVueComponent) => {

    // track if the directive was applied to a native element || the native modifier was used
    const isNative = modifiers.native !== undefined || isVueComponent === false

    // track if the extract modifier was selected and if it can be applied
    const useExtract = isNative && modifiers.extract

    // return the selected modifiers functions inside an array, discarding not supported ones
    const eventModifiersFnsArray = Object.keys(modifiers).map(m => modifiersFunctions[m]).filter(x => x)

    return ({
        fns: eventModifiersFnsArray,
        static: {
            isNative,
            useExtract
        }
    })
}

const applyFnsModifiersToEvent = (flowModifiers, e) => flowModifiers.fns.forEach(m => m(e))

const isNative = (flowModifiers) => flowModifiers.static.isNative
const useExtract = (flowModifiers) => flowModifiers.static.useExtract

// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// check if the binded value and arg are correct
const checkValueArg = (value, arg, vnode) => {
    if (!isReactive(value) || value.value === undefined) {
        warn?.(
            `Invalid ref found in v-flow directive. ${ref} should be a reactive object with a 'value' prop.`,
            vnode.context
        )

        return -1
    }

    if (arg === undefined) {
        warn?.(
            `Invalid arg found in v-flow directive. This directive must be used with an arg.`,
            vnode.context
        )
        return -1
    }

    return 0
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// destructure a binding providing useful stuff
const destructureBinding = ({ value: ref, arg: event, modifiers }) => ({ ref, event, modifiers })
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// private context data stored for further operations using a unique key for identifying
// multiple v-flow directives on the same node

const hashBinding = binding => [binding.arg].concat(Object.keys(binding.modifiers)).join(':')

const createPrivateBindingsHashMap = (el) => el._vflowBHM = {}

const setPrivateBindingsHashMap = (el, binding, context) => {
    if (el._vflowBHM === undefined) {
        createPrivateBindingsHashMap(el)
    }

    el[hashBinding(binding)] = context
}

const getPrivateBindingsHashMap = (el, binding) => {
    if (el._vflowBHM === undefined) {
        return null
    }

    return el[hashBinding(binding)]
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// create a listener

const makeListener = (flowModifiers) => (ref) => (event) => {

    applyFnsModifiersToEvent(flowModifiers, event)

    let newVal = event;

    if (isNative(flowModifiers) && useExtract(flowModifiers)) {
        newVal = event.target.value
    }

    ref.value = newVal
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
const addEventListener = function (event, context, { el, component }) {
    if (!isNative(context.flowModifiers)) {
        // I'm not interested about a native event and the directive was used on a Vue component
        // TODO
    } else {
        // I'm interested about a native event or the directive was used on a native element
        el.addEventListener(event, context.listener)
    }
}

const removeEventListener = function (event, context, { el, component }) {
    if (!isNative(context.flowModifiers)) {
        // TODO
    } else {
        el.removeEventListener(event, context.listener)
    }
}

const updateEventListener = function (event, context, { el, component }) {
    removeEventListener(event, { ...context, listener: context.prevListener }, { el, component })

    delete context.prevListener
    addEventListener(event, context, { el, component })
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
const setupFromScratch = (el, ref, event, modifiers, vnode) => {

    // is the vnode a Vue component?
    const isVueComponent = vnode.component !== null

    // convert the received modifiers
    const flowModifiers = createFlowModifiers(modifiers, isVueComponent)

    // setRefGetListener is makeListener partial applied on the flowModifiers
    // flowModifiers never change, so it is useless recalculating it at each update
    const setRefGetListener = makeListener(flowModifiers)
    const listener = setRefGetListener(ref)

    // create the context for this binding
    const context = { setRefGetListener, listener, flowModifiers }

    // add the listener
    addEventListener(event, context, { el, component: vnode.component })

    return context
}

const mounted = (el, binding, vnode) => {
    // binding check
    if (checkValueArg(binding.value, binding.arg) === -1) {
        return;
    }

    // get info from the binding object
    const { ref, event, modifiers } = destructureBinding(binding)

    console.log({ el, ref, event, modifiers, vnode })


    const context = setupFromScratch(el, ref, event, modifiers, vnode)
    setPrivateBindingsHashMap(el, binding, context)
}

// update === something has changed, maybe the ref
const updated = (el, binding, vnode) => {

    // binding check
    if (checkValueArg(binding.value, binding.arg) === -1) {
        return;
    }

    // get info from the binding object
    const { ref, event, modifiers } = destructureBinding(binding)

    // if the previous hook completed successfully, we could retrieve some context from the binding hash map
    // and then use it
    const context = getPrivateBindingsHashMap(el, binding)
    let newContext = null

    if (context !== null) {
        const { setRefGetListener, listener } = context

        // set the new ref
        const newListener = setRefGetListener(ref)

        // update the context locally
        newContext = { ...context, listener: newListener }

        // update the listener
        updateEventListener(event, { ...newContext, prevListener: listener }, { el, component: vnode.component })

    } else {
        // something went wrong in the previous hook, e.g. a wrong binding's argument/value
        // we have to setup all from scratch

        newContext = setupFromScratch(el, ref, event, modifiers, vnode)
    }

    // update the context
    setPrivateBindingsHashMap(el, binding, newContext)
}

const unmounted = (el, binding, vnode) => {
    // if the previous hook completed successfully, we could retrieve some context from the binding hash map
    // and then use it
    const context = getPrivateBindingsHashMap(el, binding)

    if (context === null) {
        // if not, nothing never happened
        // no listener, no context to erase
        return
    }
    const { event } = destructureBinding(binding)

    removeEventListener(event, context, { el, component: vnode.component })

    // erase the context
    setPrivateBindingsHashMap(el)(binding)(null)
}
// ----------------------------------------------------------------------------------------------------

export default {
    mounted,
    updated,
    unmounted
}