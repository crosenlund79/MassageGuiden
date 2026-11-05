"""Builds src/content/demonstrations.json – hand-position demonstrations.

Hand placement, finger orientation and arrow directions are read from the
photographs in ReferenceImages/ (page/step noted in the techniques data) and
redrawn as original illustrations. Instruction texts paraphrase the caption
plus what the photo shows. Anything not clearly visible is listed in `review`.

Coordinates are in the 400x1000 figure space of src/anatomy/figure2d.ts
(posterior view: viewer's left = client's left side; anterior view: viewer's
left = client's right side). Therapist at the head end of a supine client: the therapist's RIGHT hand is on the
viewer's LEFT (client's right). Prone client: therapist's right hand on the viewer's left too.
rot = direction the fingers point (0 = towards the
head on the drawing, 90 = to the viewer's right, 180 = towards the feet).
Run: python3 scripts/build-demos.py
"""
import json, os

def H(side, pose, x, y, rot, role='active', scale=None):
    h = {'side': side, 'pose': pose, 'at': [x, y], 'rot': rot, 'role': role}
    if scale: h['scale'] = scale
    return h
def L(x1, y1, x2, y2, double=False, bend=0, dashed=False, label=None):
    a = {'kind': 'line', 'from': [x1, y1], 'to': [x2, y2]}
    if double: a['double'] = True
    if bend: a['bend'] = bend
    if dashed: a['dashed'] = True
    if label: a['label'] = label
    return a
def C(x, y, r, ccw=False):
    a = {'kind': 'circle', 'at': [x, y], 'r': r}
    if ccw: a['ccw'] = True
    return a
def P(x, y, angle=180):
    return {'kind': 'press', 'at': [x, y], 'angle': angle}
def F(text, hands, arrows, marks=None):
    f = {'text': text, 'hands': hands, 'arrows': arrows}
    if marks: f['marks'] = [{'at': [x, y], 'label': l} for (x, y, l) in marks]
    return f
def post(frame, focus=()): return {'kind': 'figure', 'view': 'posterior', 'frame': frame, 'focus': list(focus)}
def ant(frame, focus=()): return {'kind': 'figure', 'view': 'anterior', 'frame': frame, 'focus': list(focus)}
def hand(surface): return {'kind': 'hand', 'surface': surface, 'frame': [-95, -80, 190, 150]}

DEMOS = []
def D(tid, stage, frames, support='foto', review=(), therapist=None, clientPose=None):
    d = {'techniqueId': tid, 'stage': stage, 'frames': frames, 'support': support, 'review': list(review)}
    if therapist: d['therapist'] = therapist
    if clientPose: d['clientPose'] = clientPose
    DEMOS.append(d)

# =====================================================================
# BEN – bagside (s. 3–4). Posterior view, client's left leg (viewer's left).
# =====================================================================
LEG_B = [60, 530, 280, 220]
CALF = [60, 680, 280, 220]
D('ben-1', post([50, 520, 300, 360], ['biceps-femoris', 'semitendinosus']), [
  F('Hånden ligger fladt på benets bagside med fingrene pegende mod ballen. Stryg med hele håndfladen op ad benet mod ballen.',
    [H('R', 'flat', 162, 640, 0)], [L(194, 840, 194, 570)])])

D('ben-2', post(CALF, ['gastrocnemius', 'soleus']), [
  F('Begge hænder griber om lægmusklen – tommelfingeren på den ene side, fingrene på den anden – og løfter musklen.',
    [H('R', 'grip', 160, 742, 72), H('L', 'grip', 160, 806, 108)], [L(205, 720, 205, 845, double=True)])],
  support='delvis',
  review=['Håndstillingen er tolket ud fra fotoet. ”Skiftevis” stammer fra en håndskreven note; dobbeltpilen langs læggen står på fotoet.'])

D('ben-3', post([60, 660, 280, 300], ['gastrocnemius']), [
  F('Den ene hånd holder om anklen. Tommelfingeren arbejder fra anklen op langs lægmusklens inderside (medialt) til over knæet.',
    [H('R', 'thumb', 180, 830, 0), H('L', 'grip', 168, 905, 90, 'support')], [L(190, 875, 190, 690)]),
  F('Gentag på lægmusklens yderside (lateralt) – igen fra anklen op til over knæet.',
    [H('R', 'thumb', 148, 830, 0), H('L', 'grip', 168, 905, 90, 'support')], [L(136, 875, 136, 690)])])

D('ben-4', post([80, 830, 200, 150], ['tendo-calcaneus']), [
  F('Den ene hånd holder om hælen. Den anden hånd griber akillessenen mellem tommel- og fingre og ælter den.',
    [H('R', 'pinch', 170, 897, 64), H('L', 'flat', 172, 952, 180, 'support')], [])],
  support='delvis', review=['Fotoet viser ingen bevægelsesretning for æltningen.'])

