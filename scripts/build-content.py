"""Builds src/content/techniques.json from a hand-checked transcription of the
reference booklet. Re-run after editing: python3 scripts/build-content.py

Every record keeps the verbatim source caption (sourceCaption) and the page/image
it came from, so content stays traceable. 'description' is independently worded.
Muscle links carry a basis: 'kilde' (named in the caption) or 'afledt'
(inferred from the described area - must be reviewed by a qualified person).
"""
import json, os

IMG = {
  3: "ChatGPT-billede 4. nov. 2026, 22.45.41.jpg",
  4: "ChatGPT-billede 4. nov. 2026, 22.45.39.jpg",
  5: "ChatGPT-billede 4. nov. 2026, 22.45.37.jpg",
  6: "ChatGPT-billede 4. nov. 2026, 22.45.34.jpg",
  7: "ChatGPT-billede 4. nov. 2026, 22.45.32.jpg",
  8: "ChatGPT-billede 4. nov. 2026, 22.45.31.jpg",
  10: "ChatGPT-billede 4. nov. 2026, 22.45.29.jpg",
  11: "ChatGPT-billede 4. nov. 2026, 22.45.28.jpg",
  12: "ChatGPT-billede 4. nov. 2026, 22.45.26.jpg",
  13: "ChatGPT-billede 4. nov. 2026, 22.45.23.jpg",
  14: "ChatGPT-billede 4. nov. 2026, 22.45.21.jpg",
  15: "ChatGPT-billede 4. nov. 2026, 22.45.19.jpg",
  16: "ChatGPT-billede 4. nov. 2026, 22.45.16.jpg",
  17: "ChatGPT-billede 4. nov. 2026, 22.45.14.jpg",
  18: "ChatGPT-billede 4. nov. 2026, 22.45.10.jpg",
  19: "ChatGPT-billede 4. nov. 2026, 22.45.09.jpg",
  21: "ChatGPT-billede 4. nov. 2026, 22.45.01.jpg",
  22: "ChatGPT-billede 4. nov. 2026, 22.44.50.jpg",
}

K = "kilde"; A = "afledt"
def m(i, basis, note=None):
    d = {"id": i, "basis": basis}
    if note: d["note"] = note
    return d

records = []
def t(program, step, region, page, name, ttype, tools, caption, description,
      muscles=(), precautions=(), hand=(), review=(), position=None):
    records.append({
        "id": f"{program}-{step}",
        "program": program,
        "step": step,
        "region": region,
        "name": name,
        "type": ttype,
        "tools": list(tools),
        "description": description,
        "position": position,
        "muscles": list(muscles),
        "precautions": [{"text": p, "basis": K} for p in precautions],
        "handwrittenNotes": [{"text": h, "certain": False} for h in hand],
        "reviewNotes": list(review),
        "status": "til-gennemsyn" if review or any(x["basis"] == A for x in muscles) else "kilde",
        "source": {"page": page, "image": IMG.get(page), "caption": caption},
    })

def gap(program, step, region, page, reason):
    records.append({
        "id": f"{program}-{step}", "program": program, "step": step, "region": region,
        "gap": True, "reason": reason,
        "source": {"page": page, "image": IMG.get(page), "caption": None},
    })

INFERRED = "Muskelkobling er afledt af det beskrevne område – ikke nævnt direkte i kilden."

# ---------------- Ben (s. 3-8) ----------------
P = "ben"
t(P,"1","ben-bagside",3,"Effleurage af benets bagside","effleurage",["hænder"],
  "1. Effleurage af bagside af ben.",
  "Lange, glidende strygninger over hele benets bagside.")
t(P,"2","ben-bagside",3,"”Løft” af lægmusklen","løft",["hænder"],
  "2. ”Løft” lægmusklen.",
  "Lægmusklen løftes med hænderne.",
  muscles=[m("gastrocnemius",A,"”lægmusklen”"), m("soleus",A,"”lægmusklen”")],
  hand=["”skiftevis” (skrevet på fotoet)"])
