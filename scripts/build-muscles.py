"""Builds src/content/muscles.json and docs/MUSCLE_TERMINOLOGY.md.

Shared muscle records for atlas, techniques and quiz. IDs are stable and
language-independent: never rename them (a future 3D model reuses them).
Anatomy facts are standard textbook anatomy (not from the booklet) and are
marked contentStatus 'standard-til-gennemsyn'.

Terminology rules (audit, iteration 004):
- Latin follows Terminologia Anatomica (TA) spelling.
- Danish: established Danish anatomical names in definite form ("Den store
  brystmuskel", "Kappemusklen"). Where no established Danish name could be
  verified, the Latin-derived name used in Danish practice is shown and
  `daStatus` is 'til-gennemsyn' – never an invented translation.
- English: standard English anatomical names.
Run: python3 scripts/build-muscles.py
"""
import json, os

M = []
OK, REVIEW = 'gængs', 'til-gennemsyn'
# Search words that are not real alternative names (body-area words, the booklet's misspellings)
SEARCH_ONLY = {'tindingen', 'tyggemuskulatur', 'kraniekanten', 'nakkemuskler', 'deltoidues', 'lænden', 'brystmuskelen',
               'tricepsudspring', 'satorius', 'gastronecmius', 'tractus iliotibiales', 'haserne', 'temple', 'lower back', 'underkamsmusklen',
               'overarm-spolebensmusklen', 'lårbindehindespænderen', 'tvillingelægmusklen', 'achillessene', 'akillessene', 'deltoideus'}

def mu(id, da, la, en, group, kind, layer, views,
       origin, insertion, action, en_origin, en_insertion, en_action,
       aliases=(), aliasesEn=(), daStatus=OK, daReason=None, note=None, noteEn=None, partOf=None, quiz=True):
    M.append({
        'id': id, 'nameDa': da, 'nameLatin': la, 'nameEn': en,
        'group': group, 'kind': kind, 'layer': layer, 'views': views,
        'origin': origin, 'insertion': insertion, 'action': action,
        'en': {'origin': en_origin, 'insertion': en_insertion, 'action': en_action, 'note': noteEn},
        'aliases': list(aliases), 'aliasesEn': list(aliasesEn),
        'daStatus': daStatus, 'daReason': daReason,
        'danishNameUncertain': daStatus != OK,
        'note': note, 'partOf': partOf,
        'quizEligible': quiz and layer == 'superficial',
        'contentStatus': 'standard-til-gennemsyn',
    })

A, P, AP = ['anterior'], ['posterior'], ['anterior', 'posterior']
S, D = 'superficial', 'deep'

# ---------------- Hoved og hals ----------------
mu('frontalis', 'Pandemusklen', 'M. occipitofrontalis (venter frontalis)', 'Frontalis', 'hoved-hals', 'muskel', S, A,
   'Galea aponeurotica (hovedets senehjelm).', 'Huden ved øjenbrynene.', 'Løfter øjenbrynene og rynker panden.',
   'Galea aponeurotica (epicranial aponeurosis).', 'Skin of the eyebrows.', 'Raises the eyebrows and wrinkles the forehead.',
   aliases=['m. frontalis', 'm. occipitofrontalis'], aliasesEn=['frontal belly of occipitofrontalis', 'occipitofrontalis'],
   note='Forreste del af m. occipitofrontalis.', noteEn='Frontal belly of the occipitofrontalis.')
mu('temporalis', 'Tindingemusklen', 'M. temporalis', 'Temporalis', 'hoved-hals', 'muskel', S, A,
   'Fossa temporalis på kraniets side.', 'Processus coronoideus på underkæben.', 'Lukker kæben (løfter underkæben) og trækker den tilbage.',
   'Temporal fossa on the side of the skull.', 'Coronoid process of the mandible.', 'Closes the jaw (elevates the mandible) and retracts it.',
   aliases=['tindingen'], aliasesEn=['temple'])
mu('masseter', 'Tyggemusklen', 'M. masseter', 'Masseter', 'hoved-hals', 'muskel', S, A,
   'Arcus zygomaticus (kindbensbuen).', 'Ydersiden af underkæbens vinkel og gren.', 'Lukker kæben.',
   'Zygomatic arch.', 'Lateral surface of the angle and ramus of the mandible.', 'Closes the jaw.',
   aliases=['tyggemuskulatur', 'den store tyggemuskel'], aliasesEn=['chewing muscle'])
mu('sternocleidomastoideus', 'Kopnikkeren', 'M. sternocleidomastoideus', 'Sternocleidomastoid', 'hoved-hals', 'muskel', S, A,
   'Manubrium sterni og den mediale del af kravebenet.', 'Processus mastoideus bag øret.',
   'Ensidigt: bøjer hovedet til samme side og drejer det til modsat side. Begge sider: bøjer halsen.',
   'Manubrium of the sternum and medial part of the clavicle.', 'Mastoid process behind the ear.',
   'One side: tilts the head to the same side and turns it to the opposite side. Both sides: flex the neck.',
   aliases=['SCM'], aliasesEn=['SCM'])
