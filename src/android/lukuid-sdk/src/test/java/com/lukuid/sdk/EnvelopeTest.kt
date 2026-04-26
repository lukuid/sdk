// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.charset.StandardCharsets
import java.util.Base64
import java.io.File
import com.lukuid.sdk.internal.JsonUtils

class EnvelopeTest {

    private fun getValidEnvelopeStr(): String {
        return """{
  "type": "environment",
  "version": "1.0",
  "signature": "GFWwQWtVPQNYbpSW8/NFZNg4l/zSV+cJywLktmkAQZyVqIh1f/Tne6vrPekj68g/klVKM03PwCBRiaiswsw2DA==",
  "previous_signature": "1hnBbaUSxtlf5d5iEZOJIRyW2/Qd4ofCB7gph6U+cs9+kBwEPXJM9qGlcXepFOFwa5YCVcx5/48K8qdTsHQ0Aw==",
  "canonical_string": "A6C9DDD2:environment:176:1776337112:223.28:16.94:30275:1hnBbaUSxtlf5d5iEZOJIRyW2/Qd4ofCB7gph6U+cs9+kBwEPXJM9qGlcXepFOFwa5YCVcx5/48K8qdTsHQ0Aw==:vbus",
  "device": {
    "device_id": "A6C9DDD2",
    "public_key": "psnd0ry/5Uys8qLsEbAi891jdp+AEeFSea7/JTu+0ww="
  },
  "payload": {
    "accel_g": {
      "x": -0.0010000000474974513,
      "y": 0.00800000037997961,
      "z": 1.00600004196167
    },
    "ctr": 176,
    "humidity_pct": 24.505615234375,
    "lux": 223.27999877929688,
    "pressure_hpa": 1016.117919921875,
    "temp_c": 16.93756103515625,
    "timestamp_utc": 1776337112,
    "uptime_us": 31260617,
    "vbus_present": true,
    "voc_index": 30275
  },
  "attestation_dac_der": "MIIBSzCB8qADAgECAhBydPLaAfbbWrvoE/8CTng4MAoGCCqGSM49BAMCMDQxMjAwBgNVBAMTKUx1a3VJRCBNYW51ZmFjdHVyZXIgQXV0aG9yaXR5IChFcGhlbWVyYWwpMB4XDTI2MDQxNDE5MzQ0OFoXDTQ2MDQwOTE5MzQ0OFowGDEWMBQGA1UEAxMNTHVrdUlELURldmljZTAqMAUGAytlcAMhAKbJ3dK8v+VMrPKi7BGwIvPdY3afgBHhUnmu/yU7vtMMozEwLzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIHgDAVBgNVHSUEDjAMBgorBgEEAYP/GAECMAoGCCqGSM49BAMCA0gAMEUCIQCeqStK/Mi5yfMItx0mXIH6RUFUoDiqLsR717Am+3+wNgIgBdrFtTz9rwlq22w080sctIREMELrC+phsAPcspRIQ1Y=",
  "attestation_manufacturer_der": "MIIBwDCCAWagAwIBAgIQR5eT0R6O4buSjP8dI5QQTzAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJFVTEPMA0GA1UECgwGTHVrdUlEMSIwIAYDVQQDDBlzY2FsZXdheS1pbnRlcm1lZGlhdGUtZGV2MRMwEQYDVQQLDApsdWt1aWQtZGV2MB4XDTI2MDQxNDE5Mjk0OFoXDTQ2MDQwOTE5MzQ0OFowNDEyMDAGA1UEAxMpTHVrdUlEIE1hbnVmYWN0dXJlciBBdXRob3JpdHkgKEVwaGVtZXJhbCkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQlTvShE38X5P7B4Wow/6+hYoVfc9Es7xDC1EcYVruV9vVWb/4T8Ioxw3XkdUNNw3yrI38LIp5HPLWTXuOZepSRozcwNTAPBgNVHRMECDAGAQH/AgEAMAsGA1UdDwQEAwIBhjAVBgNVHSUEDjAMBgorBgEEAYP/GAECMAoGCCqGSM49BAMCA0gAMEUCIBaP2KQcEe4/exZwRtOBk3aaWM3iGi7ACOdBBZLXIHIxAiEAuKmFuV7STy0HdYLCgkK4VqxsUcKuJWM3/U2A1Vn6jX0=",
  "attestation_intermediate_der": "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",
  "heartbeat_slac_der": "MIIBSDCB76ADAgECAhDOnRH2C6A/sNKh0OPA6DVOMAoGCCqGSM49BAMCMDExLzAtBgNVBAMTJkx1a3VJRCBIZWFydGJlYXQgQXV0aG9yaXR5IChFcGhlbWVyYWwpMB4XDTI2MDQyMDExMTE0N1oXDTI2MDUyMDExMTE0N1owGDEWMBQGA1UEAxMNTHVrdUlELURldmljZTAqMAUGAytlcAMhAKbJ3dK8v+VMrPKi7BGwIvPdY3afgBHhUnmu/yU7vtMMozEwLzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIHgDAVBgNVHSUEDjAMBgorBgEEAYP/GAEDMAoGCCqGSM49BAMCA0gAMEUCIFRh3scYF+PqpDBVeOE2eh6wdVVCf0QcQWzdv/DH3fBXAiEAo2z6/vqBKBm6ODmkX5LoUEHiQ2WZXZpCPLkIlfSXGY4=",
  "heartbeat_der": "MIIBvTCCAWOgAwIBAgIQRwJ3bOa3zpRZ6N3eWzMPbjAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJFVTEPMA0GA1UECgwGTHVrdUlEMSIwIAYDVQQDDBlzY2FsZXdheS1pbnRlcm1lZGlhdGUtZGV2MRMwEQYDVQQLDApsdWt1aWQtZGV2MB4XDTI2MDQyMDA4MzMzNloXDTI2MDUyMDA4MzgzNlowMTEvMC0GA1UEAxMmTHVrdUlEIEhlYXJ0YmVhdCBBdXRob3JpdHkgKEVwaGVtZXJhbCkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS5BFHtZ9642FVq6xuV8zrCVgzeGE1SuWOxru+o7A/JFHSmNB1ftev382OuTlW+Tp01YI41uRdQiaPguGISVF/tozcwNTAPBgNVHRMECDAGAQH/AgEAMAsGA1UdDwQEAwIBhjAVBgNVHSUEDjAMBgorBgEEAYP/GAEDMAoGCCqGSM49BAMCA0gAMEUCIQDzQJX4p6k+z35ha8ef8+q35VKRiLVVOv+FUjV8XXba7AIgCIrXWqyEJIdousQet/7wirPKPNaO/aiosddECFtbGgM=",
  "heartbeat_intermediate_der": "MIIOuzCCAbigAwIBAgIUVyCarlY5OV68hdSO8KA4+2dBy0AwCwYJYIZIAWUDBAMSMDsxCzAJBgNVBAYTAkVVMQ8wDQYDVQQKDAZMdWt1SUQxGzAZBgNVBAMMEkx1a3VJRCBQUUMgUm9vdCBDQTAeFw0yNjA0MDExMjE2MTZaFw0yNzA0MDExMjE2MTZaMFcxCzAJBgNVBAYTAkVVMQ8wDQYDVQQKDAZMdWt1SUQxIjAgBgNVBAMMGXNjYWxld2F5LWludGVybWVkaWF0ZS1kZXYxEzARBgNVBAsMCmx1a3VpZC1kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASMwkC+dYvYV2j47L7zj2Q2HmUlk4iD2qOw5ZsImjHd22DYGhqnLX88//5O8QM5cjvpm/b6BcVBKLg2cWMkxw6ho30wezASBgNVHRMBAf8ECDAGAQH/AgEAMA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUBiDGYK1QBO4H4RPExMzb8ZWcYR4wHwYDVR0jBBgwFoAUcW3eH6pWJcD+uoLcPr0TuOYQjXcwFQYDVR0gBA4wDDAKBggrBgEEAYP/GDALBglghkgBZQMEAxIDggzuAFPLVckSxuE9Lq8h37OGzb3MvVUwT2K4aRgBEUHB+XAMtNbeuQKLnQERXQsnfKiMFHL9juAA93CnDw53FPdCFTxND93KyfKFiUQVq8RRXCYvoef1lx1v0GGKXbC8JP5VL/uOy+qTp2fXVWLNwh3+eYDtt/LMuI7L3FO7HcgIYCY7gZB06mikA8p1pQDrJW0H08hoBZTffvyLQK5hl6VlJ+Xuru1nb1ss9orc0WrgkxQScy/9EcS74clTdqRebgd9MOl7mAlVchxD4OlvT70TZJlh54fwStMDtPDudZ5bW68XVHVRrZNM0yO7YXBhhW/bFkOuNk8Ww06dcfDqxf0voAXw5kTXBvCIQrR65/ZG+a0nsJSXt4W8Lbe207hk5cvGLF4uPNFPlS9aR4MH28oTTgr4xITOvKfCFZjSBy6dqRVO+FhcXz+Ztt2wR02RXbypxHLEMrAQKDapGpBBJ5PPiMldbF2SAa87dRozYz94f+XG4m1B587L8s5WFLWu1uHJ2eCmWFXLjCU4QdAbb5uznNLbhFEnmaV/oQyzoSKv/gxwpK8kHkKGdNaeY1fSx3CrmY2xLvQNCj7nya9W0WQFykeD9HhqRRxCd9X7jnQR8KyI16WmU4gbWDGxwGAoLBwwZhL2w2eSa7n7NtE4mk5IjWZAWOVDy79JnXU/69MbYbIv5LEQlZ71SBSjA/wPsgrFiyaTsB8EQF0zKpmaKxvsP9djzY05jTPFoXHz/yzWiGozMbqJUnyzRRceLBWqY22EeV+SyEz4O87tHeYUuQpclLzumcOmnhYB4b0rSrp43OIv2C1PXxEm01hN5w1piTrWrDrn0D1UZLLCChb1IZTkOyx/1KDwmX2d0mkkEFZzJxI9571odNwoG8RQJVJb0PqD7CvyhJtmxW+MFCudLx9Yy1onXTh8e6rhn476JBFVU44lco4DyhWBirhaTPo1+QLGt1IAJZZRcU20avvKTjF+wgWMxwT6rluEU6u98jlN2ZxPtrdfGsD+A52rMn6Rni1JwKuAUPwNuMqhQ3zCsimNGlxdvyzjkiW/J+pcu+yKI0TnjqewckFgEexfvd6x/yghU4eXzp5SnzbTNKnk87BjEnanykxCWB/mo/iWi94Vt4vOyKA+oj9h/+S9afOqTvY81cySkFqd1pgKjMr1ff2T29VFiI/fb/LI6FanPgvgyMb1QaO+0QwSE4dURyRB1kf8z0cLhoDF4wR82dbhgZwiyXvh7gszeOCsf+kCu4ww27evegtsZtN1bzGSIpSR5PotTs1U1e9OxQGLTsRldNFWCd3D9KsOP4HSwabRjU5wLNVC0ZAdRwZEhzLexzyuJr+UxbdAJTnX02NYcb2AOxSNVztu0+qB7bS2X/2CEU5IpBqbXPtjqqOhOW/RDdZ8hUm0s4OLRFKyQflj+eO1Eo/UE27odwMXEVBrEKKOpYJ2QGNBvB0w9ER30sHKezex6adB2ZrPsBP3IhroMF6F7RxsafZiNrt3IBI3c77j5MXDuPXbD2074BBEq/HWEllLrdKp4yL3B9bNiOuvBH5yKw5q43iNfi4IWF7p0WRXyllwcNxZB56LYW0owGxONbqTZbzA0+6Mj+Ib9UclFKm9I1nSmEr1YVeIB87hupmA0kdoLusGTjBHtN32AKFoIGTKP3Flzxx6+RVHkiLqmDZgm9tFgE8WCTB4GG6xmTfzfhSNHPu400PKbpcNvUkw4xvsppSgLJu4XXcHQVRj3pF9kiMHAGSqwrL1Js9Mtb9hW9yp1C61/xInOazA0HV84XhHqnq09zU7gsPeQCHNtysg+UpSW7Dn+szzKIGknbcgcroyr0DBm2frYzQIAnp3wSM22xcadC9wEBhEuc86MW03sJ9KkLY9rWhAFfyTFHO1iyzC+h06FcEreHRVlP13aNdWGM0S4ltfBuQjn0nFL4UC1wK6myu32IGVhUSftIiedlslxI5Dt1u76cj17SJ9+u16hkVDM4+XMWKgjJ+8gDZfhWsmlvPptGEnrU9G1nA3nkcLP8ZkRiCDy9vg6+RkeUF71QWkbz7WV977GqBxz6XNBrOoBihfwmnKcl50uDLYLeACnFyYkVXXOi9eMDegsEGbkyd1YfSZuWoQqZY/ZB1+LAARsB3ObYd1Q0mAnvYD1M1OlT1kb0SpIH2+6Kp4PRnB2kh6naPOJP4Qo+W7QvGvrzO7wf0xqohQpxG+ubpHGPtcCUgk0ThsDTz4XUqcBiZT2ajEXvn3x7HVmSRTAmlCIwm76qFqA+qHx9qXG98vPY6M3f5h2DAQCle1O6Tff8xUqjREfesXg96xsA0d8hS6hWjjtE+6dC3vDRBqDdyxT2ZzAWprqMW9QscPhhgtYuzQgvxxWB8DLHhswBAJXQ73yWaNZl6XCcEKyA53QhFPGqod64By+tElJQehKkkdwz3s+l1l+4QLfFCWbYfRuzcaJBTAvmK5eOC6DkNKWafdQCRkTBfPdyKz7aY6C2crqOwzUZoMK2cFF9fuj0nFgGFh9K7QemlTYWks87+BPsa8VP8HvV1aNFZ985QtdASv0egt2eXnMxTXsPfizFx5sllslKjQgSnODmXJ79SfWgIz3aLhoPKJBnPh6siUn9X/pgCHHH3BUL7LQSLgQY6hSXYPEIFKUlTvW/0H6+XOaasLtC7vIBDCrtg5wr3gXJYUqPpg9anIpkP3eFiZPckhPZpUy5X5dgLU7Cx/mVgcvv+f7iI2/z+Gfh0IxS0yzvCAOfelXNNQL7P941/JtVKgdfHoD+22Eam1QZ9sHZwtlWDBT2fxVPs/kqErq9+0SgUhx3aU29lC/mmhXKTBFyGoQzEeE1QZTT14+qHT4j7291K7cgjuo8YdM3bORu20uxK0zJ+sDCgW8r7M40F+BwoFB+mjUqusSTi+MIjvqdad5si+fs9ttu6K16oroaBGAvBcWh7K7cKcCR+RRd3ZZKnXh9EiVBr9hT7oi+Th6JoC/lhRP8GU6FrX8KAZKRH/e6MD05RBCkX0kX/He0I5qjP+8XweCRZgt3wMRnpFJ10ItwXVS9Ct+P4LOwWiZc/vNzMTcbsDSXds6+n73yP1BBtxPX0tklzXWInbjxYhTRpPRG6fRsrZnmNGUv+Yz1Q5n8LN5E8ziQJHtl373LRNv4T8ekpZhaEki9xf9eMPl6LIdh2rAm423FlaBrjRGOpRV2a09RkF7ACoLY0qF1xgcC2BtEdARdrrLo61YM9LtzuZH1h/Rrx/fNtfzs7x+eNWUFUcy67Qf6Has5yXc8nqWaiVymjYQBiu62iapA+5zyHTXZOdTqbyswVwQrIFhhbq1jQ7ZiueuG4Kn29BI2M8PqzSVslaFYIUe8lB+GA9lho/TjTMCnTADGej5vHP42VNCrBL8yWggfgTVjhCgCTBptCWqyGC8h69N3ZvZsjeQBr+jw4qrcu5MHX+2wqPFxFOgeghF6XYsTsWerIMDjQ+V/hLbfAtbKN01GY+okuM74PDQKT3CmYMFpuJjnwPTUjofMMmv271gFcg3EPCJfPoT/B2qW7Ec7NHFAF2MYKvhYENdImFecr/Joa+/ca7+LMm09qEe9NTQvJgOqK7eYiUb6Td45qlEqM2A8Kwg+yF6QQ9atA7qGZ7Kzz+N28RFu+NSAStRNdWLVY3Yutf9wIXNwtqYcKq2XeU2lh4tQwPjT7+W7wDqqePhaFJHxaPisJKT3IpoW3ieQT2dmSSpGx7vEpRa1dBXww5gL+Bx2G+TRsOne8NhFzie2SgjsSSe4s2HOfuiw8al/ll/Ezsf6ZDlXsz7GgNaTlOzyUTIncrBko8KeClxTUajId0+LHZjPGVs5PaekfJRtGClN8wI6ry1oTUxh5ImoPqeqdjyFItvsa3FrqkJ5wfiSnpxq/aRWMKs4p9WbCYJu8hOTbxJTfh32Ikz+qceqw+jgLHivxwjdcHm6BDuqL74vngd10O/87iz6F/DNvfJpd6T3D+EgvLQNsKaaVKVU54LvC64n3+mBt7e0/Y6DaoOajQivqYDxZATRGBf2STZVIRErHokQvVeX2WMf5UJV+3FSxY+xojEUCQNoh326gPY241luMDdJJaEblQ3R3IhwkXRjwo8Vokcx1eR/S1cRlJjbTceSJ3bdlnE1LOV1DhW03DdiF4IRmlzQB+D0NeauI2uE4ZLcXif7LuNL9Jq7eO3OCTF0J9VGplRZQB9HivWl9AanrqjTszDKM0V1V6Dq7/SAk7G0ZNyJzgcpljd9ccdXH4GkAaa6zWy+yF4GRBuAgZrdo/ziZJe8Vjg0p7L5Ru08bnCRZTn1SpZpnEi48ZKMshwL8V04hCSsE6/MOtMR69Hig9RFBR3RAVIUxjkpWtrghEeYY0VnGTn8UGCV6gyPEEGzCDou0AAAAAAAAAAAAAAAAAAAAAAAcQFBogJg==",
  "identity": {
    "attestation_intermediate_der": "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",
    "heartbeat_der": "MIIBvTCCAWOgAwIBAgIQRwJ3bOa3zpRZ6N3eWzMPbjAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJFVTEPMA0GA1UECgwGTHVrdUlEMSIwIAYDVQQDDBlzY2FsZXdheS1pbnRlcm1lZGlhdGUtZGV2MRMwEQYDVQQLDApsdWt1aWQtZGV2MB4XDTI2MDQyMDA4MzMzNloXDTI2MDUyMDA4MzgzNlowMTEvMC0GA1UEAxMmTHVrdUlEIEhlYXJ0YmVhdCBBdXRob3JpdHkgKEVwaGVtZXJhbCkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS5BFHtZ9642FVq6xuV8zrCVgzeGE1SuWOxru+o7A/JFHSmNB1ftev382OuTlW+Tp01YI41uRdQiaPguGISVF/tozcwNTAPBgNVHRMECDAGAQH/AgEAMAsGA1UdDwQEAwIBhjAVBgNVHSUEDjAMBgorBgEEAYP/GAEDMAoGCCqGSM49BAMCA0gAMEUCIQDzQJX4p6k+z35ha8ef8+q35VKRiLVVOv+FUjV8XXba7AIgCIrXWqyEJIdousQet/7wirPKPNaO/aiosddECFtbGgM=",
    "heartbeat_intermediate_der": "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",
    "heartbeat_root_fingerprint": "6f1cabfae6608dcd10ed9ff295dc4d8916decb46adcb0cf2531b6f2e99fd26e4",
    "manufacturer_der": "MIIBwDCCAWagAwIBAgIQR5eT0R6O4buSjP8dI5QQTzAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJFVTEPMA0GA1UECgwGTHVrdUlEMSIwIAYDVQQDDBlzY2FsZXdheS1pbnRlcm1lZGlhdGUtZGV2MRMwEQYDVQQLDApsdWt1aWQtZGV2MB4XDTI2MDQxNDE5Mjk0OFoXDTQ2MDQwOTE5MzQ0OFowNDEyMDAGA1UEAxMpTHVrdUlEIE1hbnVmYWN0dXJlciBBdXRob3JpdHkgKEVwaGVtZXJhbCkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQlTvShE38X5P7B4Wow/6+hYoVfc9Es7xDC1EcYVruV9vVWb/4T8Ioxw3XkdUNNw3yrI38LIp5HPLWTXuOZepSRozcwNTAPBgNVHRMECDAGAQH/AgEAMAsGA1UdDwQEAwIBhjAVBgNVHSUEDjAMBgorBgEEAYP/GAECMAoGCCqGSM49BAMCA0gAMEUCIBaP2KQcEe4/exZwRtOBk3aaWM3iGi7ACOdBBZLXIHIxAiEAuKmFuV7STy0HdYLCgkK4VqxsUcKuJWM3/U2A1Vn6jX0=",
    "signature": "zYvP6hjcshYghfdM1lglacTeU/Bv847qqD/NELkczdN6BVBNpwJ3QOTrzeSR3IMhCKcSuawjBoF1v84l1T7jDA==",
    "slac_der": "MIIBSDCB76ADAgECAhDOnRH2C6A/sNKh0OPA6DVOMAoGCCqGSM49BAMCMDExLzAtBgNVBAMTJkx1a3VJRCBIZWFydGJlYXQgQXV0aG9yaXR5IChFcGhlbWVyYWwpMB4XDTI2MDQyMDExMTE0N1oXDTI2MDUyMDExMTE0N1owGDEWMBQGA1UEAxMNTHVrdUlELURldmljZTAqMAUGAytlcAMhAKbJ3dK8v+VMrPKi7BGwIvPdY3afgBHhUnmu/yU7vtMMozEwLzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIHgDAVBgNVHSUEDjAMBgorBgEEAYP/GAEDMAoGCCqGSM49BAMCA0gAMEUCIFRh3scYF+PqpDBVeOE2eh6wdVVCf0QcQWzdv/DH3fBXAiEAo2z6/vqBKBm6ODmkX5LoUEHiQ2WZXZpCPLkIlfSXGY4="
  }
}"""
    }

