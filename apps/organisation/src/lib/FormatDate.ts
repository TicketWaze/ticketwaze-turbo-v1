import { DateTime } from "luxon";

export default function FormatDate(entry: DateTime | string) {
    const date = new Date(entry.toString())
    return date.toLocaleDateString('en-US', {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}