mu('suboccipitales', 'De suboccipitale muskler', 'Mm. suboccipitales', 'Suboccipital muscles', 'hoved-hals', 'gruppe', D, P,
   'Atlas (C1) og axis (C2).', 'Nakkebenet (os occipitale) og atlas.', 'Strækker og drejer hovedet; finjusterer hovedets stilling.',
   'Atlas (C1) and axis (C2).', 'Occipital bone and atlas.', 'Extend and rotate the head; fine-tune head position.',
   aliases=['kraniekanten', 'suboccipital muskulatur', 'de korte nakkemuskler'], aliasesEn=['suboccipitals'],
   daStatus=REVIEW, daReason='Dansk praksis bruger det latinsk afledte navn. ”De korte nakkemuskler” forekommer også, men er ikke verificeret som fast betegnelse.',
   note='Dybt liggende gruppe (bl.a. mm. recti capitis posteriores og mm. obliqui capitis) under kraniekanten.',
   noteEn='Deep group (including rectus capitis posterior and obliquus capitis muscles) below the base of the skull.')
mu('levator-scapulae', 'Skulderbladsløfteren', 'M. levator scapulae', 'Levator scapulae', 'hoved-hals', 'muskel', D, P,
   'Processus transversi på C1–C4.', 'Angulus superior scapulae (skulderbladets øvre vinkel).', 'Løfter skulderbladet og bøjer halsen til samme side.',
   'Transverse processes of C1–C4.', 'Superior angle of the scapula.', 'Elevates the scapula and bends the neck to the same side.',
   note='Ligger for en stor del under m. trapezius.', noteEn='Lies largely beneath the trapezius.')

# ---------------- Skulder og ryg ----------------
mu('trapezius', 'Kappemusklen', 'M. trapezius', 'Trapezius', 'skulder-ryg', 'muskel', S, AP,
   'Protuberantia occipitalis externa, lig. nuchae og processus spinosi C7–T12.',
   'Laterale tredjedel af kravebenet, acromion og spina scapulae.',
   'Øvre del løfter skulderbladet; midterste del trækker det ind mod rygsøjlen; nedre del sænker det. Roterer skulderbladet opad.',
   'External occipital protuberance, nuchal ligament and spinous processes of C7–T12.',
   'Lateral third of the clavicle, acromion and spine of the scapula.',
   'Upper part elevates the scapula; middle part retracts it; lower part depresses it. Rotates the scapula upward.',
   aliases=['øvre trapezius', 'nakkemuskler'], aliasesEn=['upper trapezius'])
mu('deltoideus', 'Deltamusklen', 'M. deltoideus', 'Deltoid', 'skulder-ryg', 'muskel', S, AP,
   'Laterale tredjedel af kravebenet, acromion og spina scapulae.', 'Tuberositas deltoidea på overarmsknoglen.',
   'Fører armen ud fra kroppen (abduktion); forreste del bøjer, bageste del strækker i skulderleddet.',
   'Lateral third of the clavicle, acromion and spine of the scapula.', 'Deltoid tuberosity of the humerus.',
   'Abducts the arm; the anterior part flexes and the posterior part extends the shoulder.',
   aliases=['deltoidues'], aliasesEn=['deltoideus'])
mu('infraspinatus', 'Infraspinatus', 'M. infraspinatus', 'Infraspinatus', 'skulder-ryg', 'muskel', S, P,
   'Fossa infraspinata på skulderbladet.', 'Tuberculum majus på overarmsknoglen.', 'Udadroterer armen; stabiliserer skulderleddet (rotatormanchetten).',
   'Infraspinous fossa of the scapula.', 'Greater tubercle of the humerus.', 'Laterally rotates the arm; stabilises the shoulder joint (rotator cuff).',
   aliases=['underkamsmusklen'],
   daStatus=REVIEW, daReason='Intet etableret dansk navn kunne verificeres; dansk praksis bruger ”infraspinatus”. Tidligere version brugte ”Underkamsmusklen” – ikke verificeret.')
mu('teres-major', 'Den store rundmuskel', 'M. teres major', 'Teres major', 'skulder-ryg', 'muskel', S, P,
   'Angulus inferior scapulae (skulderbladets nedre vinkel).', 'Crista tuberculi minoris på overarmsknoglen.', 'Indadroterer, fører armen ind mod kroppen og strækker den.',
   'Inferior angle of the scapula.', 'Crest of the lesser tubercle of the humerus.', 'Medially rotates, adducts and extends the arm.',
   daStatus=REVIEW, daReason='”Den store rundmuskel” er en direkte oversættelse, der forekommer i dansk litteratur, men bør bekræftes.')