D('ben-5', post(CALF, ['gastrocnemius']), [
  F('Begge tommelfingre placeres midt på lægmusklen. De arbejder frem og tilbage i pilens retning for at skille musklen.',
    [H('L', 'thumb', 158, 768, 0), H('R', 'thumb', 170, 768, 0)], [L(140, 805, 190, 770, double=True)])],
  support='delvis', review=['Tommelfingrenes præcise placering er kun delvist synlig i fotoet. Håndskrevet: ”Bevæger vævet”.'])

D('ben-6', post(LEG_B, ['biceps-femoris', 'semitendinosus', 'semimembranosus']), [
  F('Start lige under knæet. Tommelfingeren arbejder op langs hasemusklerne til sædebensknuden (tuber ischii); fingrene hviler om lårets yderside.',
    [H('R', 'thumb', 166, 655, 0)], [L(182, 712, 182, 552)])])

D('ben-7', post(LEG_B, ['biceps-femoris', 'semitendinosus', 'semimembranosus']), [
  F('Begge tommelfingre midt på lårets bagside. Arbejd frem og tilbage på tværs for at skille hasemusklerne fra hinanden.',
    [H('L', 'thumb', 158, 625, 0), H('R', 'thumb', 170, 625, 0)], [L(136, 662, 194, 640, double=True)])])

D('ben-8', post([70, 440, 260, 200], ['gluteus-maximus']), [
  F('Knoerne placeres ved sædebensknuden (tuber ischii) i ballefolden og laver friktioner op mod ballen.',
    [H('R', 'fist', 178, 552, -15)], [L(140, 600, 140, 540)])])

D('ben-9', post([70, 400, 260, 200], ['gluteus-maximus']), [
  F('Tommelfingeren laver friktioner på m. gluteus maximus; den anden hånd hviler på lænden.',
    [H('R', 'thumb', 165, 500, 15), H('L', 'flat', 215, 430, 90, 'support')], [C(165, 500, 12)]),
  F('Fortsæt derefter med knofriktioner på samme område.',
    [H('R', 'fist', 165, 500, 15), H('L', 'flat', 215, 430, 90, 'support')], [C(165, 500, 14)])],
  support='delvis', review=['Cirklen er tegnet med hånd på kildens foto; cirklernes retning er ikke angivet.'])

D('ben-10', post([50, 440, 300, 330], ['biceps-femoris', 'semitendinosus']), [
  F('Afslut med lange strygninger med flad hånd over benets bagside.',
    [H('R', 'flat', 162, 600, 0)], [L(194, 720, 194, 545)])],
  support='delvis', review=['Pilens retning i fotoet er ikke entydig – vist som strygning op mod ballen ligesom trin 1.'])

# =====================================================================
# BEN – forside (s. 6–8). Anterior view, client's right leg (viewer's left).
# =====================================================================
SHIN = [80, 680, 240, 240]
THIGH = [80, 440, 240, 290]
D('ben-15', ant(SHIN, ['tibialis-anterior']), [
  F('Begge hænder omslutter underbenet. Tommelfingeren arbejder fra anklen op langs ydersiden af skinnebenet mod knæet – stop før knæleddet.',
    [H('R', 'thumb', 152, 805, 0), H('L', 'flat', 182, 812, 0, 'support')], [L(140, 870, 140, 728)])],
  therapist='Ved fodenden.', clientPose='Knæet er bøjet med foden på briksen (tegningen viser benet strakt).')

D('ben-16', ant(SHIN), [
  F('Forsigtige friktioner med fingrene langs skinnebenet op mod knæet – især ved tuberositas tibiae (knoglefremspringet lige under knæskallen).',
    [H('R', 'tips', 170, 770, 0)], [L(186, 860, 186, 720)], marks=[(166, 712, '!')])],
  therapist='Ved fodenden.', clientPose='Knæet er bøjet med foden på briksen (tegningen viser benet strakt).',
  support='delvis', review=['Billedteksten siger ikke, hvilken del af hånden der bruges; fotoet viser fingrene langs skinnebenet.'])

D('ben-17', ant(THIGH, ['vastus-medialis', 'vastus-lateralis']), [
  F('Tommelfingeren arbejder fra knæet op langs m. vastus medialis på lårets inderside.',
    [H('R', 'thumb', 180, 652, 0)], [L(192, 690, 192, 540)]),
  F('Derefter samme bevægelse op langs m. vastus lateralis på lårets yderside.',
    [H('R', 'thumb', 136, 615, 0)], [L(122, 680, 122, 520)])],
  support='delvis', review=['Håndskrevet på siden: ”Tommel”, ”3 baner” – betydningen (tre baner på hver muskel?) bør bekræftes.'])

