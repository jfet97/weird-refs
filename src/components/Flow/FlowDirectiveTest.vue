<template>
    <div>
        <h1>FlowDirective Test</h1>
        <counter v-flow:click.stop="eventRef" />
        <h3>Write and let the magic happen!</h3>
        <input type="text" v-flow:input.extract="inputValueRef" />
        <simple-emitter v-flow:click.stop="eventRef"/>
        <div style="display: flex; flex-flow: row nowrap; justify-content: space-around">
            <div><pre style="text-align: left; white-space: pre-line;">{{ stringifyEvent(eventRef.value) }}</pre></div>
            <div><span> {{ inputValueRef.value }} </span></div>
        </div>
    </div>
</template>



<script>
import { ref } from "vue"
import { notUnwrappableRef } from "../../util"
import SimpleEmitter from "../Emitters/SimpleEmitter.vue"
import Counter from "../Misc/Counter.vue"

export default {
    name: 'FlowDirectiveTest',
    components: {
        SimpleEmitter,
        Counter
    },
    setup() {
        const eventRef = notUnwrappableRef({})
        const inputValueRef = notUnwrappableRef(null)


        function stringifyEvent(e) {
            const obj = {};

            for (let k in e) {
                obj[k] = e[k];
            }

            return JSON.stringify(obj, (k, v) => {
                if (v instanceof Node) return 'Node';
                if (v instanceof Window) return 'Window';
                return v;
            }, 2);
        }

        return { eventRef, inputValueRef, stringifyEvent }
    }
}
</script>