mu('latissimus-dorsi', 'Den brede rygmuskel', 'M. latissimus dorsi', 'Latissimus dorsi', 'skulder-ryg', 'muskel', S, P,
   'Processus spinosi T7–L5 via fascia thoracolumbalis, hoftekammen og de nederste ribben.',
   'Crista tuberculi minoris på overarmsknoglen.', 'Strækker armen, fører den ind mod kroppen og indadroterer den.',
   'Spinous processes of T7–L5 via the thoracolumbar fascia, iliac crest and lower ribs.',
   'Crest of the lesser tubercle of the humerus.', 'Extends, adducts and medially rotates the arm.',
   aliasesEn=['lats'])
mu('erector-spinae', 'Rygstrækkeren', 'M. erector spinae', 'Erector spinae', 'skulder-ryg', 'gruppe', S, P,
   'Korsbenet, hoftekammen og processus spinosi i lænden.', 'Ribben, ryghvirvler og kraniets basis.',
   'Strækker rygsøjlen og bøjer den til siden.',
   'Sacrum, iliac crest and lumbar spinous processes.', 'Ribs, vertebrae and the base of the skull.',
   'Extends the spine and bends it to the side.',
   aliases=['rygstrækkeren', 'lænden'], aliasesEn=['paraspinal muscles', 'lower back'],
   note='Muskelgruppe (m. iliocostalis, m. longissimus, m. spinalis). I lænden ligger den under fascia thoracolumbalis.',
   noteEn='Muscle group (iliocostalis, longissimus, spinalis). In the lower back it lies beneath the thoracolumbar fascia.')

# ---------------- Bryst og mave ----------------
mu('pectoralis-major', 'Den store brystmuskel', 'M. pectoralis major', 'Pectoralis major', 'bryst-mave', 'muskel', S, A,
   'Mediale del af kravebenet, brystbenet og ribbensbrusk 1–6.', 'Crista tuberculi majoris på overarmsknoglen.',
   'Fører armen ind mod kroppen og indadroterer den; den øvre del bøjer i skulderleddet.',
   'Medial part of the clavicle, sternum and costal cartilages 1–6.', 'Crest of the greater tubercle of the humerus.',
   'Adducts and medially rotates the arm; the upper part flexes the shoulder.',
   aliases=['brystmusklen', 'brystmuskelen'], aliasesEn=['pecs', 'chest muscle'])
mu('pectoralis-minor', 'Den lille brystmuskel', 'M. pectoralis minor', 'Pectoralis minor', 'bryst-mave', 'muskel', D, A,
   '3.–5. ribben.', 'Processus coracoideus på skulderbladet.', 'Trækker skulderbladet fremad og nedad.',
   'Ribs 3–5.', 'Coracoid process of the scapula.', 'Draws the scapula forward and downward.',
   note='Ligger under m. pectoralis major.', noteEn='Lies beneath the pectoralis major.')
mu('serratus-anterior', 'Den forreste savtakkede muskel', 'M. serratus anterior', 'Serratus anterior', 'bryst-mave', 'muskel', S, A,
   'Ydersiden af 1.–8./9. ribben.', 'Forsiden af skulderbladets mediale kant.', 'Trækker skulderbladet frem og roterer det opad; holder det ind mod brystkassen.',
   'Outer surfaces of ribs 1–8/9.', 'Anterior surface of the medial border of the scapula.', 'Protracts and upwardly rotates the scapula; holds it against the chest wall.',
   aliases=['savmusklen'],
   daStatus=REVIEW, daReason='”Den forreste savtakkede muskel” forekommer i dansk litteratur; kortformen ”savmusklen” bruges også. Bør bekræftes.')
mu('rectus-abdominis', 'Den lige bugmuskel', 'M. rectus abdominis', 'Rectus abdominis', 'bryst-mave', 'muskel', S, A,
   'Skambenet (crista pubica og symfysen).', 'Processus xiphoideus og ribbensbrusk 5–7.', 'Bøjer overkroppen fremad.',
   'Pubic crest and pubic symphysis.', 'Xiphoid process and costal cartilages 5–7.', 'Flexes the trunk.',
   aliasesEn=['abs', 'six-pack'])
mu('obliquus-externus', 'Den ydre skrå bugmuskel', 'M. obliquus externus abdominis', 'External oblique', 'bryst-mave', 'muskel', S, A,
   'Ydersiden af 5.–12. ribben.', 'Hoftekammen, lyskebåndet og linea alba.', 'Bøjer og roterer overkroppen; bøjer til siden.',
   'Outer surfaces of ribs 5–12.', 'Iliac crest, inguinal ligament and linea alba.', 'Flexes and rotates the trunk; bends it to the side.',
   aliasesEn=['external abdominal oblique'])