D('ben-18', ant(THIGH, ['rectus-femoris']), [
  F('Knoerne arbejder op langs m. rectus femoris midt på lårets forside mod hoften. Den anden hånd hviler ved knæet.',
    [H('R', 'fist', 160, 585, 25), H('L', 'flat', 176, 672, -10, 'support')], [L(190, 650, 190, 490)])],
  support='delvis', review=['Håndskrevet: ”Kno”, ”3 baner” – bør bekræftes.'])

D('ben-19', ant(THIGH, ['sartorius']), [
  F('Den ene hånd stabiliserer knæet. Tommelfingeren følger m. sartorius fra knæets inderside skråt op mod hoften.',
    [H('R', 'thumb', 183, 640, -8), H('L', 'flat', 160, 676, 0, 'support')], [L(196, 690, 154, 465, bend=6)])],
  clientPose='Knæet er bøjet (fotoet); håndskrevet: ”Bukke ind mod mig”. Tegningen viser benet strakt.')

D('ben-20', ant(THIGH, ['gracilis']), [
  F('Tommelfingeren arbejder op langs m. gracilis på lårets inderside mod lysken.',
    [H('R', 'thumb', 192, 625, 0)], [L(186, 692, 186, 520)])],
  clientPose='Benet er bøjet og ført lidt ud (fotoet). Håndskrevet: ”løft benet”. Tegningen viser benet strakt.')

D('ben-21', ant(THIGH, ['adductores']), [
  F('Knoerne arbejder med friktioner langs adduktorerne på lårets inderside, med tryk ned mod briksen. Den anden hånd støtter ved knæet.',
    [H('R', 'fist', 184, 560, 0), H('L', 'flat', 140, 672, 0, 'support')], [P(184, 560)])],
  support='delvis', review=['Pilen i fotoet peger nedad mod briksen (tryk); bevægelsesretningen langs musklen er ikke vist.'])

D('ben-22', ant(THIGH, ['tractus-iliotibialis']), [
  F('Knoerne arbejder ned langs tractus iliotibialis på lårets yderside, fra hoften mod knæet. Den anden hånd hviler på låret.',
    [H('R', 'fist', 132, 560, 180), H('L', 'flat', 168, 560, 180, 'support')], [L(110, 520, 112, 680)])])

D('ben-23', ant(THIGH, ['tractus-iliotibialis']), [
  F('Fingerspidserne arbejder langs den nederste del af tractus iliotibialis ned mod knæet.',
    [H('R', 'tips', 134, 650, 180)], [L(112, 610, 114, 690)])],
  review=['Håndskrevet: ”vend mod patienten”.'])

D('ben-24', ant([50, 430, 300, 480]), [
  F('Afslut med lange strygninger med flade hænder over hele benet.',
    [H('R', 'flat', 160, 600, 0)], [L(194, 880, 194, 480, double=True, dashed=True)])],
  support='delvis', review=['Billedteksten angiver ikke retning, og fotoet har ingen pil. Den stiplede dobbeltpil viser kun området.'])

# =====================================================================
# RYG, NAKKE OG SKULDRE (s. 10–15). Posterior view.
# =====================================================================
BACK = [50, 120, 300, 370]
NECK = [90, 60, 220, 180]
SCAP = [70, 120, 240, 200]
LUMB = [70, 340, 260, 200]
D('ryg-1', post(BACK), [
  F('Stå ved hovedenden. Begge hænder ligger fladt på hver side af rygsøjlen med fingrene mod fødderne. Stryg op og ned over hele ryggen.',
    [H('R', 'flat', 168, 245, 180), H('L', 'flat', 232, 245, 180)], [L(130, 200, 130, 450, double=True), L(270, 200, 270, 450, double=True)])],
  therapist='Ved hovedenden.')

D('ryg-2', post(NECK, ['trapezius']), [
  F('Den ene hånd griber om den øvre del af m. trapezius og ælter frem og tilbage; den anden hånd hviler på skulderbladet.',
    [H('R', 'grip', 150, 164, -100), H('L', 'flat', 165, 228, 200, 'support')], [L(150, 128, 166, 182, double=True)])],
  therapist='Stå på modsatte side af briksen.', support='delvis',
  review=['Grebets præcise fingerstilling (tommelfinger bag, fingre over skulderen) er tolket ud fra fotoet.'])

