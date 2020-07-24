import { warn, isReactive } from "vue"

// ----------------------------------------------------------------------------------------------------
// map each supported modifier to the correspondent function that modify the event
// native is supported as well, but it does not change the event itself
const modifiersFunctions = Object.freeze({
    stop: e => e.stopPropagation(),
    prevent: e => e.preventDefault()
})

// return the selected modifiers functions inside an array, discarding not supported ones
const getModifiersFunctionsArray = (modifiers) => Object.keys(modifiers).map(m => modifiersFunctions[m]).filter(x => x)

const applyModifiersToEvent = (modifiersArray) => (e) => modifiersArray.forEach(m => m(e))
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// check if the binded value and arg are correct
const checkValueArg = (value, arg, vnode) => {
    if (!isReactive(value) || value.value === undefined) {
        warn?.(
            `Invalid ref found in v-flow directive. ${ref} should be a reactive object with a 'value' prop.`,
            vnode.context
        )

        return -1;
    }

    if (arg === undefined) {
        warn?.(
            `Invalid arg found in v-flow directive. This directive must be used with an arg.`,
            vnode.context
        )
        return -1;
    }

    return 0
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// destructure a binding providing useful stuff
const destructureBinding = ({ value: ref, arg: event, modifiers }) => ({ ref, event, modifiers })
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// private cleanup/update data stored for the cleanup/update phase using a unique key for identifying
// multiple v-flow directives on the same node

const hashBinding = binding => [binding.arg].concat(Object.keys(binding.modifiers)).join(':')

const createPrivateBindingsHashMap = (el) => el._vflowBHM = {}

const setPrivateBindingsHashMap = (el) => (binding) => (cleanupStuff) => {
    if (el._vflowBHM === undefined) {
        createPrivateBindingsHashMap(el)
    }

    el[hashBinding(binding)] = cleanupStuff
}

const getPrivateBindingsHashMap = (el) => (binding) => {
    if (el._vflowBHM === undefined) {
        return null
    }

    return el[hashBinding(binding)]
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
// create a listener

const makeListener = (modifiersArray) => (ref) => (event) => {
    applyModifiersToEvent(modifiersArray)(event)
    ref.value = event
}
// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
const addEventListener = function (event, listener, isNative, { el, vnode }) {
    if (!isNative) {
        // I'm not interested about a native event and the directive was used on a Vue component
        // TODO
    } else {
        // I'm interested about a native event or the directive was used on a native element
        el.addEventListener(event, listener)
    }
}

const removeEventListener = function (event, listener, isNative, { el, vnode }) {
    if (!isNative) {
        // TODO
    } else {
        el.removeEventListener(event, listener)
    }
}

const updateEventListener = function (event, prevListener, newListener, isNative, { el, vnode }) {
    removeEventListener(event, prevListener, isNative, { el, vnode })
    addEventListener(event, newListener, isNative, { el, vnode })
}



// ----------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------
const setupFromScratch = (el, ref, event, modifiers, vnode) => {
    // convert the selected event modifiers into the appropriate functions
    const eventModifiersArray = getModifiersFunctionsArray(modifiers)

    // setRefGetListener is makeListener partial apllied on the eventModifiersArray
    const setRefGetListener = makeListener(eventModifiersArray)
    const listener = setRefGetListener(ref)

    // track if the directive was applied to a native element || the native modifier was used
    const isNative = modifiers.native !== undefined || vnode.component === null

    // add the listener
    addEventListener(event, listener, isNative, { el, vnode })

    const cleanupStuff = { setRefGetListener, listener, isNative }
    return cleanupStuff
}

const mounted = (el, binding, vnode) => {
    // binding check
    if (checkValueArg(binding.value, binding.arg) === -1) {
        return;
    }

    // get info from the binding object
    const { ref, event, modifiers } = destructureBinding(binding)

    console.log({ el, ref, event, modifiers, vnode })

    const cleanupStuff = setupFromScratch(el, ref, event, modifiers, vnode)

    // store some useful data for the cleanup/update phase using a unique key for identifying
    // multiple v-flow directives on the same node
    setPrivateBindingsHashMap(el)(binding)(cleanupStuff)
}

// update === the directive argument aka the ref has changed
const updated = (el, binding, vnode) => {

    // binding check
    if (checkValueArg(binding.value, binding.arg) === -1) {
        return;
    }

    // get info from the binding object
    const { ref, event, modifiers } = destructureBinding(binding)

    // if the previous hook completed successfully, we could retrieve some useful stuff from the binding hash map
    const cleanupStuff = getPrivateBindingsHashMap(el)(binding)
    let newCleanupStuff = null

    if (cleanupStuff !== null) {
        const { setRefGetListener, listener, isNative } = cleanupStuff

        const newListener = setRefGetListener(ref)
        updateEventListener(event, listener, newListener, isNative, { el, vnode })

        newCleanupStuff = { ...cleanupStuff, listener: newListener }

    } else {
        // something went wrong in the previous hook, e.g. a wrong binding's argument/value
        // we have to setup all from scratch

        newCleanupStuff = setupFromScratch(el, ref, event, modifiers, vnode)
    }

    // update the useful data stored
    setPrivateBindingsHashMap(el)(binding)(newCleanupStuff)
}

const unmounted = (el, binding, vnode) => {
    // if the previous hooks completed successfully, we could retrieve some useful stuff from the binding hash map
    const cleanupStuff = getPrivateBindingsHashMap(el)(binding)

    if (cleanupStuff === null) {
        // if not, nothing never happened
        return;
    }

    const { listener, isNative } = cleanupStuff
    const { event } = destructureBinding(binding)

    removeEventListener(event, listener, isNative, { el, vnode })
    setPrivateBindingsHashMap(el)(binding)(null)
}
// ----------------------------------------------------------------------------------------------------

export default {
    mounted,
    updated,
    unmounted
}