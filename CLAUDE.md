## Git Commit Rules

- Commit as the user, do NOT add `Co-Authored-By: Claude` or any attribution to Claude
- Use Conventional Commits format: `type: message`
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Message must be in English
- Message must be very short (max 50 characters)
- Use imperative mood

## File Creation Rules

- Any temporary files, scratch scripts, debug outputs, or notes you create for your own use must go into a `.claude/` directory at the project root
- Never commit files from `.claude/` directory
- Never commit files with names like `test_*.py`, `debug_*.py`, `scratch_*.py`, `tmp_*` unless they are part of the actual test suite in `tests/`
- If you need to create a one-off script to test something, put it in `.claude/`