D('ryg-3', post(NECK, ['levator-scapulae']), [
  F('Fingerspidserne laver små friktioner over m. levator scapulae, mellem nakken og skulderbladets øvre, indre hjørne.',
    [H('R', 'tips', 172, 172, -100)], [L(162, 160, 180, 190, double=True)])],
  therapist='Stå på modsatte side af briksen.', support='delvis',
  review=['Den anden hånd ses ikke i fotoet. Musklens placering er tegnet efter standardanatomi.'])

D('ryg-4a', post(NECK, ['trapezius']), [
  F('Fingrene arbejder frem og tilbage langs den øvre kant af m. trapezius, fra nakken ud mod skulderen. Den anden hånd hviler på skulderen.',
    [H('R', 'tips', 160, 160, 210), H('L', 'flat', 118, 198, 200, 'support')], [L(184, 142, 132, 170, double=True)])],
  therapist='Stå ved hovedenden.', review=['Håndskrevet: ”frem og tilbage v. hovedets side”.'])

D('ryg-4b', post(SCAP, ['trapezius']), [
  F('Massage langs skulderbladets øvre kant. Fotoet viser begge hænder fladt over skulderbladet.',
    [H('R', 'tips', 158, 198, 80), H('L', 'flat', 165, 245, 80, 'support')], [L(182, 210, 134, 194, double=True, dashed=True)])],
  support='delvis',
  review=['Kilden angiver hverken håndstilling eller retning; den stiplede pil viser kun området. Håndskrevet: ”og m. knoer”.'])

D('ryg-5', post(SCAP), [
  F('Med klientens arm liggende på ryggen løfter skulderbladets inderkant sig. Tommelfingrene laver friktioner langs inderkanten i pilens retning, mod kanten.',
    [H('R', 'thumb', 178, 236, -90), H('L', 'flat', 122, 190, 0, 'support')], [L(196, 236, 170, 236)])],
  therapist='Stå ved hovedenden (fotoet).',
  clientPose='Klientens arm ligger på ryggen med hånden ved lænden (tegningen viser armen langs siden). Håndskrevet: ”PUDE”.',
  support='delvis', review=['Tommelfingrenes præcise stilling er kun delvist synlig; pilen i fotoet peger mod skulderbladets kant.'])

D('ryg-6', post(SCAP), [
  F('Knoerne arbejder ned langs skulderbladets inderste kant.',
    [H('R', 'fist', 176, 215, 180)], [L(190, 205, 182, 285)])],
  therapist='Stå ved hovedenden.')

D('ryg-7', post(SCAP, ['trapezius']), [
  F('Knoerne arbejder fra skulderen indad mod nakken og rygsøjlen.',
    [H('R', 'fist', 150, 182, 70)], [L(132, 196, 186, 210), L(130, 180, 178, 152)])],
  support='delvis', review=['Håndskrevet: ”håndrod imellem, lille bevægelse” (usikker læsning).'])

D('ryg-8', post(SCAP, ['infraspinatus']), [
  F('Håndroden placeres på skulderbladet og laver cirkulære friktioner. Den anden hånd hviler på ryggen.',
    [H('R', 'heel', 148, 232, 160), H('L', 'flat', 236, 248, 180, 'support')], [C(148, 232, 16)])],
  review=['Håndskrevet: ”over knoklen”, ”stå oppe” (usikker læsning).'])

D('ryg-9', post(SCAP, ['infraspinatus']), [
  F('Tommelfingeren laver friktioner på m. infraspinatus under skulderbladskammen; fingrene hviler om skulderen. Herefter lægges armen op over hovedet.',
    [H('R', 'thumb', 146, 238, 200), H('L', 'flat', 192, 262, 180, 'support')], [C(146, 238, 10)])],
  therapist='Stå ved hovedenden (fotoet).', support='delvis',
  review=['Friktionernes retning er ikke angivet; cirklen markerer kun friktion på stedet.'])

D('ryg-10', post(SCAP, ['triceps-brachii', 'teres-major']), [
  F('Knoerne arbejder langs udspringet af m. triceps brachii på ydersiden af armhulen, i pilens retning op mod armhulen.',
    [H('R', 'fist', 128, 255, -45), H('L', 'flat', 196, 286, 180, 'support')], [L(150, 285, 118, 236)])],
  clientPose='Armen ligger op over hovedet (tegningen viser armen langs siden).',
  support='delvis', review=['Håndskrevet: ”glat hånd over scapula” (usikker læsning).'])

D('ryg-11', post(SCAP, ['teres-major', 'infraspinatus']), [
  F('Tommelfingeren arbejder langs skulderbladets yderste kant; den anden hånd holder om skulderen.',
    [H('R', 'thumb', 148, 254, -30), H('L', 'flat', 112, 200, 0, 'support')], [L(166, 286, 134, 220, double=True, dashed=True)])],
  support='delvis', review=['Retningen langs kanten er ikke entydig i fotoet; den stiplede dobbeltpil viser kun forløbet.'])