# ---------------- Arm ----------------
mu('biceps-brachii', 'Den tohovedede overarmsmuskel', 'M. biceps brachii', 'Biceps brachii', 'arm', 'muskel', S, A,
   'Langt hoved: tuberculum supraglenoidale. Kort hoved: processus coracoideus.', 'Tuberositas radii og aponeurosis bicipitalis.',
   'Bøjer albuen og drejer underarmen udad (supination).',
   'Long head: supraglenoid tubercle. Short head: coracoid process.', 'Radial tuberosity and bicipital aponeurosis.',
   'Flexes the elbow and supinates the forearm.',
   aliases=['biceps'], aliasesEn=['biceps'])
mu('triceps-brachii', 'Den trehovedede overarmsmuskel', 'M. triceps brachii', 'Triceps brachii', 'arm', 'muskel', S, P,
   'Langt hoved: tuberculum infraglenoidale. Ydre og indre hoved: bagsiden af overarmsknoglen.', 'Olecranon på albuebenet.',
   'Strækker albuen; det lange hoved strækker også i skulderleddet og fører armen ind mod kroppen.',
   'Long head: infraglenoid tubercle. Lateral and medial heads: posterior humerus.', 'Olecranon of the ulna.',
   'Extends the elbow; the long head also extends and adducts the shoulder.',
   aliases=['triceps', 'tricepsudspring'], aliasesEn=['triceps'])
mu('brachioradialis', 'Brachioradialis', 'M. brachioradialis', 'Brachioradialis', 'arm', 'muskel', S, A,
   'Crista supracondylaris lateralis på overarmsknoglen.', 'Processus styloideus radii.', 'Bøjer albuen, især med underarmen i midtstilling.',
   'Lateral supracondylar ridge of the humerus.', 'Styloid process of the radius.', 'Flexes the elbow, especially with the forearm in mid-position.',
   aliases=['overarm-spolebensmusklen'],
   daStatus=REVIEW, daReason='Intet etableret dansk navn kunne verificeres; dansk praksis bruger ”brachioradialis”. Tidligere version brugte ”Overarm-spolebensmusklen” – ikke verificeret.')
mu('flexores-antebrachii', 'Underarmens bøjemuskler', 'Mm. flexores antebrachii', 'Forearm flexors', 'arm', 'gruppe', S, A,
   'Hovedsageligt epicondylus medialis humeri (fælles bøjesene).', 'Håndrodsknogler, mellemhåndsknogler og fingre.',
   'Bøjer håndled og fingre.',
   'Mainly the medial epicondyle of the humerus (common flexor tendon).', 'Carpal bones, metacarpals and fingers.',
   'Flex the wrist and fingers.',
   aliases=['fleksorerne'], aliasesEn=['flexor group'],
   note='Overfladisk gruppe på underarmens inderside (bl.a. m. flexor carpi radialis, m. palmaris longus, m. flexor carpi ulnaris).',
   noteEn='Superficial group on the front of the forearm (including flexor carpi radialis, palmaris longus, flexor carpi ulnaris).')
mu('extensores-antebrachii', 'Underarmens strækkemuskler', 'Mm. extensores antebrachii', 'Forearm extensors', 'arm', 'gruppe', S, P,
   'Hovedsageligt epicondylus lateralis humeri (fælles strækkesene).', 'Mellemhåndsknogler og fingre.',
   'Strækker håndled og fingre.',
   'Mainly the lateral epicondyle of the humerus (common extensor tendon).', 'Metacarpals and fingers.',
   'Extend the wrist and fingers.',
   aliases=['ekstensorerne'], aliasesEn=['extensor group'],
   note='Overfladisk gruppe på underarmens bagside (bl.a. m. extensor digitorum, mm. extensores carpi radiales, m. extensor carpi ulnaris).',
   noteEn='Superficial group on the back of the forearm (including extensor digitorum, extensor carpi radialis, extensor carpi ulnaris).')

# ---------------- Hofte og ben ----------------
mu('gluteus-maximus', 'Den store sædemuskel', 'M. gluteus maximus', 'Gluteus maximus', 'hofte-ben', 'muskel', S, P,
   'Bagsiden af hoftebenet, korsbenet og halebenet.', 'Tuberositas glutea på lårbenet og tractus iliotibialis.', 'Strækker og udadroterer hoften.',
   'Posterior ilium, sacrum and coccyx.', 'Gluteal tuberosity of the femur and iliotibial tract.', 'Extends and laterally rotates the hip.')
mu('gluteus-medius', 'Den mellemste sædemuskel', 'M. gluteus medius', 'Gluteus medius', 'hofte-ben', 'muskel', S, P,
   'Ydersiden af hoftebenet.', 'Trochanter major på lårbenet.', 'Fører benet ud fra kroppen (abduktion) og stabiliserer bækkenet ved gang.',
   'Outer surface of the ilium.', 'Greater trochanter of the femur.', 'Abducts the hip and stabilises the pelvis when walking.',
   note='Den øvre-laterale del ligger overfladisk; resten dækkes af m. gluteus maximus.',
   noteEn='The upper lateral part is superficial; the rest is covered by the gluteus maximus.')
