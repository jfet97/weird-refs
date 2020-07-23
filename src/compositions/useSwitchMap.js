import { watchEffect, customRef } from "vue"

export function useSwitchMap(ref, projectionFromValuesToRefs) {

    // cleanup function on ref.value update
    let localCleanup = () => {}
    const refreshCleanup = cleanup => {
        if (typeof cleanup !== "function") {
            localCleanup = () => {}
        } else {
            localCleanup = cleanup
        }
    }

    let dependenciesTrigger = () => {}

    let projectedRef = null;
    watchEffect(() => {

        // the projection may need the ability to cleanup some stuff
        localCleanup()
        projectedRef = projectionFromValuesToRefs(ref.value, refreshCleanup)

        // an update on ref.value will produce a new projectedRef
        // all the swicthMapRef dependencies should be notified
        dependenciesTrigger()
    })

    const swicthMapRef = customRef((track, trigger) => {

        dependenciesTrigger = trigger

        return {
            get() {
                track()
                return projectedRef.value
            },
            // swicthMapRef should never be directly updated because it's value strictly depends on ref.value updates
            // it will be overwritten as soon as ref.value changes
            set() {}
        }

    })

    return swicthMapRef

}