D('ryg-12', post(NECK, ['trapezius']), [
  F('Hånden griber om nakken med tommelfingeren på den ene side og fingrene på den anden og ælter frem og tilbage.',
    [H('R', 'grip', 200, 140, 43)], [L(172, 168, 228, 168, double=True)])],
  therapist='Stå på siden af briksen.', support='delvis',
  review=['Den anden hånds placering er ikke tydelig i fotoet. Håndskrevet: ”frem og tilbage, ’vippe’”.'])

D('ryg-13', post([100, 20, 200, 220], ['suboccipitales', 'trapezius']), [
  F('Hænderne ligger på skuldrene og trækker skuldrene tilbage mod hovedenden.',
    [H('R', 'flat', 150, 186, 180), H('L', 'flat', 250, 186, 180)], [L(124, 220, 124, 172), L(276, 220, 276, 172)]),
  F('Fingerspidserne trykker derefter langs kraniekanten over den suboccipitale muskulatur.',
    [H('R', 'tips', 188, 114, 180), H('L', 'tips', 212, 114, 180)], [L(178, 142, 184, 118), L(222, 142, 216, 118)])],
  therapist='Stå ved hovedenden.')

D('ryg-14', post(NECK, ['trapezius']), [
  F('Knoerne placeres på hver side af nakken og arbejder ned og ud over den øvre del af m. trapezius mod skuldrene.',
    [H('R', 'fist', 186, 148, 180), H('L', 'fist', 214, 148, 180)], [L(178, 132, 136, 170, bend=-14), L(222, 132, 264, 170, bend=14)])],
  therapist='Stå ved hovedenden.', review=['Håndskrevet: ”Tommelfinger friktion i kraniekanten”.'])

D('ryg-15', post([60, 150, 280, 350], ['erector-spinae']), [
  F('Tommelfingrene laver små cirkler på hver side af rygsøjlen og flyttes gradvist ned til ballernes øverste kant. Hænderne hviler fladt.',
    [H('R', 'thumb', 191, 225, 180), H('L', 'thumb', 209, 225, 180)],
    [C(191, 225, 8), C(209, 225, 8, ccw=True), L(183, 250, 183, 455, dashed=True), L(217, 250, 217, 455, dashed=True)])],
  therapist='Stå ved hovedenden.')

D('ryg-16', post(LUMB, ['erector-spinae']), [
  F('Den ene hånd lægges oven på den anden. Håndroden laver cirkulære friktioner langs rygstrækkeren på den modsatte side af rygsøjlen.',
    [H('R', 'heel', 186, 420, -90), H('L', 'heel', 190, 412, -80)], [C(186, 420, 16), L(166, 360, 166, 470, double=True, dashed=True)])],
  therapist='Stå på modsatte side af briksen.', support='delvis',
  review=['Retningen langs musklen (op/ned) er ikke angivet; den stiplede pil viser kun området.'])

D('ryg-17', post(LUMB), [
  F('Begge hænder ligger fladt på lænden og ælter vævet frem og tilbage i pilens retning.',
    [H('R', 'flat', 172, 432, 190), H('L', 'flat', 228, 432, 170)], [L(186, 385, 214, 385, double=True)])],
  support='delvis', review=['Håndskrevet: ”Ned skråt”.'])

D('ryg-18', post(LUMB), [
  F('Friktion med håndens kant i flanken, mellem hoftekammen og de nederste ribben.',
    [H('R', 'edge', 140, 415, 180)], [])],
  support='delvis',
  review=['Fotoet viser ingen bevægelsesretning. Håndskrevet: ”kniven”, ”QL musklen” (usikker læsning).'])

D('ryg-19', post([80, 380, 240, 180], ['gluteus-medius']), [
  F('Tommelfingeren laver friktioner på m. gluteus medius, nedad. Den anden hånd hviler på lænden.',
    [H('R', 'thumb', 156, 452, 180), H('L', 'flat', 210, 418, 90, 'support')], [L(132, 430, 132, 480)]),
  F('Gentag med knoerne, nedad.',
    [H('R', 'fist', 156, 452, 180), H('L', 'flat', 210, 418, 90, 'support')], [L(132, 430, 132, 480)])])

D('ryg-20', post([80, 380, 240, 180], ['gluteus-medius']), [
  F('Knoerne laver friktioner på m. gluteus medius, opad.',
    [H('R', 'fist', 156, 456, 0), H('L', 'flat', 210, 418, 90, 'support')], [L(132, 480, 132, 430)]),
  F('Gentag med tommelfingeren, opad.',
    [H('R', 'thumb', 156, 456, 0), H('L', 'flat', 210, 418, 90, 'support')], [L(132, 480, 132, 430)])])