mu('tensor-fasciae-latae', 'Tensor fasciae latae', 'M. tensor fasciae latae', 'Tensor fasciae latae', 'hofte-ben', 'muskel', S, A,
   'Spina iliaca anterior superior.', 'Tractus iliotibialis.', 'Bøjer, fører benet ud og indadroterer hoften; spænder tractus iliotibialis.',
   'Anterior superior iliac spine.', 'Iliotibial tract.', 'Flexes, abducts and medially rotates the hip; tenses the iliotibial tract.',
   aliases=['TFL', 'lårbindehindespænderen'], aliasesEn=['TFL'],
   daStatus=REVIEW, daReason='Intet etableret dansk navn kunne verificeres; dansk praksis bruger ”TFL”/”tensor fasciae latae”. Tidligere version brugte ”Lårbindehindespænderen” – ikke verificeret.')
mu('tractus-iliotibialis', 'IT-båndet', 'Tractus iliotibialis', 'Iliotibial tract (IT band)', 'hofte-ben', 'bindevæv', S, AP,
   'Forstærkning af fascia lata fra hoftekammen (modtager fibre fra m. tensor fasciae latae og m. gluteus maximus).',
   'Condylus lateralis tibiae (Gerdys tuberkel).', 'Stabiliserer hofte og knæ på lårets yderside.',
   'Thickening of the fascia lata from the iliac crest (receives fibres from tensor fasciae latae and gluteus maximus).',
   'Lateral condyle of the tibia (Gerdy\'s tubercle).', 'Stabilises the hip and knee on the outside of the thigh.',
   aliases=['tractus iliotibiales', 'IT-bånd', 'iliotibialbåndet'], aliasesEn=['IT band', 'iliotibial band'],
   daStatus=REVIEW, daReason='”IT-båndet” er den almindelige danske betegnelse i praksis; en formel dansk anatomisk betegnelse er ikke verificeret.',
   note='Ikke en muskel, men et forstærket bindevævsbånd.', noteEn='Not a muscle but a thickened band of connective tissue.')
mu('sartorius', 'Skræddermusklen', 'M. sartorius', 'Sartorius', 'hofte-ben', 'muskel', S, A,
   'Spina iliaca anterior superior.', 'Mediale side af skinnebenet (pes anserinus).', 'Bøjer, fører ud og udadroterer hoften; bøjer knæet.',
   'Anterior superior iliac spine.', 'Medial surface of the tibia (pes anserinus).', 'Flexes, abducts and laterally rotates the hip; flexes the knee.',
   aliases=['satorius'], aliasesEn=['tailor\'s muscle'])
mu('rectus-femoris', 'Den lige lårmuskel', 'M. rectus femoris', 'Rectus femoris', 'hofte-ben', 'muskel', S, A,
   'Spina iliaca anterior inferior.', 'Via knæskallen og lig. patellae til tuberositas tibiae.', 'Strækker knæet og bøjer hoften.',
   'Anterior inferior iliac spine.', 'Via the patella and patellar ligament to the tibial tuberosity.', 'Extends the knee and flexes the hip.',
   aliases=['quadriceps', 'den firehovedede lårmuskel'], aliasesEn=['quadriceps'], partOf='quadriceps-femoris')
mu('vastus-lateralis', 'Den ydre brede lårmuskel', 'M. vastus lateralis', 'Vastus lateralis', 'hofte-ben', 'muskel', S, A,
   'Trochanter major og laterale læbe af linea aspera.', 'Via quadricepssenen og knæskallen til tuberositas tibiae.', 'Strækker knæet.',
   'Greater trochanter and lateral lip of the linea aspera.', 'Via the quadriceps tendon and patella to the tibial tuberosity.', 'Extends the knee.',
   aliases=['quadriceps', 'den firehovedede lårmuskel'], aliasesEn=['quadriceps'], partOf='quadriceps-femoris',
   daStatus=REVIEW, daReason='Oversættelsen af ”vastus” er ikke ensartet i dansk litteratur (”brede”/”store”). Bør bekræftes.')
mu('vastus-medialis', 'Den indre brede lårmuskel', 'M. vastus medialis', 'Vastus medialis', 'hofte-ben', 'muskel', S, A,
   'Mediale læbe af linea aspera.', 'Via quadricepssenen og knæskallen til tuberositas tibiae.', 'Strækker knæet.',
   'Medial lip of the linea aspera.', 'Via the quadriceps tendon and patella to the tibial tuberosity.', 'Extends the knee.',
   aliases=['quadriceps', 'den firehovedede lårmuskel'], aliasesEn=['quadriceps', 'VMO'], partOf='quadriceps-femoris',
   daStatus=REVIEW, daReason='Oversættelsen af ”vastus” er ikke ensartet i dansk litteratur (”brede”/”store”). Bør bekræftes.')
