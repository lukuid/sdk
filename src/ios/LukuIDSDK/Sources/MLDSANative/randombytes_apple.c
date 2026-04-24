#include <stdint.h>
#include <stddef.h>
#include <Security/Security.h>

int randombytes(uint8_t *out, size_t outlen) {
    if (SecRandomCopyBytes(kSecRandomDefault, outlen, out) == errSecSuccess) {
        return 0;
    }
    return -1;
}