D('ryg-21', post([70, 300, 260, 200], ['erector-spinae']), [
  F('Tommelfingeren arbejder op langs rygsøjlen (tilbage mod hjertet).',
    [H('R', 'thumb', 190, 440, 0)], [L(178, 480, 178, 330)])])

D('ryg-22', post(BACK), [
  F('Stå ved hovedenden. Begge hænder ligger fladt på hver side af rygsøjlen og stryger op og ned over hele ryggen.',
    [H('R', 'flat', 168, 245, 180), H('L', 'flat', 232, 245, 180)], [L(130, 200, 130, 450, double=True), L(270, 200, 270, 450, double=True)])],
  therapist='Stå for enden af briksen (ved hovedet).')

# =====================================================================
# ARM OG HÅND (s. 16–18). Anterior view, client's right arm (viewer's left).
# =====================================================================
FOREARM = [0, 300, 220, 230]
UPPER = [10, 170, 220, 210]
D('arm-1', ant([0, 150, 240, 470]), [
  F('Begge hænder omslutter armen og stryger op og ned over hele armen.',
    [H('R', 'flat', 80, 430, 0), H('L', 'flat', 106, 268, 0)], [L(30, 500, 30, 220, double=True), L(140, 380, 140, 210, double=True)])],
  clientPose='Fotoet viser armen løftet mellem behandlerens hænder.', support='delvis',
  review=['Hændernes præcise stilling om armen er kun delvist synlig.'])

D('arm-2', hand('dorsal'), [
  F('Den ene hånd støtter klientens hånd nedefra. Tommel- og pegefinger griber om én finger ad gangen og ælter fra fingerroden ud mod spidsen.',
    [H('R', 'pinch', -3, -30, 115)], [L(14, -10, 14, -56)])])

D('arm-3', hand('dorsal'), [
  F('Klientens hånd ligger med håndryggen op. Tommelfingrene arbejder i furerne mellem fingrenes sener, fra knoerne mod håndleddet; fingrene støtter under hånden.',
    [H('L', 'thumb', -9, 4, 145), H('R', 'thumb', 11, 4, 215)], [L(-9, -8, -8, 34), L(11, -8, 10, 34)])])

D('arm-4', hand('palmar'), [
  F('Klientens håndflade vender op, og behandlerens fingre støtter under hånden. Tommelfingrene arbejder i håndfladen – især på tommelfingerballen.',
    [H('R', 'thumb', 14, 16, 225), H('L', 'thumb', -6, 2, 140)], [L(36, -4, 20, 12), L(-20, 30, -10, 6)])],
  support='delvis', review=['Pilene i fotoet viser flere retninger; den præcise rækkefølge er ikke beskrevet.'])

D('arm-5', ant(FOREARM, ['brachioradialis']), [
  F('Den ene hånd holder klientens håndled. Tommelfingeren arbejder op langs m. brachioradialis på underarmens tommelfingerside mod albuen – ikke over leddet.',
    [H('R', 'thumb', 76, 440, -8), H('L', 'grip', 72, 505, 90, 'support')], [L(56, 480, 72, 355)])],
  clientPose='Fotoet viser albuen på briksen med underarmen løftet.')

D('arm-6', ant(FOREARM, ['flexores-antebrachii']), [
  F('Tommelfingeren arbejder op langs underarmens lillefingerside mod albuen.',
    [H('R', 'thumb', 104, 440, 6)], [L(122, 485, 120, 340)])],
  support='delvis',
  review=['Billedtekstens ”til lateral på humerus” er uklar – lillefingersiden er normalt medial. Bør afklares med underviser.'])

D('arm-7', ant(FOREARM, ['flexores-antebrachii']), [
  F('Tommelfingeren skiller musklerne på underarmens inderside med friktioner frem og tilbage i pilens retning.',
    [H('R', 'thumb', 88, 425, 0)], [L(72, 450, 106, 400, double=True)])])

D('arm-8', ant(FOREARM, ['flexores-antebrachii']), [
  F('Tommelfingeren arbejder langs underarmens lillefingerside op mod albuen og humerus.',
    [H('R', 'thumb', 104, 450, 6)], [L(122, 490, 120, 330)])])

D('arm-9', ant([0, 260, 220, 260], ['brachioradialis']), [
  F('Den ene hånd holder håndleddet. Tommelfingeren arbejder op langs tommelfingersiden af m. brachioradialis. Drej armen, før albueleddet passeres.',
    [H('R', 'thumb', 76, 440, -8), H('L', 'grip', 72, 505, 90, 'support')], [L(56, 480, 80, 300, bend=-8)])])

