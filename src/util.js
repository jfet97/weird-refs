import { reactive } from "vue"

export function notUnwrappableRef(value) {
    return reactive({ value })
}