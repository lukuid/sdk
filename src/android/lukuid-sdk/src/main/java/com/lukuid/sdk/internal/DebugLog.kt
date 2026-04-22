// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.util.Log
import com.lukuid.sdk.LukuSdkOptions

private const val TAG = "LukuSdk"

internal fun debugLog(options: LukuSdkOptions, message: String, context: Map<String, Any?> = emptyMap()) {
    if (!options.debugLogging) {
        return
    }

    if (context.isEmpty()) {
        Log.d(TAG, message)
        return
    }

    Log.d(TAG, "$message $context")
}