t(P,"3","ben-bagside",3,"Tommelfingerfriktion langs gastrocnemius","friktion",["tommelfingre"],
  "3. Tommelfingerfriktion langs gastronecmius. (medialt som lateralt) til over knæet.",
  "Tommelfingerfriktioner langs m. gastrocnemius – både medialt og lateralt – op til over knæet.",
  muscles=[m("gastrocnemius",K)],
  review=["Kilden staver ”gastronecmius”; tolket som m. gastrocnemius."])
t(P,"4","ben-bagside",3,"Petrissage af akillessenen","petrissage",["fingre"],
  "4. Petrissage af achillessene.",
  "Æltning af området omkring akillessenen.",
  muscles=[m("tendo-calcaneus",K)])
t(P,"5","ben-bagside",3,"Skil lægmusklen","friktion",["tommelfingre"],
  "5. Skil lægmusklen med tommelfingre.",
  "Lægmusklen skilles med tommelfingrene.",
  muscles=[m("gastrocnemius",A,"”lægmusklen”")],
  hand=["”Bevæger vævet”"])
t(P,"6","ben-bagside",4,"Tommelfingerfriktioner langs haserne","friktion",["tommelfingre"],
  "6. Tommelfingerfriktioner langs haserne til tuber ischii (begynd under knæet)",
  "Tommelfingerfriktioner langs hasemusklerne op til tuber ischii. Start under knæet.",
  muscles=[m("biceps-femoris",K,"”haserne”"), m("semitendinosus",K,"”haserne”"), m("semimembranosus",K,"”haserne”")])
t(P,"7","ben-bagside",4,"Skil hasemusklerne","friktion",["tommelfingre"],
  "7. Skil hasemusklerne med tommelfingrene.",
  "Hasemusklerne skilles fra hinanden med tommelfingrene.",
  muscles=[m("biceps-femoris",K,"”hasemusklerne”"), m("semitendinosus",K,"”hasemusklerne”"), m("semimembranosus",K,"”hasemusklerne”")])
t(P,"8","ben-bagside",4,"Knofriktion af tuber ischii-området","friktion",["knoer"],
  "8. Knofriktion af tuber ischii området.",
  "Knofriktioner omkring sædebensknuden (tuber ischii).")
t(P,"9","ben-bagside",4,"Friktioner af gluteus maximus","friktion",["tommelfingre","knoer"],
  "9. Tommelfingerfriktioner af m. Gluteus Maximus, efterfulgt af knofriktioner.",
  "Tommelfingerfriktioner over m. gluteus maximus, derefter knofriktioner.",
  muscles=[m("gluteus-maximus",K)])
t(P,"10","ben-bagside",4,"Effleurage af benets bagside","effleurage",["hænder"],
  "10. Effleurage af bagside af ben.",
  "Afsluttende strygninger over benets bagside.")
for s in ["11","12","13","14"]:
    gap(P,s,"ben-bagside",5,"Side 5 er for sløret til at kunne læses. Billedtekster og eventuelt sideskift (vending til rygleje) kan ikke bestemmes.")
t(P,"15","ben-forside",6,"Tommelfingerfriktioner lateralt for tibia","friktion",["tommelfingre"],
  "15. Tommelfingerfriktioner langs underbenet på laterale side af tibia (ikke over knæled).",
  "Tommelfingerfriktioner langs underbenets forside, på ydersiden af skinnebenet.",
  muscles=[m("tibialis-anterior",A)],
  precautions=["Ikke over knæleddet."],
  hand=["”(Dorsalfleksion.)” – usikker læsning"])
t(P,"16","ben-forside",6,"Forsigtige friktioner langs tibia","friktion",["fingre"],
  "16. Forsigtige friktioner langs tibia, især tuberosita tibia.",
  "Forsigtige friktioner langs skinnebenet, især ved tuberositas tibiae.",
  precautions=["Udføres forsigtigt (direkte over knoglen)."],
  review=["Kilden skriver ”tuberosita tibia”; korrekt latin er tuberositas tibiae."])
t(P,"17","ben-forside",7,"Friktioner langs vastus medialis og lateralis","friktion",["tommelfingre"],
  "17. Tommelfingerfriktioner langs m. Vastus medialis samt m. Vastus lateralis",
  "Tommelfingerfriktioner langs m. vastus medialis og m. vastus lateralis.",
  muscles=[m("vastus-medialis",K), m("vastus-lateralis",K)],
  hand=["”Tommel”", "”3 baner”", "”Effleurage på lår” (øverst på siden)"])
