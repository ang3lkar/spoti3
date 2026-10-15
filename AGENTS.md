# Agent Instructions

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Creating a Release

1. **Pick the bump type** (patch/minor/major, semver) from the commits since the last release.
2. **List changes since the last release bump**, including anything never recorded in CHANGELOG.md (check the existing CHANGELOG for what is already covered):
   ```bash
   git log --format='%h %ad %s' --date=short $(git log -1 --format=%h --grep='chore(release): Bump version')..HEAD
   ```
3. **Run quality gates first**: `npm test` and `npm run lint`. Lint may have pre-existing failures; don't block on unrelated ones, but report them.
4. **Bump the version** (updates package.json and package-lock.json only; no commit or tag):
   ```bash
   npm version <patch|minor|major> --no-git-tag-version
   ```
5. **Update CHANGELOG.md**: add a `## [X.Y.Z] - YYYY-MM-DD` section above the previous one, using `### Added / Changed / Fixed / Removed`.
   - One terse bullet per user-visible change; skip chore/refactor-only commits.
   - If something was added and later removed within the range, list only the net result.
   - Never edit older sections.
6. **Commit and push** package.json, package-lock.json and CHANGELOG.md in one commit:
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): Bump version to X.Y.Z"
   git pull --rebase && git push
   git status  # MUST show "up to date with origin"
   ```
7. **No tags or GitHub releases**: this repo has none; only create them if explicitly asked.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Run quality gates** (if code changed) - Tests, linters, builds
2. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
3. **Clean up** - Clear stashes, prune remote branches
4. **Verify** - All changes committed AND pushed
5. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
