"""Every device-signed record binds the firmware that signed it (dotluku "Firmware Binding").

The samples are real exports from the test-PKI Environment card and Animal Reader.
"""
import unittest
from pathlib import Path

from lukuid_sdk.luku import Criticality, LukuFile, LukuVerifyOptions

SAMPLES_DIR = Path(__file__).resolve().parents[3] / "samples" / "dotluku" / "test" / "1.1.0"
SAMPLES = ["firmware-bound-environment.luku", "firmware-bound-reader.luku"]
# Index of `firmware` in each type's canonical string, and whether it lives in `payload`.
SLOT = {
    "scan": (9, True),
    "environment": (7, True),
    "attachment": (7, False),
    "custody": (7, False),
    "location": (6, False),
}


def holder(record):
    return record["payload"] if SLOT[record["type"]][1] else record


def set_slot(record, value):
    parts = record["canonical_string"].split(":")
    index = SLOT[record["type"]][0]
    if value is None:
        del parts[index]
    else:
        parts[index] = value
    record["canonical_string"] = ":".join(parts)


class FirmwareBindingTests(unittest.TestCase):
    def open(self, name):
        return LukuFile.open_bytes((SAMPLES_DIR / name).read_bytes())

    def critical_codes(self, luku):
        issues = luku.verify(LukuVerifyOptions(trust_profile="test"))
        return [issue.code for issue in issues if issue.criticality == Criticality.CRITICAL]

    def tampered(self, name, index, edit):
        luku = self.open(name)
        edit(luku.blocks[0].batch[index])
        return self.critical_codes(luku)

    def test_samples_verify(self):
        for name in SAMPLES:
            self.assertEqual(self.critical_codes(self.open(name)), [], name)

    def test_every_record_signs_its_firmware_in_the_prefix(self):
        seen = []
        for name in SAMPLES:
            for record in self.open(name).blocks[0].batch:
                index = SLOT[record["type"]][0]
                self.assertEqual(holder(record)["firmware"], "v1.0.0", (name, record["type"]))
                self.assertEqual(record["canonical_string"].split(":")[index], "v1.0.0", (name, record["type"]))
                seen.append(record["type"])
        self.assertEqual(sorted(seen), ["attachment", "attachment", "custody", "custody", "environment", "location", "location", "scan"])

    def test_changed_or_removed_firmware_field_is_a_canonical_mismatch(self):
        for name in SAMPLES:
            for index in range(4):
                codes = self.tampered(name, index, lambda r: holder(r).__setitem__("firmware", "v9.9.9"))
                self.assertIn("RECORD_CANONICAL_MISMATCH", codes, (name, index))
                self.assertNotIn("RECORD_SIGNATURE_INVALID", codes, (name, index))
                codes = self.tampered(name, index, lambda r: holder(r).pop("firmware"))
                self.assertIn("RECORD_CANONICAL_MISMATCH", codes, (name, index, "removed"))

    def test_firmware_changed_in_the_signed_string_fails_the_signature(self):
        def edit(record):
            holder(record)["firmware"] = "v9.9.9"
            set_slot(record, "v9.9.9")

        for name in SAMPLES:
            for index in range(4):
                codes = self.tampered(name, index, edit)
                self.assertIn("RECORD_SIGNATURE_INVALID", codes, (name, index))
                self.assertNotIn("RECORD_CANONICAL_MISMATCH", codes, (name, index))

    def test_firmware_bound_record_cannot_pass_as_one_from_before_the_rule(self):
        def edit(record):
            holder(record).pop("firmware")
            set_slot(record, None)

        for name in SAMPLES:
            for index in range(4):
                if self.open(name).blocks[0].batch[index]["type"] == "scan":
                    continue  # scan has always had the slot
                codes = self.tampered(name, index, edit)
                self.assertIn("RECORD_SIGNATURE_INVALID", codes, (name, index))
                self.assertNotIn("RECORD_CANONICAL_MISMATCH", codes, (name, index))

    def test_records_from_before_firmware_binding_verify_with_a_warning(self):
        issues = self.open("first-passable-verification-sample.luku").verify(LukuVerifyOptions(trust_profile="test"))
        self.assertFalse([i for i in issues if i.criticality == Criticality.CRITICAL])
        warned = [i for i in issues if i.code == "RECORD_FIRMWARE_MISSING"]
        self.assertTrue(warned)
        self.assertTrue(all(i.criticality == Criticality.WARNING for i in warned))
        for name in SAMPLES:
            issues = self.open(name).verify(LukuVerifyOptions(trust_profile="test"))
            self.assertFalse([i for i in issues if i.code == "RECORD_FIRMWARE_MISSING"], name)

    def test_stripped_firmware_is_flagged_as_missing(self):
        for name in SAMPLES:
            for index in range(4):
                luku = self.open(name)
                holder(luku.blocks[0].batch[index]).pop("firmware")
                issues = luku.verify(LukuVerifyOptions(trust_profile="test"))
                self.assertTrue(any(i.code == "RECORD_FIRMWARE_MISSING" for i in issues), (name, index))


if __name__ == "__main__":
    unittest.main()