    @Test
    fun testVerifyEnvelopeValid() {
        val json = JSONObject(getValidEnvelopeStr())
        val map = JsonUtils.fromJson(json)
        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected no issues, got ${issues.joinToString { it.code + ":" + it.message }}", issues.isEmpty())
    }

    @Test
    fun testVerifyEnvelopeInvalidSignature() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("signature", Base64.getEncoder().encodeToString(ByteArray(64)))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "RECORD_SIGNATURE_INVALID" })
    }

    @Test
    fun testVerifyEnvelopeMissingIdentity() {
        val json = JSONObject(getValidEnvelopeStr())
        json.remove("device")
        json.remove("device_id")
        json.remove("public_key")
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "DEVICE_IDENTITY_MISSING" })
    }

    @Test
    fun testVerifyEnvelopeInvalidDac() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString("bad_cert".toByteArray()))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeInvalidCanonicalString() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("canonical_string", "tampered:canonical:string")
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "RECORD_SIGNATURE_INVALID" })
    }

    @Test
    fun testVerifyEnvelopeTamperedMldsaSignature() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Tamper with the last byte of the signature (which is at the end of the DER)
        der[der.size - 1] = (der[der.size - 1].toInt() xor 0xFF).toByte()
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to tampered signature", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeWrongRoot() {
        val json = JSONObject(getValidEnvelopeStr())
        // Remove the intermediate so it tries to verify DAC against roots directly (and fails because it's signed by intermediate)
        json.remove("attestation_intermediate_der")
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to missing/wrong root chain", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeMalformedSpki() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Search for a sequence that looks like ML-DSA-65 OID or similar and mess it up
        // Or just mess up the middle of the cert where SPKI usually is
        for (i in 100..200) { der[i] = 0x00 }
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED or similar due to malformed SPKI", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeMalformedTbs() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Mess up the start of the TBS SEQUENCE
        der[4] = 0xFF.toByte()
        der[5] = 0xFF.toByte()
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to malformed TBS", issues.any { it.code == "ATTESTATION_FAILED" })
    }
}
