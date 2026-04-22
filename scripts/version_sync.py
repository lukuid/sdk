#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "VERSION"
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$")

JS_PACKAGE_FILES = sorted((ROOT / "src" / "js").glob("*/package.json"))

TEXT_TARGETS = [
    {
        "path": ROOT / "src" / "rust" / "lukuid-sdk" / "Cargo.toml",
        "pattern": re.compile(r'(?m)^version = "[^"]+"$'),
        "replacement": lambda version: f'version = "{version}"',
        "extract": lambda content, pattern: pattern.search(content).group(0).split('"')[1] if pattern.search(content) else None,
    },
    {
        "path": ROOT / "src" / "python" / "pyproject.toml",
        "pattern": re.compile(r'(?m)^version = "[^"]+"$'),
        "replacement": lambda version: f'version = "{version}"',
        "extract": lambda content, pattern: pattern.search(content).group(0).split('"')[1] if pattern.search(content) else None,
    },
    {
        "path": ROOT / "src" / "android" / "lukuid-sdk" / "build.gradle.kts",
        "pattern": re.compile(r'(?m)^version = \(findProperty\("VERSION_NAME"\) as String\?\) \?: "[^"]+"$'),
        "replacement": lambda version: f'version = (findProperty("VERSION_NAME") as String?) ?: "{version}"',
        "extract": lambda content, pattern: re.search(r'"([^"]+)"$', pattern.search(content).group(0)).group(1) if pattern.search(content) else None,
    },
    {
        "path": ROOT / "LukuIDSDK.podspec",
        "pattern": re.compile(r'(?m)^\s*s\.version\s*=\s*"[^"]+"$'),
        "replacement": lambda version: f'  s.version          = "{version}"',
        "extract": lambda content, pattern: re.search(r'"([^"]+)"', pattern.search(content).group(0)).group(1) if pattern.search(content) else None,
    },
]


def fail(message: str) -> int:
    print(message, file=sys.stderr)
    return 1


def load_version() -> str:
    version = VERSION_FILE.read_text(encoding="utf-8").strip()
    if not SEMVER_RE.match(version):
        raise ValueError(f"VERSION must be semver, got {version!r}")
    return version


def replace_single(pattern: re.Pattern[str], content: str, replacement: str, path: Path) -> str:
    updated, count = pattern.subn(replacement, content, count=1)
    if count != 1:
        raise ValueError(f"Could not update version in {path}")
    return updated


def apply(version: str) -> int:
    if not SEMVER_RE.match(version):
        return fail(f"Refusing to write non-semver version: {version}")

    VERSION_FILE.write_text(f"{version}\n", encoding="utf-8")

    root_package = ROOT / "package.json"
    package_data = json.loads(root_package.read_text(encoding="utf-8"))
    package_data["version"] = version
    root_package.write_text(json.dumps(package_data, indent=2) + "\n", encoding="utf-8")

    for package_json in JS_PACKAGE_FILES:
        package_data = json.loads(package_json.read_text(encoding="utf-8"))
        package_data["version"] = version
        package_data.setdefault("publishConfig", {})
        package_data["publishConfig"]["access"] = "public"
        package_data["publishConfig"]["registry"] = "https://registry.npmjs.org/"
        package_json.write_text(json.dumps(package_data, indent=2) + "\n", encoding="utf-8")

    for target in TEXT_TARGETS:
        path = target["path"]
        pattern = target["pattern"]
        content = path.read_text(encoding="utf-8")
        updated = replace_single(pattern, content, target["replacement"](version), path)
        path.write_text(updated, encoding="utf-8")

    return 0


def check(version: str) -> int:
    if not SEMVER_RE.match(version):
        return fail(f"VERSION must be semver, got {version!r}")

    mismatches: list[str] = []

    root_package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    if root_package.get("version") != version:
        mismatches.append(f"package.json version is {root_package.get('version')!r}")

    for package_json in JS_PACKAGE_FILES:
        package_data = json.loads(package_json.read_text(encoding="utf-8"))
        if package_data.get("version") != version:
            mismatches.append(f"{package_json.relative_to(ROOT)} version is {package_data.get('version')!r}")

    for target in TEXT_TARGETS:
        path = target["path"]
        pattern = target["pattern"]
        match = pattern.search(path.read_text(encoding="utf-8"))
        if match is None:
            mismatches.append(f"{path.relative_to(ROOT)} does not expose a parsable version field")
            continue
        current = target["extract"](path.read_text(encoding="utf-8"), pattern)
        if current != version:
            mismatches.append(f"{path.relative_to(ROOT)} version is {current!r}")

    if mismatches:
        for mismatch in mismatches:
            print(mismatch, file=sys.stderr)
        return 1

    print(f"All SDK platform versions match {version}")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1] not in {"check", "apply"}:
        return fail("Usage: version_sync.py <check|apply> [version]")

    command = argv[1]
    version = argv[2] if len(argv) > 2 else load_version()
    if command == "apply":
        return apply(version)
    return check(version)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