t(P,"18","ben-forside",7,"Knofriktion af rectus femoris","friktion",["knoer"],
  "18. Knofriktion af m. Rectus Femoris.",
  "Knofriktioner langs m. rectus femoris.",
  muscles=[m("rectus-femoris",K)],
  hand=["”Kno”", "”3 baner”"])
t(P,"19","ben-forside",7,"Tommelfingerfriktioner langs sartorius","friktion",["tommelfingre"],
  "19. Tommelfingerfriktioner langs m. Satorius.",
  "Tommelfingerfriktioner langs m. sartorius.",
  muscles=[m("sartorius",K)],
  hand=["”Bukke ind mod mig.”"],
  review=["Kilden staver ”Satorius”; tolket som m. sartorius."])
t(P,"20","ben-forside",8,"Tommelfingerfriktioner langs gracilis","friktion",["tommelfingre"],
  "20. Tommelfingerfriktioner langs m. Gracilis.",
  "Tommelfingerfriktioner langs m. gracilis på lårets inderside.",
  muscles=[m("gracilis",K)],
  hand=["”løft benet”"])
t(P,"21","ben-forside",8,"Knofriktioner langs adduktorerne","friktion",["knoer"],
  "21. Knofriktioner langs lårets adduktorer.",
  "Knofriktioner langs lårets adduktorer.",
  muscles=[m("adductores",K)],
  hand=["”tryk ned” – usikker læsning"])
t(P,"22","ben-forside",8,"Knofriktion langs tractus iliotibialis","friktion",["knoer"],
  "22. Knofriktion langs lårets Tractus Iliotibialis.",
  "Knofriktioner langs tractus iliotibialis på lårets yderside.",
  muscles=[m("tractus-iliotibialis",K)])
t(P,"23","ben-forside",8,"Fingerfriktioner på nederste del af tractus iliotibialis","friktion",["fingre"],
  "23. Fingerfriktioner langs det sidste stykke af Tractus Iliotibiales.",
  "Fingerfriktioner langs den nederste del af tractus iliotibialis.",
  muscles=[m("tractus-iliotibialis",K)],
  hand=["”vend mod patienten”"])
t(P,"24","ben-forside",8,"Effleurage","effleurage",["hænder"],
  "24. Effleurage.",
  "Afsluttende strygninger over benet.",
  review=["Kilden angiver ikke hvilket område; fotoet viser benet."])

# ---------------- Ryg, nakke og skuldre (s. 10-15) ----------------
P = "ryg"
t(P,"1","ryg-nakke-skuldre",10,"Effleurage af hele ryggen","effleurage",["hænder"],
  "1. Effleurage af hele ryggen.",
  "Lange, glidende strygninger over hele ryggen.",
  hand=["Håndskrevet note ved billedet – ulæselig"])
t(P,"2","ryg-nakke-skuldre",10,"Petrissage af øvre trapezius","petrissage",["hænder"],
  "2. Petrissage af øvre Trapezius (stå på modsatte side af briksen).",
  "Æltning af den øvre del af m. trapezius.",
  position="Stå på modsatte side af briksen.",
  muscles=[m("trapezius",K)])
t(P,"3","ryg-nakke-skuldre",10,"Friktion af levator scapulae","friktion",["fingre"],
  "3. Friktion af m. Levator Scapula (stå på modsatte side af briksen).",
  "Friktioner over m. levator scapulae.",
  position="Stå på modsatte side af briksen.",
  muscles=[m("levator-scapulae",K)],
  review=["Kilden skriver ”Levator Scapula”; korrekt latin er m. levator scapulae."])
t(P,"4a","ryg-nakke-skuldre",10,"Friktion langs trapezius' øvre kant","friktion",["fingre"],
  "4a. Friktion langs m. Trapezius' superiore kant (Stå for enden af briksen).",
  "Friktioner langs den øvre kant af m. trapezius.",
  position="Stå for enden af briksen.",
  muscles=[m("trapezius",K)],
  hand=["”frem og tilbage v. hovedets side” – usikker læsning"])