mu('adductores', 'Lårets adduktorer', 'Mm. adductores femoris', 'Hip adductors', 'hofte-ben', 'gruppe', S, A,
   'Skambenet og sædebenets gren (m. adductor magnus også tuber ischiadicum).', 'Linea aspera på lårbenet (m. adductor magnus også tuberculum adductorium).',
   'Fører låret ind mod midtlinjen (adduktion).',
   'Pubis and ischial ramus (adductor magnus also from the ischial tuberosity).', 'Linea aspera of the femur (adductor magnus also the adductor tubercle).',
   'Adduct the thigh (draw it towards the midline).',
   aliases=['adduktorerne', 'indadførerne'], aliasesEn=['adductors', 'groin muscles'],
   note='Gruppe: bl.a. m. adductor longus, m. adductor brevis og m. adductor magnus. I atlasset vises den overfladiske del på lårets inderside.',
   noteEn='Group: including adductor longus, adductor brevis and adductor magnus. The atlas shows the superficial part on the inner thigh.')
mu('gracilis', 'Den slanke lårmuskel', 'M. gracilis', 'Gracilis', 'hofte-ben', 'muskel', S, A,
   'Skambenets nedre gren.', 'Mediale side af skinnebenet (pes anserinus).', 'Fører låret ind mod kroppen og bøjer knæet.',
   'Inferior pubic ramus.', 'Medial surface of the tibia (pes anserinus).', 'Adducts the hip and flexes the knee.',
   aliases=['den slanke muskel'],
   daStatus=REVIEW, daReason='Både ”den slanke muskel” og ”den slanke lårmuskel” forekommer; bør bekræftes.')
mu('biceps-femoris', 'Den tohovedede lårmuskel', 'M. biceps femoris', 'Biceps femoris', 'hofte-ben', 'muskel', S, P,
   'Langt hoved: tuber ischiadicum. Kort hoved: linea aspera.', 'Lægbenets hoved (caput fibulae).', 'Bøjer knæet; det lange hoved strækker også hoften.',
   'Long head: ischial tuberosity. Short head: linea aspera.', 'Head of the fibula.', 'Flexes the knee; the long head also extends the hip.',
   aliases=['haserne', 'hasemuskler', 'hamstrings'], aliasesEn=['hamstrings', 'lateral hamstring'])
mu('semitendinosus', 'Den halvsenede muskel', 'M. semitendinosus', 'Semitendinosus', 'hofte-ben', 'muskel', S, P,
   'Tuber ischiadicum.', 'Mediale side af skinnebenet (pes anserinus).', 'Bøjer knæet og strækker hoften.',
   'Ischial tuberosity.', 'Medial surface of the tibia (pes anserinus).', 'Flexes the knee and extends the hip.',
   aliases=['haserne', 'hasemuskler', 'hamstrings'], aliasesEn=['hamstrings', 'medial hamstring'])
mu('semimembranosus', 'Den halvhindede muskel', 'M. semimembranosus', 'Semimembranosus', 'hofte-ben', 'muskel', S, P,
   'Tuber ischiadicum.', 'Bagsiden af skinnebenets indre knold (condylus medialis tibiae).', 'Bøjer knæet og strækker hoften.',
   'Ischial tuberosity.', 'Posterior medial condyle of the tibia.', 'Flexes the knee and extends the hip.',
   aliases=['haserne', 'hasemuskler', 'hamstrings'], aliasesEn=['hamstrings', 'medial hamstring'],
   note='Ligger delvist under m. semitendinosus; synlig medialt i den nedre del af låret.',
   noteEn='Lies partly beneath the semitendinosus; visible medially in the lower thigh.')
mu('gastrocnemius', 'Den tohovedede lægmuskel', 'M. gastrocnemius', 'Gastrocnemius', 'hofte-ben', 'muskel', S, AP,
   'Lårbenets indre og ydre knold (condylus medialis og lateralis femoris).', 'Hælbenet (tuber calcanei) via akillessenen.',
   'Strækker foden i ankelleddet (plantarfleksion) og bøjer knæet.',
   'Medial and lateral condyles of the femur.', 'Calcaneal tuberosity via the Achilles tendon.',
   'Plantar-flexes the foot and flexes the knee.',
   aliases=['lægmusklen', 'gastronecmius', 'tvillingelægmusklen'], aliasesEn=['calf muscle'], partOf='triceps-surae',
   note='Har to hoveder fra lårbenet. Sammen med m. soleus (1 hoved) udgør den m. triceps surae.',
   noteEn='Has two heads from the femur. Together with the soleus (one head) it makes up the triceps surae.')
