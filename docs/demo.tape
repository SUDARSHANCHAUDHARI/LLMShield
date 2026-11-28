# docs/demo.tape — the README quick start, recorded.
#
# Regenerate with:  vhs docs/demo.tape   (brew install vhs)
# Run it from the repo root: the commands below are relative to it.
#
# Both scans use a mock provider, so the recording needs no API key and costs nothing.
# mock-leaky is a deliberately weak model and must come back critical with exit code 1;
# mock always refuses and must come back secure with exit code 0. If a future change makes
# either verdict differ, the recording is wrong and the code is what to look at.

Output docs/demo.gif

Set Shell zsh
Set FontSize 16
Set Width 1200
Set Height 430
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 25ms

Hide
Type "clear"
Enter
Show

Sleep 1s

Type "pnpm -s dev scan --file examples/system-prompt.txt --provider mock-leaky --format markdown --output reports/demo.md --fail-on high"
Enter
Sleep 6s

Type "echo exit code: $?"
Enter
Sleep 2500ms

Type "pnpm -s dev scan --file examples/system-prompt.txt --provider mock --fail-on high"
Enter
Sleep 6s

Type "echo exit code: $?"
Enter
Sleep 3s
