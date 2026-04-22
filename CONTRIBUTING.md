# Contributing

Thanks for your interest in contributing to the LukuID SDK.

## Scope

This repository contains SDK implementations and shared verification behavior for `.luku` files and LukuID device interaction.

## Please use the correct repository

- Specification issues → [dotluku spec repository](https://github.com/lukuid/dotluku)
- CLI-specific issues → CLI repo
- SDK / bindings / verification behavior → this repo

## Contribution types

Useful contributions include:

- bug fixes
- language binding improvements
- documentation improvements
- test coverage
- verification consistency fixes across SDKs

## Expectations

Changes should preserve:

- deterministic verification behavior
- compatibility with the published `.luku` spec
- explicit trust profile handling
- clear separation between production and non-production trust

## Normative behavior

If a change would alter `.luku` verification semantics, canonicalization, or trust rules, it should be coordinated with the [specification repository](https://github.com/lukuid/dotluku).