mu('soleus', 'Flyndermusklen', 'M. soleus', 'Soleus', 'hofte-ben', 'muskel', S, AP,
   'Bagsiden af lægbenets hoved og øvre del af skinnebenet (linea musculi solei).', 'Hælbenet (tuber calcanei) via akillessenen.',
   'Strækker foden i ankelleddet (plantarfleksion).',
   'Posterior head of the fibula and upper tibia (soleal line).', 'Calcaneal tuberosity via the Achilles tendon.',
   'Plantar-flexes the foot.',
   aliases=['lægmusklen'], aliasesEn=['calf muscle'], partOf='triceps-surae',
   note='Ligger under m. gastrocnemius. Sammen med den (2 hoveder) udgør den m. triceps surae.',
   noteEn='Lies beneath the gastrocnemius. Together with it (two heads) it makes up the triceps surae.')
mu('tendo-calcaneus', 'Akillessenen', 'Tendo calcaneus', 'Achilles tendon (calcaneal tendon)', 'hofte-ben', 'sene', S, P,
   'Fælles sene fra m. gastrocnemius og m. soleus.', 'Hælbenet (tuber calcanei).', 'Overfører kraften fra lægmusklerne til hælen.',
   'Common tendon of the gastrocnemius and soleus.', 'Calcaneal tuberosity (heel bone).', 'Transmits the force of the calf muscles to the heel.',
   aliases=['achillessene', 'achillessenen', 'akillessene', 'hælsenen'], aliasesEn=['Achilles', 'heel cord'])
mu('tibialis-anterior', 'Den forreste skinnebensmuskel', 'M. tibialis anterior', 'Tibialis anterior', 'hofte-ben', 'muskel', S, A,
   'Skinnebenets laterale flade og membrana interossea.', 'Os cuneiforme mediale og basis af 1. mellemfodsknogle.', 'Løfter foden (dorsalfleksion) og drejer fodsålen indad (supination).',
   'Lateral surface of the tibia and interosseous membrane.', 'Medial cuneiform and base of the 1st metatarsal.', 'Dorsiflexes and inverts the foot.',
   aliasesEn=['shin muscle'])
mu('fibularis-longus', 'Den lange lægbensmuskel', 'M. fibularis longus', 'Fibularis (peroneus) longus', 'hofte-ben', 'muskel', S, A,
   'Lægbenets hoved og øvre del af lægbenets yderside.', 'Os cuneiforme mediale og basis af 1. mellemfodsknogle (under fodsålen).', 'Strækker foden (plantarfleksion) og drejer fodsålen udad (pronation).',
   'Head and upper lateral surface of the fibula.', 'Medial cuneiform and base of the 1st metatarsal (sole of the foot).', 'Plantar-flexes and everts the foot.',
   aliases=['m. peroneus longus', 'peroneus'], aliasesEn=['peroneus longus'])

# Muscle groups referenced in text but not drawn as separate shapes in the atlas.
GROUPS = [
  {'id': 'triceps-surae', 'nameDa': 'Den trehovedede lægmuskel', 'nameLatin': 'M. triceps surae', 'nameEn': 'Triceps surae',
   'parts': ['gastrocnemius', 'soleus'], 'aliases': ['lægmusklen', 'lægmusklerne'], 'aliasesEn': ['calf muscles'],
   'daStatus': OK, 'daReason': None},
  {'id': 'quadriceps-femoris', 'nameDa': 'Den firehovedede lårmuskel', 'nameLatin': 'M. quadriceps femoris', 'nameEn': 'Quadriceps femoris',
   'parts': ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis'], 'aliases': ['quadriceps'], 'aliasesEn': ['quads'],
   'daStatus': OK, 'daReason': None},
]