t(P,"4b","ryg-nakke-skuldre",11,"Massage langs scapulas øvre kant","friktion",["fingre"],
  "4b. Massage langs Scapulas superiore kant.",
  "Massage langs skulderbladets øvre kant.",
  hand=["”og m. knoer”"])
t(P,"5","ryg-nakke-skuldre",11,"Tommelfingerfriktion langs scapulas mediale kant","friktion",["tommelfingre"],
  "5. Friktion langs Scapulas mediale kant med tommelfingrene (gøres bedst med armen liggende på ryggen.",
  "Friktioner med tommelfingrene langs skulderbladets inderste kant.",
  position="Gøres bedst med armen liggende på ryggen.",
  hand=["”PUDE”", "”hånd v. trussen” – usikker læsning"])
t(P,"6","ryg-nakke-skuldre",11,"Knofriktion langs scapulas mediale kant","friktion",["knoer"],
  "6. Friktion langs Scapulas mediale kant med knofriktioner.",
  "Knofriktioner langs skulderbladets inderste kant.")
t(P,"7","ryg-nakke-skuldre",12,"Knofriktioner ind mod nakke og rygsøjle","friktion",["knoer"],
  "7. Knofriktioner indad mod nakke og rygsøjle.",
  "Knofriktioner der arbejder indad mod nakken og rygsøjlen.",
  hand=["”håndrod imellem, lille bevægelse” – usikker læsning"])
t(P,"8","ryg-nakke-skuldre",12,"Cirkulær håndrodsfriktion på scapula","friktion",["håndrod"],
  "8. Friktion i cirkler med håndroden på Scapula.",
  "Cirkulære friktioner med håndroden over skulderbladet.",
  hand=["”over knoklen”", "”stå oppe” – usikker læsning"])
t(P,"9","ryg-nakke-skuldre",12,"Tommelfingerfriktioner på infraspinatus","friktion",["tommelfingre"],
  "9. Tommelfingerfriktioner på m. Infraspinatus på Scapula. Herefter lægges armen op over hovedet.",
  "Tommelfingerfriktioner over m. infraspinatus på skulderbladet. Derefter lægges armen op over hovedet.",
  muscles=[m("infraspinatus",K)])
t(P,"10","ryg-nakke-skuldre",12,"Knofriktioner langs triceps' udspring","friktion",["knoer"],
  "10. Knofriktioner langs tricepsudspring udvendig armhule.",
  "Knofriktioner langs udspringet af m. triceps brachii ved armhulens yderside.",
  muscles=[m("triceps-brachii",K)],
  hand=["”glat hånd over scapula” – usikker læsning"])
t(P,"11","ryg-nakke-skuldre",13,"Tommelfingerfriktioner langs scapulas laterale kant","friktion",["tommelfingre"],
  "11. Tommelfingerfriktioner langs Scapulas laterale kant.",
  "Tommelfingerfriktioner langs skulderbladets yderste kant.",
  hand=["”Effleurage m. og uden håndklæde” – usikker læsning"])
t(P,"12","ryg-nakke-skuldre",13,"Petrissage af nakkemusklerne","petrissage",["hænder"],
  "12. Petrissage af nakkemuskler (stå på siden af briksen).",
  "Æltning af nakkemusklerne.",
  position="Stå på siden af briksen.",
  muscles=[m("trapezius",A,"”nakkemuskler”")],
  hand=["”frem og tilbage, ’vippe’” – usikker læsning"])
t(P,"13","ryg-nakke-skuldre",13,"Træk fra skuldrene og tryk ved kraniekanten","tryk",["fingre"],
  "13. Træk tilbage fra skuldre, og tryk langs suboccipitale muskulatur (kraniekanten).",
  "Træk tilbage fra skuldrene, og tryk derefter langs kraniekanten over den suboccipitale muskulatur.",
  muscles=[m("suboccipitales",K)])
t(P,"14","ryg-nakke-skuldre",13,"Knofriktion af nakke og øvre trapezius","friktion",["knoer"],
  "14. Knofriktion af nakkemuskler samt øvre m. Trapezius.",
  "Knofriktioner over nakkemusklerne og den øvre del af m. trapezius.",
  muscles=[m("trapezius",K)],
  hand=["”Tommelfinger friktion i kraniekanten”"])
