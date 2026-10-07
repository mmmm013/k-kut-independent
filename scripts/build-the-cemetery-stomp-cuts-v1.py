import json, os, sys

MODE = sys.argv[1] if len(sys.argv) > 1 else 'full'   # still | dance | full

W = os.environ.get("CUT_WORKDIR", ".")   # holds lyr/specs.json and takes fc_<mode>.txt
specs = json.load(open(os.path.join(W, "lyr/specs.json")))

# --- GD: "AFTER 1ST CH, V2 SHOWS LYRICS TOO SOON AND LEAVES TOO EARLY. JUST THAT ONE SEEMS OFF."
# Display-side correction only; the committed alignment evidence is not touched.
# src-120388421 word timings for line 17 ("Well the trolls 2-step like they're in a trance."):
#   well 55.61-56.34 ALIGNED, the 56.35-57.22 ALIGNED, then a rest with no measured voice,
#   trolls 59.21-60.84 PLACED_WHERE_NO_VOICE_WAS_MEASURED, step 60.85-61.77 MOSTLY_OUTSIDE,
#   like..trance 61.78-63.27 ALIGNED.  share_in_measured_vocal = 0.399 -- the card was on screen
#   through 4.6s with no voice under it, which is the "too soon".
# Line 18's own body does not start until 'ghouls' 65.47; 'the' 63.28-64.48 is just its pickup.
# So hold line 17 to 64.48 and bring line 18 in at 64.49 -- still ahead of its first real word.
V2_FIX = {10: (57.20, 64.48), 11: (64.49, 72.01)}
for i, (s, e) in V2_FIX.items():
    specs[i]["start"], specs[i]["end"] = s, e

BEAT = 60/82.0
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
END = 126.27          # end card in
PK_IN, PK_OUT = 6.0, 126.0

p = []
# background: his artwork, drifting + breathing on the beat
p.append("[1:v]scale=1500:1500[art]")
if MODE == "still":
    p.append("[art]crop=1280:720:x=(1500-1280)/2:y=(1500-720)/2,eq=brightness=-0.05[bg]")
else:
    p.append("[art]crop=1280:720:x='((1500-1280)/2)+sin(t/7)*70':"
             "y='((1500-720)/2)+cos(t/9)*40-abs(sin(PI*t/%.6f))*26',eq=brightness=-0.05[bg]" % BEAT)

# bats in the distance
bats = [(0.50, 150, 5700, 80, 38), (0.38, 118, 6136, 160, 52),
        (0.62, 175, 5250, 20, 30), (0.44, 132, 8448, 210, 64)]
prev = "bg"
for i, (sc, spd, off, y0, ph) in enumerate(bats if MODE == 'full' else []):
    p.append("[2:v]scale=iw*%.2f:-1[b%ds]" % (sc, i))
    p.append("[%s][b%ds]overlay=x='1340-mod(t*%d+%d,1480)':y='%d+sin(t*1.7+%d)*26':eval=frame[bo%d]"
             % (prev, i, spd, off, y0, ph, i))
    prev = "bo%d" % i

# witch crossing away from the viewer, twice
witch = [(14, 34, 0.42, 250, 130), (92, 114, 0.34, 230, 125)]
for i, (t0, t1, sc, y0, rise) in enumerate(witch if MODE == 'full' else []):
    p.append("[3:v]scale=iw*%.2f:-1[w%ds]" % (sc, i))
    p.append("[%s][w%ds]overlay=x='1320-((t-%d)/%d)*1560':y='%d+((t-%d)/%d)*(-%d)+sin(t*1.2)*12':"
             "eval=frame:enable='between(t,%d,%d)'[wo%d]"
             % (prev, i, t0, t1-t0, y0, t0, t1-t0, rise, t0, t1, i))
    prev = "wo%d" % i

# the jack-o-lantern: wanders across the ground line, hops on the beat, wobbles as it goes
if MODE == "full":
    p.append("[4:v]scale=iw*0.42:-1,rotate=a='sin(t*0.9)*0.22':c=none:ow=rotw(iw):oh=roth(ih)[pks]")
    p.append("[%s][pks]overlay=x='540+sin(t*0.37)*430':"
             "y='408-abs(sin(PI*t/%.6f))*46':eval=frame:enable='between(t,%.2f,%.2f)'[pko]"
             % (prev, BEAT, PK_IN, PK_OUT))
    prev = "pko"

# lyric band
p.append("[%s]drawbox=x=0:y=520:w=1280:h=200:color=black@0.55:t=fill[band]" % prev)
prev = "band"

for i, sp in enumerate(specs):
    y = 540 if sp["nlines"] == 2 else 560
    p.append("[%s]drawtext=fontfile=%s:textfile=%s:fontcolor=white:fontsize=40:line_spacing=10:"
             "borderw=3:bordercolor=black@0.9:x=(w-text_w)/2:y=%d:enable='between(t,%s,%s)'[t%d]"
             % (prev, FONT, sp["file"], y, sp["start"], sp["end"], i))
    prev = "t%d" % i


def dt(text, color, size, y, enable, bw=3):
    global prev
    tag = "x%d" % dt.n
    dt.n += 1
    p.append("[%s]drawtext=fontfile=%s:text='%s':fontcolor=%s:fontsize=%d:borderw=%d:"
             "bordercolor=black:x=(w-text_w)/2:y=%d:enable='%s'[%s]"
             % (prev, FONT, text, color, size, bw, y, enable, tag))
    prev = tag
dt.n = 0

AMBER = "0xFFC107"
dt("THE CEMETERY STOMP", AMBER, 62, 70, "between(t,0,4.5)", 4)
# opening credit, after the title card clears
dt("Written & Composed by Erik W. Nelson & Gregory D. Putnam", "white", 30, 70, "between(t,4.9,10.6)")
dt("Recorded at Eclipse Studios, Normal, IL, USA", "white", 28, 112, "between(t,4.9,10.6)")

# end card
e = "gte(t,%s)" % END
dt("G Putnam Music", AMBER, 56, 206, e, 4)
dt("Timber Ridge Drive Studios", "white", 40, 282, e)
dt("Written & Composed by", "white", 28, 356, e)
dt("Erik W. Nelson & Gregory D. Putnam", AMBER, 36, 394, e)
dt("Recorded at Eclipse Studios, Normal, IL, USA", "white", 30, 452, e)

p[-1] = p[-1].rsplit("[", 1)[0] + "[vout]"
open(os.path.join(W, "fc_%s.txt" % MODE), "w").write(";".join(p))
print("fc_%s.txt written," % MODE, len(p), "filter steps")
print("V2 cards now:", [(specs[i]["start"], specs[i]["end"]) for i in (9, 10, 11, 12)])
