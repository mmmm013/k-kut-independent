#!/bin/bash
#
#  RE-TAG THE CONTACT LINE IN YOUR TRACKS
#  G Putnam Music LLC — Gregory D. Putnam
#
#  WHY THIS EXISTS
#  ---------------
#  521 tracks carry "Contact Greg Putnam @ <your phone>" in the Comment tag.
#  That is where the phone number in the public catalogue CSV came from. It was
#  never typed into the CSV — it was EXPORTED out of the tags. So the CSV can be
#  scrubbed a hundred times and the number comes back on the next export, and it
#  rides along to DISCO and to every distributor delivery.
#
#  This fixes it at the source. Your rule: "I do NOT allow any phone #s. NONE."
#
#  HOW TO USE IT
#  -------------
#  1. Double-click this file. A Terminal window opens.
#  2. It asks for the folder holding your music, then LISTS what it would change
#     and changes nothing. Read that list.
#  3. Run it again and type  yes  when it asks, to write the changes.
#
#  It never deletes a file, never re-encodes audio, and never touches anything
#  but the Comment tag — and only on tracks whose Comment contains the number.
#
set -u

PHONE="309-530-4626"
REPLACEMENT="reachus@gputnammusic.com"

cd "$(dirname "$0")" || exit 1
clear
echo
echo "  RE-TAG THE CONTACT LINE"
echo "  ======================="
echo
echo "  Finds the phone number in your tracks' Comment tag and replaces it"
echo "  with ${REPLACEMENT}."
echo
echo "  Nothing is deleted. No audio is re-encoded. Only the Comment tag."
echo

PY=""
for candidate in python3 /usr/bin/python3 /usr/local/bin/python3 /opt/homebrew/bin/python3; do
  if command -v "$candidate" >/dev/null 2>&1; then PY="$candidate"; break; fi
done
if [ -z "$PY" ]; then
  echo "  Python 3 is not installed."
  echo "  Open Terminal and run:  xcode-select --install"
  echo
  read -r -p "  Press return to close. " _
  exit 1
fi

if ! "$PY" -c "import mutagen" >/dev/null 2>&1; then
  echo "  Installing the tag library (one time, about 10 seconds)..."
  "$PY" -m pip install --user --quiet mutagen 2>/dev/null || {
    echo
    echo "  That did not work. Open Terminal and run:"
    echo "      python3 -m pip install --user mutagen"
    echo
    read -r -p "  Press return to close. " _
    exit 1
  }
  echo "  Done."
  echo
fi

DEFAULT_FOLDER="$HOME/Music"
echo "  Which folder holds the tracks?"
echo "  Press return for:  $DEFAULT_FOLDER"
read -r -p "  Folder: " FOLDER
FOLDER="${FOLDER:-$DEFAULT_FOLDER}"
FOLDER="${FOLDER/#\~/$HOME}"

if [ ! -d "$FOLDER" ]; then
  echo
  echo "  There is no folder at: $FOLDER"
  echo
  read -r -p "  Press return to close. " _
  exit 1
fi

echo
read -r -p "  Type yes to WRITE the changes, or press return to just look: " CONFIRM
echo

MODE="look"
if [ "$CONFIRM" = "yes" ]; then MODE="write"; fi

PHONE="$PHONE" REPLACEMENT="$REPLACEMENT" FOLDER="$FOLDER" MODE="$MODE" "$PY" <<'PYTHON'
import os, sys

phone = os.environ["PHONE"]
replacement = os.environ["REPLACEMENT"]
folder = os.environ["FOLDER"]
write = os.environ["MODE"] == "write"

from mutagen import File as MutagenFile
from mutagen.id3 import COMM

AUDIO = (".mp3", ".m4a", ".mp4", ".aiff", ".aif", ".wav", ".flac", ".m4p")

def fixed(text):
    """The preposition goes with the number: 'Contact X @ <email>' reads wrong."""
    return text.replace(f"@ {phone}", f"at {replacement}").replace(phone, replacement)

looked = touched = failed = 0
changes = []

for root, _dirs, names in os.walk(folder):
    for name in names:
        if not name.lower().endswith(AUDIO):
            continue
        path = os.path.join(root, name)
        looked += 1
        try:
            audio = MutagenFile(path)
            if audio is None or audio.tags is None:
                continue

            # MP3 / AIFF / WAV carry ID3 COMM frames. M4A carries a single
            # '\xa9cmt'. FLAC and Ogg carry a plain 'comment' list.
            hit = False
            if hasattr(audio.tags, "getall"):
                for frame in audio.tags.getall("COMM"):
                    joined = "".join(frame.text)
                    if phone in joined:
                        frame.text = [fixed(t) for t in frame.text]
                        hit = True
            else:
                for key in ("\xa9cmt", "comment", "COMMENT", "Comment"):
                    if key in audio.tags:
                        values = audio.tags[key]
                        if any(phone in str(v) for v in values):
                            audio.tags[key] = [fixed(str(v)) for v in values]
                            hit = True

            if not hit:
                continue

            changes.append(path)
            if write:
                audio.save()
                touched += 1
        except Exception as problem:            # a tag we cannot read is skipped,
            failed += 1                          # never half-written
            if failed <= 5:
                print(f"    skipped (could not read): {os.path.basename(path)} — {problem}")

print()
print(f"    audio files looked at .... {looked}")
print(f"    carrying the number ...... {len(changes)}")
print(f"    skipped, unreadable ...... {failed}")
if write:
    print(f"    RE-TAGGED ................ {touched}")
else:
    print(f"    re-tagged ................ 0   (nothing written — this was a look)")
print()

if changes and not write:
    print("    The first few that would change:")
    for path in changes[:10]:
        print(f"      {os.path.basename(path)}")
    if len(changes) > 10:
        print(f"      ... and {len(changes) - 10} more")
    print()
    print("    Run this again and type  yes  to write them.")
elif write and touched:
    print("    Done. Re-export your catalogue so the CSV picks up the new tags,")
    print("    and re-deliver to DISCO so the old contact line stops travelling.")
elif not changes:
    print("    Nothing here carries the number. If your library lives somewhere")
    print("    else, run this again and give that folder instead.")
print()
PYTHON

echo
read -r -p "  Press return to close this window. " _
