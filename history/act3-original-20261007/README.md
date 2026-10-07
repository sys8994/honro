# Original Act 3 source history

This Git bundle preserves the original source graph through `ce88ec0f42a8e0738b1df452b51699b97298bee0` without rewriting or combining commits. It includes all 127 listed source checkpoints and 238 commits after the public prerequisite. The original intermediate Workshop HTML (25,841,628 bytes) is included unchanged.

The live release is `2867f53f23702006d6170b09c5941298b5747b19`. Its tree is identical to the final original source tree `417fdeeadb00cc2660efc34475f0db90eb0685a8`. Some earlier commits are also saved directly on the working branch with API-generated commit metadata; the bundle retains the original Git identities.

## Integrity

- Bundle bytes: 10671383
- SHA-256: `a6f6c99dc66e33cf165f31553de6d83f73e263945273923e95109a58498578eb`
- Required public ancestor: `c0235043cc712290e672375cd0b36bbdc73f911d`
- Verification: a fresh bare repository fetched only that ancestor, then imported this bundle and verified every listed commit, the final tree, and the oversized intermediate HTML.

## Restore into a clone of sys8994/honro

Download the bundle beside these instructions, then run:

```sh
git fetch origin c0235043cc712290e672375cd0b36bbdc73f911d
git bundle verify HONRO_Act3_Original_History.bundle
git fetch ./HONRO_Act3_Original_History.bundle refs/heads/archive/act3-original-history-20261007:refs/heads/recovered-act3-original-20261007
```

The commands add a recovery branch; they do not change the current checkout or rewrite the deployed branch.