D('arm-10', ant(UPPER, ['biceps-brachii']), [
  F('Begge hænder griber om m. biceps brachii og ælter frem og tilbage langs musklen.',
    [H('R', 'grip', 104, 258, 43), H('L', 'grip', 104, 318, 137)], [L(72, 232, 70, 340, double=True)])],
  support='delvis', review=['Grebets præcise stilling er tolket ud fra fotoet.'])

D('arm-11', ant([0, 200, 220, 330], ['biceps-brachii']), [
  F('Den ene hånd holder klientens håndled. Den anden hånd ælter fra albueleddet op langs m. biceps brachii.',
    [H('R', 'grip', 104, 330, 43), H('L', 'grip', 72, 505, 90, 'support')], [L(70, 345, 76, 225)])])

D('arm-12', post([20, 160, 200, 220], ['triceps-brachii', 'deltoideus']), [
  F('Tommelfingeren arbejder fra albuen op ad overarmen i fire baner: (1) lateralt for biceps, (2–3) to gange på triceps, (4) over deltoideus.',
    [H('R', 'thumb', 104, 322, 0)],
    [L(86, 342, 86, 232, dashed=True), L(100, 342, 100, 250, dashed=True), L(114, 342, 114, 250, dashed=True), L(108, 262, 112, 186, dashed=True)],
    marks=[(80, 350, '1'), (98, 356, '2'), (116, 352, '3'), (124, 250, '4')])],
  clientPose='Fotoet viser armen bøjet og løftet; tegningen viser overarmen bagfra.',
  support='delvis',
  review=['Opdelingen i fire baner er tolket ud fra billedteksten (”Del Triceps i 4 sektioner …”) og bør bekræftes.'])

D('arm-13', ant([0, 150, 240, 470]), [
  F('Afslut med strygninger op og ned over hele armen med begge hænder.',
    [H('R', 'flat', 80, 430, 0), H('L', 'flat', 106, 268, 0)], [L(30, 500, 30, 220, double=True), L(140, 380, 140, 210, double=True)])],
  support='delvis', review=['Hændernes præcise stilling om armen er kun delvist synlig.'])

# =====================================================================
# BRYST (s. 19). Anterior view, therapist at the head end.
# =====================================================================
CHEST = [70, 120, 260, 190]
D('arm-14', ant(CHEST, ['pectoralis-major']), [
  F('Stå ved hovedenden. Begge hænder ligger fladt på brystet med fingrene ind mod brystbenet og stryger ud over brystmusklen mod skuldrene.',
    [H('R', 'flat', 165, 215, 135), H('L', 'flat', 235, 215, 225)], [L(192, 248, 128, 196, bend=-18), L(208, 248, 272, 196, bend=18)])],
  therapist='Stå ved hovedenden.')

D('arm-15', ant(CHEST, ['pectoralis-major']), [
  F('Fingerspidserne arbejder fra brystbenet ud mod overarmsknoglen. Stop lige over brystvorten.',
    [H('R', 'tips', 178, 205, 160)], [L(196, 222, 128, 202, bend=-6)], marks=[(166, 246, '!')])],
  therapist='Stå ved hovedenden.', support='delvis',
  review=['Fotoet viser en pil nedad langs fingrene; billedteksten beskriver retningen fra sternum ud mod humerus. Tegningen følger billedteksten.'])

D('arm-16', ant(CHEST, ['pectoralis-minor']), [
  F('Fingerspidserne laver friktioner frem og tilbage langs m. pectoralis minor, under den store brystmuskel.',
    [H('L', 'tips', 152, 222, 60), H('R', 'flat', 112, 270, 0, 'support')], [L(142, 194, 168, 252, double=True)])],
  clientPose='Fotoet viser klientens arm let ført ud fra kroppen.', support='delvis',
  review=['Musklen ligger dybt; placeringen er tegnet efter standardanatomi.'])

D('arm-17', ant(CHEST, ['pectoralis-minor']), [
  F('Knoerne arbejder langs m. pectoralis minor op mod skulderen. Den anden hånd hviler på skulderen.',
    [H('L', 'fist', 156, 228, -20), H('R', 'flat', 118, 190, 0, 'support')], [L(176, 262, 146, 200)])],
  support='delvis', review=['Musklen ligger dybt; placeringen er tegnet efter standardanatomi.'])

