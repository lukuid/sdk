/*
 * Copyright (c) The mldsa-native project authors
 * SPDX-License-Identifier: Apache-2.0 OR ISC OR MIT
 */

#ifndef MLD_CONFIG_H
#define MLD_CONFIG_H

#ifndef MLD_CONFIG_PARAMETER_SET
#define MLD_CONFIG_PARAMETER_SET 65
#endif

#define MLD_CONFIG_NAMESPACE_PREFIX PQCP_MLDSA_NATIVE_MLDSA65
#define MLD_CONFIG_NO_SUPERCOP

/* Use standard C library for memory management */
#include <stdlib.h>
#include <string.h>

#define MLD_CONFIG_CUSTOM_ZEROIZE
static inline void mld_zeroize(void *ptr, size_t len) {
    memset(ptr, 0, len);
    __asm__ __volatile__("" : : "g"(ptr) : "memory");
}

/* Use standard malloc/free */
#define MLD_CONFIG_CUSTOM_ALLOC_FREE
#define MLD_CUSTOM_ALLOC(v, T, N) T* (v) = (T *)malloc(sizeof(T) * (N))
#define MLD_CUSTOM_FREE(v, T, N) free(v)

#define MLD_CONFIG_REDUCE_RAM

#endif /* !MLD_CONFIG_H */
