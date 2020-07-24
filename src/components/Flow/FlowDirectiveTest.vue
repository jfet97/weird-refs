<template>
  <h1>FlowDirective Test</h1>
  <counter v-flow:click.stop="eventRef" />
  <button v-flow:click.stop="eventRef">Wuo uo ho!</button>
  <simple-emitter v-flow:click.stop="eventRef"/>
  <pre style="text-align: left; white-space: pre-line;">{{ stringifyEvent(eventRef.value) }}</pre>
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

        return { eventRef, stringifyEvent }
    }
}
</script>