D('arm-18', ant(CHEST, ['pectoralis-major']), [
  F('Afslut med strygninger med flade hænder fra brystbenet ud mod skuldrene.',
    [H('R', 'flat', 165, 215, 135), H('L', 'flat', 235, 215, 225)], [L(192, 248, 128, 196, bend=-18), L(208, 248, 272, 196, bend=18)])],
  therapist='Stå ved hovedenden.')

# =====================================================================
# ANSIGT (s. 21–22). Anterior view, therapist sits at the head end.
# =====================================================================
FACE = [118, -30, 164, 175]
D('ansigt-5', ant(FACE, ['temporalis']), [
  F('Fingrene samles på toppen af hovedet.',
    [H('R', 'tips', 193, 26, 165), H('L', 'tips', 207, 26, 195)], []),
  F('Træk ned over tindingerne mod ørerne, så fingrene spredes.',
    [H('R', 'tips', 166, 82, 150), H('L', 'tips', 234, 82, 210)], [L(188, 30, 160, 74, bend=-14), L(212, 30, 240, 74, bend=14)])],
  therapist='Ved hovedenden.')

D('ansigt-6', ant(FACE, ['masseter', 'temporalis']), [
  F('Håndroden hviler ved tindingerne, og fingerspidserne ligger i tyggemuskulaturen under kindbenene. Lav små cirkler – 3 × 3.',
    [H('R', 'claw', 166, 46, 172), H('L', 'claw', 234, 46, 188)], [C(172, 102, 6), C(228, 102, 6, ccw=True)])],
  therapist='Ved hovedenden.')

D('ansigt-7', ant(FACE), [
  F('Fingrene placeres på hver side af næseryggen.',
    [H('R', 'tips', 193, 76, 170), H('L', 'tips', 207, 76, 190)], []),
  F('Træk ned langs kindbenene ud mod øreflipperne.',
    [H('R', 'tips', 162, 98, 130), H('L', 'tips', 238, 98, 230)], [L(192, 88, 162, 102, bend=10), L(208, 88, 238, 102, bend=-10)])],
  therapist='Ved hovedenden.')

D('ansigt-8', ant(FACE, ['temporalis']), [
  F('Håndroden hviler ved tindingerne, og fingerspidserne ligger ved mundvigene. Lav små cirkler – 3 × 3.',
    [H('R', 'claw', 170, 58, 158), H('L', 'claw', 230, 58, 202)], [C(188, 113, 5), C(212, 113, 5, ccw=True)])],
  therapist='Ved hovedenden.', support='delvis',
  review=['Fingerspidsernes præcise placering ved mundvigen er kun delvist synlig i fotoet.'])

D('ansigt-9', ant(FACE), [
  F('Tommelfingrene placeres lige over hagen og trækkes tilbage langs kæben op mod ørerne.',
    [H('R', 'thumb', 194, 124, 162), H('L', 'thumb', 206, 124, 198)], [L(190, 130, 162, 102, bend=-8), L(210, 130, 238, 102, bend=8)])],
  therapist='Ved hovedenden.', support='delvis',
  review=['Fotoet ser ud til at vise fingrene (ikke tommelfingrene) ved hagen – fingerstillingen bør bekræftes.'])

D('ansigt-10', ant(FACE, ['frontalis']), [
  F('Håndroden placeres ved hårgrænsen og trækkes ned over panden mod øjenbrynene.',
    [H('L', 'heel', 200, 34, 180)], [L(222, 34, 222, 60)])],
  therapist='Ved hovedenden.', support='delvis',
  review=['Fotoet viser to hænder med pile i hver sin retning; billedteksten nævner kun strygning nedad.'])

D('ansigt-11', ant(FACE, ['frontalis']), [
  F('Den ene håndrod ved hårgrænsen, den anden over øjenbrynet. Hænderne trækker i hver sin retning.',
    [H('R', 'heel', 188, 34, 180), H('L', 'heel', 212, 60, 180)], [L(174, 40, 174, 22), L(226, 56, 226, 74)])],
  therapist='Ved hovedenden.', support='delvis',
  review=['Hvilken hånd trækker hvilken vej er ikke beskrevet, og begge pile i fotoet peger nedad. Tegnet som en udstrækning af panden – bør bekræftes.'])

D('ansigt-12', ant(FACE, ['temporalis']), [
  F('Håndroden lægges ved tindingerne og masserer i cirkler – 3 × 3.',
    [H('R', 'heel', 164, 68, 170), H('L', 'heel', 236, 68, 190)], [C(164, 68, 9), C(236, 68, 9, ccw=True)])],
  therapist='Ved hovedenden.')

out = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'demonstrations.json')
json.dump(DEMOS, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(DEMOS), 'demonstrations,', sum(len(d['frames']) for d in DEMOS), 'frames,',
      sum(1 for d in DEMOS if d['review']), 'with review notes')