t(P,"15","ryg-nakke-skuldre",14,"Cirkulære tommelfingerfriktioner langs rygsøjlen","friktion",["tommelfingre"],
  "15. Cirkulære friktioner med tommelfingre langs rygsøjlen til øverste ballekant.",
  "Cirkulære friktioner med tommelfingrene langs rygsøjlen ned til den øverste kant af ballerne.",
  muscles=[m("erector-spinae",A)])
t(P,"16","ryg-nakke-skuldre",14,"Cirkulære håndrodsfriktioner langs rygstrækkeren","friktion",["håndrod"],
  "16. Cirkulære håndrodsfriktioner langs ene side af rygstrækkeren (stå på modsatte side).",
  "Cirkulære friktioner med håndroden langs rygstrækkeren i den ene side.",
  position="Stå på modsatte side.",
  muscles=[m("erector-spinae",K,"”rygstrækkeren”")])
t(P,"17","ryg-nakke-skuldre",14,"Petrissage af lænden","petrissage",["hænder"],
  "17. Petrissage af lænden med begge hænder.",
  "Æltning af lænden med begge hænder.",
  hand=["”Ned skråt”"])
t(P,"18","ryg-nakke-skuldre",14,"Friktion mellem hofteskål og nederste ribben","friktion",["håndkant"],
  "18. Friktion med siden af hånden mellem hofteskålen og de nederste ribben.",
  "Friktioner med håndkanten i området mellem hoftekammen og de nederste ribben.",
  hand=["”kniven”", "”QL musklen” (m. quadratus lumborum?) – usikker læsning, ikke koblet"])
t(P,"19","ryg-nakke-skuldre",15,"Friktioner af gluteus medius (ned)","friktion",["tommelfingre","knoer"],
  "19. Tommelfinger- og knofriktioner af Gluteus Medius (ned).",
  "Tommelfinger- og knofriktioner over m. gluteus medius, nedadgående.",
  muscles=[m("gluteus-medius",K)])
t(P,"20","ryg-nakke-skuldre",15,"Friktioner af gluteus medius (op)","friktion",["knoer","tommelfingre"],
  "20. Kno- og tommelfingerfriktioner af Gluteus Medius (op).",
  "Kno- og tommelfingerfriktioner over m. gluteus medius, opadgående.",
  muscles=[m("gluteus-medius",K)])
t(P,"21","ryg-nakke-skuldre",15,"Tommelfingerfriktioner op langs rygsøjlen","friktion",["tommelfingre"],
  "21. Tommelfingerfriktioner op langs rygsøjlen (tilbage til hjertet).",
  "Tommelfingerfriktioner op langs rygsøjlen, i retning mod hjertet.",
  muscles=[m("erector-spinae",A)])
t(P,"22","ryg-nakke-skuldre",15,"Effleurage af hele ryggen","effleurage",["hænder"],
  "22. Effleurage af hele ryg (stå for enden af briksen).",
  "Afsluttende strygninger over hele ryggen.",
  position="Stå for enden af briksen.")

# ---------------- Arm og hånd (s. 16-18) ----------------
P = "arm"
t(P,"1","arm-haand",16,"Effleurage af hele armen","effleurage",["hænder"],
  "1. Effleurage af hele armen.",
  "Lange, glidende strygninger over hele armen.")
t(P,"2","arm-haand",16,"Petrissage af fingrene","petrissage",["fingre"],
  "2. Petrissage af fingre.",
  "Æltning af hver finger.")
t(P,"3","arm-haand",16,"Tommelfingerfriktioner mellem fingrenes sener","friktion",["tommelfingre"],
  "3. Tommelfingerfriktioner imellem fingrenes sener.",
  "Tommelfingerfriktioner på håndryggen mellem fingrenes sener.")
t(P,"4","arm-haand",16,"Tommelfingerfriktioner i håndfladen","friktion",["tommelfingre"],
  "4. Tommelfingerfriktioner af hånden indvendigt, især tommelfingerballen.",
  "Tommelfingerfriktioner i håndfladen, især på tommelfingerballen.")
t(P,"5","arm-haand",17,"Tommelfingerfriktioner langs brachioradialis","friktion",["tommelfingre"],
  "5. Tommelfingerfriktioner langs m. Brachioradialis til lateralt på radius (ikke over leddet).",
  "Tommelfingerfriktioner langs m. brachioradialis til den laterale side af radius.",
  muscles=[m("brachioradialis",K)],
  precautions=["Ikke over leddet."])