here = os.path.dirname(__file__)
json.dump(M, open(os.path.join(here, '..', 'src', 'content', 'muscles.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.dump(GROUPS, open(os.path.join(here, '..', 'src', 'content', 'muscle-groups.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# ---------------- docs/MUSCLE_TERMINOLOGY.md ----------------
GROUP_DA = {'hoved-hals': 'Hoved og hals', 'skulder-ryg': 'Skulder og ryg', 'bryst-mave': 'Bryst og mave', 'arm': 'Arm', 'hofte-ben': 'Hofte og ben'}
def alt(m):
    a = [x for x in m['aliases'] if x.lower() != m['nameDa'].lower() and x.lower() not in SEARCH_ONLY]
    e = [x for x in m.get('aliasesEn', []) if x.lower() not in SEARCH_ONLY]
    parts = []
    if a: parts.append('DA: ' + ', '.join(a))
    if e: parts.append('EN: ' + ', '.join(e))
    return '; '.join(parts) or '–'
lines = [
 '# Muskelterminologi – MassageAtlas',
 '',
 '_Genereret af `scripts/build-muscles.py` – ret i scriptet, ikke i denne fil._',
 '',
 'Alle muskler og strukturer, der bruges i appen (atlas, greb, quiz). Det interne ID er sprogneutralt og må ikke ændres.',
 '',
 '- **Latin:** Terminologia Anatomica-stavning, forkortet på sædvanlig vis (M. = musculus, Mm. = musculi).',
 '- **Dansk:** gængse danske anatomiske navne i bestemt form. Hvor der ikke er et sikkert, gængs dansk navn, vises det latinsk afledte navn, som bruges i dansk praksis, og rækken er markeret ⚠︎ *til gennemsyn*. Der er ikke opfundet nye oversættelser.',
 '- **Status:** ”✓ gængs” betyder, at navnet er den almindelige danske betegnelse efter bedste viden. Navnene er ikke slået op i en autoriseret ordliste under arbejdet, så hele tabellen bør gennemses mod en dansk anatomibog; de ⚠︎-markerede rækker først.',
 '- Tidligere navne og stavefejl fra hæftet virker stadig som søgeord, men vises ikke her.',
 '- **Engelsk:** gængse engelske anatomiske navne.',
 '',
 '| ID | Latin | Engelsk | Dansk | Alternative / almindelige navne | Status |',
 '|---|---|---|---|---|---|',
]
for g in GROUP_DA:
    for m in [x for x in M if x['group'] == g]:
        st = '✓ gængs' if m['daStatus'] == OK else '⚠︎ til gennemsyn'
        lines.append(f"| `{m['id']}` | {m['nameLatin']} | {m['nameEn']} | {m['nameDa']} | {alt(m)} | {st} |")
lines += ['', '## Muskelgrupper (nævnt i tekst, ikke tegnet som egen form)', '',
          '| ID | Latin | Engelsk | Dansk | Består af | Alternative navne | Status |', '|---|---|---|---|---|---|---|']
for gr in GROUPS:
    parts = ', '.join(next(x['nameLatin'] for x in M if x['id'] == p) for p in gr['parts'])
    lines.append(f"| `{gr['id']}` | {gr['nameLatin']} | {gr['nameEn']} | {gr['nameDa']} | {parts} | DA: {', '.join(gr['aliases'])}; EN: {', '.join(gr['aliasesEn'])} | ✓ gængs |")
lines += ['', '## Vigtige skel', '',
          '- **M. gastrocnemius** = *den tohovedede lægmuskel* (to hoveder fra lårbenet).',
          '- **M. soleus** = *flyndermusklen* (ligger under gastrocnemius). Tidligere fejlagtigt ”Fladfiskemusklen”.',
          '- **M. triceps surae** = *den trehovedede lægmuskel* = gastrocnemius (2 hoveder) + soleus (1 hoved). Hæftets ”lægmusklen” svarer til denne gruppe.',
          '', '## Til manuel gennemsyn', '']
for m in M:
    if m['daStatus'] != OK:
        lines.append(f"- **{m['nameLatin']}** – vist som ”{m['nameDa']}”. {m['daReason']}")
lines += ['', '## Ændringer i denne gennemgang', '',
          '| Latin | Før | Nu |', '|---|---|---|']
CHANGES = [
 ('M. soleus', 'Fladfiskemusklen', 'Flyndermusklen'),
 ('M. gastrocnemius', 'Tvillingelægmusklen', 'Den tohovedede lægmuskel'),
 ('M. biceps brachii', 'Tohovedet overarmsmuskel', 'Den tohovedede overarmsmuskel'),
 ('M. triceps brachii', 'Trehovedet overarmsmuskel', 'Den trehovedede overarmsmuskel'),
 ('M. biceps femoris', 'Tohovedet lårmuskel', 'Den tohovedede lårmuskel'),
 ('M. infraspinatus', 'Underkamsmusklen', 'Infraspinatus (⚠︎)'),
 ('M. brachioradialis', 'Overarm-spolebensmusklen', 'Brachioradialis (⚠︎)'),
 ('M. tensor fasciae latae', 'Lårbindehindespænderen', 'Tensor fasciae latae (⚠︎)'),
 ('M. gracilis', 'Den slanke muskel', 'Den slanke lårmuskel (⚠︎)'),
 ('Flere', 'Ubestemt form (”Store brystmuskel”, ”Lige bugmuskel” …)', 'Bestemt form (”Den store brystmuskel”, ”Den lige bugmuskel” …)'),
]
for c in CHANGES: lines.append(f'| {c[0]} | {c[1]} | {c[2]} |')
open(os.path.join(here, '..', 'docs', 'MUSCLE_TERMINOLOGY.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(len(M), 'muscles,', len(GROUPS), 'groups,', sum(1 for m in M if m['daStatus'] != OK), 'Danish names for review')
