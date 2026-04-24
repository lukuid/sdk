# SPDX-License-Identifier: Apache-2.0
import unittest
from lukuid_sdk.luku import LukuFile

class TestSelfTest(unittest.TestCase):
    def test_sdk_self_test(self):
        results = LukuFile.self_test()
        self.assertGreaterEqual(len(results), 4)
        for result in results:
            print(f"{result.alg} {result.operation}\t{'PASS' if result.passed else 'FAIL'}\t{result.id}")
            self.assertTrue(result.passed, f"Self-test failed for {result.alg} {result.operation}")

if __name__ == "__main__":
    unittest.main()