t(P,"6","arm-haand",17,"Tommelfingerfriktioner langs lillefingersiden","friktion",["tommelfingre"],
  "6. Tommelfingerfriktioner langs lillefingersiden til lateral på humerus.",
  "Tommelfingerfriktioner langs underarmens lillefingerside op mod humerus.",
  review=["Formuleringen ”lillefingersiden til lateral på humerus” er uklar (lillefingersiden er normalt medial). Bør afklares med underviser."])
t(P,"7","arm-haand",17,"Skil underarmens inderside","friktion",["tommelfingre"],
  "7. Skil den indvendige underarms muskel med tommelfingerfriktioner.",
  "Musklerne på underarmens inderside skilles med tommelfingerfriktioner.",
  muscles=[m("flexores-antebrachii",A,"”den indvendige underarms muskel”")])
t(P,"8","arm-haand",17,"Tommelfingerfriktioner langs underarmens lillefingerside","friktion",["tommelfingre"],
  "8. Tommelfingerfriktioner langs lillefingersiden af underarmen til humerus.",
  "Tommelfingerfriktioner langs underarmens lillefingerside op til humerus.")
t(P,"9","arm-haand",18,"Tommelfingerfriktioner på brachioradialis' tommelfingerside","friktion",["tommelfingre"],
  "9. Tommelfingerfriktioner langs tommelfingersiden på m. Brachioradialis (husk at dreje armen inden leddet passeres).",
  "Tommelfingerfriktioner langs tommelfingersiden af m. brachioradialis.",
  muscles=[m("brachioradialis",K)],
  precautions=["Husk at dreje armen inden leddet passeres."])
t(P,"10","arm-haand",18,"Petrissage af biceps brachii","petrissage",["hænder"],
  "10. Petrissage af m. Biceps Brachii.",
  "Æltning af m. biceps brachii.",
  muscles=[m("biceps-brachii",K)])
t(P,"11","arm-haand",18,"Petrissage fra albuen langs biceps","petrissage",["hænder"],
  "11. Petrissage fra albueled langs m. Biceps Brachii.",
  "Æltning fra albueleddet og op langs m. biceps brachii.",
  muscles=[m("biceps-brachii",K)])
t(P,"12","arm-haand",18,"Tommelfingerfriktioner langs triceps","friktion",["tommelfingre"],
  "12. Tommelfingerfriktioner fra albueled ned langs Triceps. (Del Triceps i 4 sektioner) Lateral Biceps, 2 gange Triceps og Deltoidues.",
  "Tommelfingerfriktioner fra albueleddet langs m. triceps brachii. Overarmen deles i fire baner: lateralt for biceps, to baner på triceps og en på deltoideus.",
  muscles=[m("triceps-brachii",K), m("biceps-brachii",K), m("deltoideus",K)],
  review=["Opdelingen i ”4 sektioner” er tolket ud fra billedteksten – bør bekræftes. Kilden staver ”Deltoidues”."])
t(P,"13","arm-haand",18,"Effleurage af hele armen","effleurage",["hænder"],
  "13. Effleurage af hele armen.",
  "Afsluttende strygninger over hele armen.")

# ---------------- Bryst (s. 19) - nummereringen fortsætter fra armen ----------------
P = "arm"
t(P,"14","bryst",19,"Effleurage af brystmusklen","effleurage",["hænder"],
  "14. Effleurage af brystmuskelen.",
  "Glidende strygninger over brystmusklen.",
  muscles=[m("pectoralis-major",A,"”brystmuskelen”")])
t(P,"15","bryst",19,"Fingerfriktioner fra sternum mod humerus","friktion",["fingre"],
  "15. Fingerfriktioner fra Sternum ud til Humerus (stop lige over brysvorte).",
  "Fingerfriktioner fra brystbenet ud mod overarmsknoglen.",
  muscles=[m("pectoralis-major",A)],
  precautions=["Stop lige over brystvorten."])
