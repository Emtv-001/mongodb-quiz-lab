# Curriculum question seed

The complete seed contains 800 questions: ten for each of 20 topics at Easy, Medium, Hard, and Expert difficulty. The final 690 questions were authored locally as parameterized practice cases; no model calls are needed to validate or save the seed. Three credential-bearing connection examples in the initial 110 questions were replaced with credential-free questions.

Validate locally:

```sh
node scripts/seed-question-bank.mjs
node --test tests/secret-hygiene.test.mjs
```

Append missing questions and apply the three corrected entries:

```sh
node scripts/seed-question-bank.mjs --write
```

This command never calls an AI provider. It uses append updates, preserves existing IDs, and verifies all saved seed questions and all 80 topic/difficulty groups. The verification JSON records the actual database results.

For local authoring provenance, see `scripts/author-curriculum-questions.mjs`. Secret-pattern checks print only file locations, never credential values. The local pre-push hook checks committed content; enable it on a new checkout with `git config core.hooksPath .githooks`.

Removing unsafe examples from current files does not remove them from previous Git commits. Any actual exposed credential must be revoked or rotated; history cleanup is a separate operation.
