// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import org.json.JSONArray
import org.json.JSONObject

internal object JsonUtils {
    fun toJson(map: Map<String, Any?>): JSONObject {
        val obj = JSONObject()
        map.forEach { (key, value) ->
            obj.put(key, toJsonValue(value))
        }
        return obj
    }

    private fun toJsonValue(value: Any?): Any? = when (value) {
        null -> JSONObject.NULL
        is JSONObject -> value
        is JSONArray -> value
        is Map<*, *> -> {
            val nested = JSONObject()
            value.forEach { (k, v) ->
                nested.put(k?.toString() ?: "", toJsonValue(v))
            }
            nested
        }
        is Iterable<*> -> {
            val array = JSONArray()
            value.forEach { array.put(toJsonValue(it)) }
            array
        }
        is Array<*> -> {
            val array = JSONArray()
            value.forEach { array.put(toJsonValue(it)) }
            array
        }
        is Boolean, is Int, is Long, is Float, is Double, is String -> value
        else -> value.toString()
    }

    fun fromJson(json: JSONObject): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            map[key] = fromJsonValue(json.opt(key))
        }
        return map
    }

    fun fromJsonValue(value: Any?): Any? = when (value) {
        null -> null
        JSONObject.NULL -> null
        is JSONObject -> fromJson(value)
        is JSONArray -> {
            val list = mutableListOf<Any?>()
            for (i in 0 until value.length()) {
                list += fromJsonValue(value.opt(i))
            }
            list
        }
        else -> value
    }
}
