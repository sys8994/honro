# Direct842→new Stage7 synthetic save compatibility

One Stage7 battle, independently built old842 runtime then new runtime, separate temporary Chrome profiles, no App start/user storage. Official App module order with main.js excluded and HONRO_APP_READY never resolved. Old synthetic battle includes a damaged actor and round2/shots3 to ensure nondefault state is preserved; it is not a played-through/user save.

Actual old compactBattleArt JSON is transferred unchanged as a test artifact. Actual new restoreBattleArt must reproduce the FULL old battle with no visual normalization; old inline7BODY vector/viewBox/bounds/reference is retained despite the different pinned current7provider. New recompact must equal old compact data; second restore exact, inputs/project unchanged, storage0.

Existing battles intentionally retain OLD art, including its old boundaries. This does not automatically upgrade old-save artwork, prove migration/Engine.attach compatibility, prove screenshot equality under changed rendering, or constitute full gameplay testing. All50 same-version contracts remain separate historical evidence. Stage3 code/data untouched; no Stage40 or real profile included.

RuntimeEntries independently builds each checkout's real module/project bundle. This narrow workflow does not rerun full Workshop/Game builds already covered by integrationCI. No relaxed checksum, altered codec, forged provider acceptance, or mock restore logic.