t(P,"16","bryst",19,"Fingerfriktioner langs pectoralis minor","friktion",["fingre"],
  "16. Fingerfriktioner langs m. Pectoralis Minor.",
  "Fingerfriktioner langs m. pectoralis minor.",
  muscles=[m("pectoralis-minor",K)])
t(P,"17","bryst",19,"Knofriktioner langs pectoralis minor","friktion",["knoer"],
  "17. Knofriktioner langs m. Pectoralis Minor.",
  "Knofriktioner langs m. pectoralis minor.",
  muscles=[m("pectoralis-minor",K)],
  review=["Billedteksten er trykt to gange i kilden."])
t(P,"18","bryst",19,"Effleurage af brystet","effleurage",["hænder"],
  "18. Effleurage af brystet.",
  "Afsluttende strygninger over brystet.")

# ---------------- Ansigt (s. 20-22) ----------------
P = "ansigt"
for s in ["1","2","3","4"]:
    gap(P,s,"ansigt",20,"Side 20 (ansigtsmassage trin 1–4) er ikke med i billedmaterialet.")
t(P,"5","ansigt",21,"Stryg fra issen ned over tindingen","strygning",["fingre"],
  "5. Saml fingre på toppen af hovedet, træk ned over tindingen mod ørene så fingrene spredes.",
  "Fingrene samles på issen og trækkes ned over tindingerne mod ørerne, mens de spredes.",
  muscles=[m("temporalis",A,"”tindingen”")])
t(P,"6","ansigt",21,"Cirkler i tyggemuskulaturen","friktion",["håndrod","fingre"],
  "6. Placer håndroden i tindingerne og fingrene i muskulaturen under kindbenene (tyggemuskulatur) 3x3.",
  "Håndroden hviler ved tindingerne, og fingrene arbejder i tyggemuskulaturen under kindbenene (3 × 3).",
  muscles=[m("masseter",A,"”tyggemuskulatur”"), m("temporalis",A,"”tindingerne”")])
t(P,"7","ansigt",21,"Stryg fra næseryggen langs kindbenene","strygning",["fingre"],
  "7. Placer fingrene på hver side af næseryggen og træk ned langs kindbenene mod øreflipperne.",
  "Fingrene placeres på hver side af næseryggen og trækkes langs kindbenene ud mod øreflipperne.")
t(P,"8","ansigt",21,"Cirkler ved mundvigen","friktion",["håndrod","fingre"],
  "8. Placer håndroden i tindingerene og fingrene i mundvigen 3x3.",
  "Håndroden hviler ved tindingerne, og fingrene arbejder ved mundvigen (3 × 3).",
  muscles=[m("temporalis",A,"”tindingerne”")])
t(P,"9","ansigt",22,"Stryg fra hagen op mod ørerne","strygning",["tommelfingre"],
  "9. Placér tommelfingre lige over hagen, træk tilbage op mod ørene.",
  "Tommelfingrene placeres lige over hagen og trækkes tilbage op mod ørerne.")
t(P,"10","ansigt",22,"Stryg ned over panden","strygning",["håndrod"],
  "10. Placér håndroden ved hårgrænsen og træk ned over panden mod brynene.",
  "Håndroden placeres ved hårgrænsen og trækkes ned over panden mod øjenbrynene.",
  muscles=[m("frontalis",A,"”panden”")])
t(P,"11","ansigt",22,"Modsatrettet træk over panden","strygning",["håndrod"],
  "11. Placér den ene håndrod ved hårgrænsen, og den anden over brynet. Træk i modsat retning.",
  "Den ene håndrod ved hårgrænsen og den anden over øjenbrynet – hænderne trækker i hver sin retning.",
  muscles=[m("frontalis",A,"”panden”")])
t(P,"12","ansigt",22,"Cirkler ved tindingerne","friktion",["håndrod"],
  "12. Læg håndroden i tindingerne, masser i cirkulære bevægelser 3x3.",
  "Håndroden lægges ved tindingerne og masserer i cirkler (3 × 3).",
  muscles=[m("temporalis",A,"”tindingerne”")])

for i, r in enumerate(records):
    r["order"] = i + 1

out = os.path.join(os.path.dirname(__file__), "..", "src", "content", "techniques.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
print(len([r for r in records if not r.get("gap")]), "techniques,", len([r for r in records if r.get("gap")]), "gaps")
