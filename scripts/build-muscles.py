"""Builds src/content/muscles.json – the shared muscle records used by atlas,
techniques and quiz. IDs are stable and must never be renamed (future 3D model
will reference the same IDs). Anatomy facts are standard textbook anatomy, not
taken from the booklet; they are marked contentStatus 'standard-til-gennemsyn'.
Run: python3 scripts/build-muscles.py
"""
import json, os
M = []
def mu(id, da, la, group, kind, layer, views, origin, insertion, action, aliases=(), daUncertain=False, note=None, quiz=True):
    M.append({
        "id": id, "nameDa": da, "nameLatin": la, "group": group, "kind": kind, "layer": layer,
        "views": views, "origin": origin, "insertion": insertion, "action": action,
        "aliases": list(aliases), "danishNameUncertain": daUncertain, "note": note,
        "quizEligible": quiz and layer == "superficial",
        "contentStatus": "standard-til-gennemsyn",
    })
A, P, AP = ["anterior"], ["posterior"], ["anterior", "posterior"]
S, D = "superficial", "deep"

# Hoved og hals
mu("frontalis","Pandemusklen","M. frontalis","hoved-hals","muskel",S,A,
   "Galea aponeurotica (hovedets senehjelm).","Huden ved øjenbrynene.","Løfter øjenbrynene og rynker panden.",
   aliases=["venter frontalis","m. occipitofrontalis"], note="Forreste del af m. occipitofrontalis.")
mu("temporalis","Tindingemusklen","M. temporalis","hoved-hals","muskel",S,A,
   "Fossa temporalis på kraniets side.","Processus coronoideus på underkæben.","Lukker kæben (løfter mandiblen) og trækker den tilbage.",
   aliases=["tindingen"])
mu("masseter","Tyggemusklen","M. masseter","hoved-hals","muskel",S,A,
   "Arcus zygomaticus (kindbensbuen).","Ydersiden af underkæbens vinkel og gren.","Lukker kæben.",
   aliases=["tyggemuskulatur","store tyggemuskel"])
mu("sternocleidomastoideus","Kopnikkeren","M. sternocleidomastoideus","hoved-hals","muskel",S,A,
   "Manubrium sterni og den mediale del af clavicula.","Processus mastoideus bag øret.",
   "Ensidigt: bøjer hovedet til samme side og drejer det til modsat side. Begge sider: bøjer halsen.",
   aliases=["SCM"])
mu("suboccipitales","Suboccipitale muskler","Mm. suboccipitales","hoved-hals","gruppe",D,P,
   "Atlas (C1) og axis (C2).","Nakkebenet (os occipitale) og atlas.","Strækker og drejer hovedet; finjusterer hovedets stilling.",
   aliases=["kraniekanten","suboccipital muskulatur"], daUncertain=True,
   note="Dybt liggende gruppe (bl.a. mm. recti capitis posteriores og mm. obliqui capitis) under kraniekanten.")
mu("levator-scapulae","Skulderbladsløfteren","M. levator scapulae","hoved-hals","muskel",D,P,
   "Processus transversi på C1–C4.","Angulus superior scapulae (skulderbladets øvre vinkel).","Løfter skulderbladet og bøjer halsen til samme side.",
   note="Ligger for en stor del under m. trapezius.")
# Skulder og ryg
mu("trapezius","Kappemusklen","M. trapezius","skulder-ryg","muskel",S,AP,
   "Protuberantia occipitalis externa, lig. nuchae og processus spinosi C7–T12.",
   "Laterale tredjedel af clavicula, acromion og spina scapulae.",
   "Øvre del løfter skulderbladet; midterste trækker det mod rygsøjlen; nedre sænker det. Roterer skulderbladet opad.",
   aliases=["øvre trapezius","nakkemuskler"])
mu("deltoideus","Deltamusklen","M. deltoideus","skulder-ryg","muskel",S,AP,
   "Laterale tredjedel af clavicula, acromion og spina scapulae.","Tuberositas deltoidea på humerus.",
   "Abducerer armen i skulderleddet; forreste del bøjer, bageste del strækker.",
   aliases=["deltoidues"])
mu("infraspinatus","Underkamsmusklen","M. infraspinatus","skulder-ryg","muskel",S,P,
   "Fossa infraspinata på skulderbladet.","Tuberculum majus på humerus.","Udadroterer armen; stabiliserer skulderleddet (rotatormanchetten).",
   daUncertain=True)
mu("teres-major","Store rundmuskel","M. teres major","skulder-ryg","muskel",S,P,
   "Angulus inferior scapulae (skulderbladets nedre vinkel).","Crista tuberculi minoris på humerus.","Indadroterer, adducerer og strækker armen.")
mu("latissimus-dorsi","Brede rygmuskel","M. latissimus dorsi","skulder-ryg","muskel",S,P,
   "Processus spinosi T7–L5 via fascia thoracolumbalis, crista iliaca og de nederste ribben.",
   "Crista tuberculi minoris på humerus.","Strækker, adducerer og indadroterer armen.")
mu("erector-spinae","Rygstrækkeren","M. erector spinae","skulder-ryg","gruppe",S,P,
   "Os sacrum, crista iliaca og processus spinosi i lænden.","Ribben, ryghvirvler og kraniets basis.",
   "Strækker rygsøjlen og bøjer den til siden.",
   aliases=["rygstrækkeren","lænden"],
   note="Muskelgruppe (m. iliocostalis, m. longissimus, m. spinalis). I lænden ligger den under fascia thoracolumbalis.")
# Bryst og mave
mu("pectoralis-major","Store brystmuskel","M. pectoralis major","bryst-mave","muskel",S,A,
   "Mediale del af clavicula, sternum og ribbensbrusk 1–6.","Crista tuberculi majoris på humerus.",
   "Adducerer og indadroterer armen; den øvre del bøjer i skulderleddet.",
   aliases=["brystmusklen","brystmuskelen"])
mu("pectoralis-minor","Lille brystmuskel","M. pectoralis minor","bryst-mave","muskel",D,A,
   "3.–5. ribben.","Processus coracoideus på skulderbladet.","Trækker skulderbladet fremad og nedad.",
   note="Ligger under m. pectoralis major.")
mu("serratus-anterior","Forreste savtakkede muskel","M. serratus anterior","bryst-mave","muskel",S,A,
   "Ydersiden af 1.–8./9. ribben.","Forsiden af skulderbladets mediale kant.","Trækker skulderbladet frem og roterer det opad; holder det ind mod brystkassen.")
mu("rectus-abdominis","Lige bugmuskel","M. rectus abdominis","bryst-mave","muskel",S,A,
   "Os pubis (crista pubica og symfysen).","Processus xiphoideus og ribbensbrusk 5–7.","Bøjer overkroppen fremad.")
mu("obliquus-externus","Ydre skrå bugmuskel","M. obliquus externus abdominis","bryst-mave","muskel",S,A,
   "Ydersiden af 5.–12. ribben.","Crista iliaca, lig. inguinale og linea alba.","Bøjer og roterer overkroppen; bøjer til siden.")
# Arm
mu("biceps-brachii","Tohovedet overarmsmuskel","M. biceps brachii","arm","muskel",S,A,
   "Caput longum: tuberculum supraglenoidale. Caput breve: processus coracoideus.","Tuberositas radii og aponeurosis bicipitalis.",
   "Bøjer albuen og supinerer underarmen.", aliases=["biceps"])
mu("triceps-brachii","Trehovedet overarmsmuskel","M. triceps brachii","arm","muskel",S,P,
   "Caput longum: tuberculum infraglenoidale. Caput laterale og mediale: bagsiden af humerus.","Olecranon på ulna.",
   "Strækker albuen; caput longum strækker og adducerer også i skulderleddet.",
   aliases=["triceps","tricepsudspring"])
mu("brachioradialis","Overarm-spolebensmusklen","M. brachioradialis","arm","muskel",S,A,
   "Crista supracondylaris lateralis på humerus.","Processus styloideus radii.","Bøjer albuen, især med underarmen i midtstilling.",
   daUncertain=True)
mu("flexores-antebrachii","Underarmens bøjemuskler","Mm. flexores antebrachii","arm","gruppe",S,A,
   "Hovedsageligt epicondylus medialis humeri (fælles bøjesene).","Håndrodsknogler, mellemhåndsknogler og fingre.",
   "Bøjer håndled og fingre.",
   note="Overfladisk gruppe på underarmens inderside (bl.a. m. flexor carpi radialis, m. palmaris longus, m. flexor carpi ulnaris).")
mu("extensores-antebrachii","Underarmens strækkemuskler","Mm. extensores antebrachii","arm","gruppe",S,P,
   "Hovedsageligt epicondylus lateralis humeri (fælles strækkesene).","Mellemhåndsknogler og fingre.",
   "Strækker håndled og fingre.",
   note="Overfladisk gruppe på underarmens bagside (bl.a. m. extensor digitorum, mm. extensores carpi radiales, m. extensor carpi ulnaris).")
# Hofte og ben
mu("gluteus-maximus","Store sædemuskel","M. gluteus maximus","hofte-ben","muskel",S,P,
   "Bagsiden af os ilium, os sacrum og os coccygis.","Tuberositas glutea på femur og tractus iliotibialis.","Strækker og udadroterer hoften.")
mu("gluteus-medius","Mellemste sædemuskel","M. gluteus medius","hofte-ben","muskel",S,P,
   "Ydersiden af os ilium.","Trochanter major på femur.","Abducerer hoften og stabiliserer bækkenet ved gang.",
   note="Den øvre-laterale del ligger overfladisk; resten dækkes af m. gluteus maximus.")
mu("tensor-fasciae-latae","Lårbindehindespænderen","M. tensor fasciae latae","hofte-ben","muskel",S,A,
   "Spina iliaca anterior superior.","Tractus iliotibialis.","Bøjer, abducerer og indadroterer hoften; spænder tractus iliotibialis.",
   daUncertain=True, aliases=["TFL"])
mu("tractus-iliotibialis","IT-båndet","Tractus iliotibialis","hofte-ben","bindevæv",S,AP,
   "Forstærkning af fascia lata fra crista iliaca (modtager fibre fra m. tensor fasciae latae og m. gluteus maximus).",
   "Condylus lateralis tibiae (Gerdys tuberkel).","Stabiliserer hofte og knæ på lårets yderside.",
   aliases=["tractus iliotibiales","IT-bånd"], daUncertain=True, note="Ikke en muskel, men et forstærket bindevævsbånd.")
mu("sartorius","Skræddermusklen","M. sartorius","hofte-ben","muskel",S,A,
   "Spina iliaca anterior superior.","Mediale side af tibia (pes anserinus).","Bøjer, abducerer og udadroterer hoften; bøjer knæet.",
   aliases=["satorius"])
mu("rectus-femoris","Lige lårmuskel","M. rectus femoris","hofte-ben","muskel",S,A,
   "Spina iliaca anterior inferior.","Via patella og lig. patellae til tuberositas tibiae.","Strækker knæet og bøjer hoften.",
   aliases=["quadriceps"])
mu("vastus-lateralis","Ydre brede lårmuskel","M. vastus lateralis","hofte-ben","muskel",S,A,
   "Trochanter major og laterale læbe af linea aspera.","Via quadricepssenen og patella til tuberositas tibiae.","Strækker knæet.",
   aliases=["quadriceps"])
mu("vastus-medialis","Indre brede lårmuskel","M. vastus medialis","hofte-ben","muskel",S,A,
   "Mediale læbe af linea aspera.","Via quadricepssenen og patella til tuberositas tibiae.","Strækker knæet.",
   aliases=["quadriceps"])
mu("adductores","Lårets adduktorer","Mm. adductores","hofte-ben","gruppe",S,A,
   "Os pubis og ramus ossis ischii (m. adductor magnus også tuber ischiadicum).","Linea aspera på femur (m. adductor magnus også tuberculum adductorium).",
   "Fører låret ind mod midtlinjen (adduktion).",
   note="Gruppe: bl.a. m. adductor longus, m. adductor brevis og m. adductor magnus. I atlasset vises den overfladiske del på lårets inderside.")
mu("gracilis","Den slanke muskel","M. gracilis","hofte-ben","muskel",S,A,
   "Ramus inferior ossis pubis.","Mediale side af tibia (pes anserinus).","Adducerer hoften og bøjer knæet.")
mu("biceps-femoris","Tohovedet lårmuskel","M. biceps femoris","hofte-ben","muskel",S,P,
   "Caput longum: tuber ischiadicum. Caput breve: linea aspera.","Caput fibulae.","Bøjer knæet; caput longum strækker også hoften.",
   aliases=["haserne","hasemuskler","hamstrings"])
mu("semitendinosus","Halvsenede muskel","M. semitendinosus","hofte-ben","muskel",S,P,
   "Tuber ischiadicum.","Mediale side af tibia (pes anserinus).","Bøjer knæet og strækker hoften.",
   aliases=["haserne","hasemuskler","hamstrings"])
mu("semimembranosus","Halvhindede muskel","M. semimembranosus","hofte-ben","muskel",S,P,
   "Tuber ischiadicum.","Bagsiden af condylus medialis tibiae.","Bøjer knæet og strækker hoften.",
   aliases=["haserne","hasemuskler","hamstrings"],
   note="Ligger delvist under m. semitendinosus; synlig medialt i den nedre del af låret.")
mu("gastrocnemius","Tvillingelægmusklen","M. gastrocnemius","hofte-ben","muskel",S,AP,
   "Condylus medialis og lateralis femoris.","Tuber calcanei via akillessenen.","Plantarfleksion af foden; bøjer knæet.",
   aliases=["lægmusklen","gastronecmius"])
mu("soleus","Fladfiskemusklen","M. soleus","hofte-ben","muskel",S,AP,
   "Bagsiden af caput fibulae og øvre del af tibia (linea musculi solei).","Tuber calcanei via akillessenen.","Plantarfleksion af foden.",
   aliases=["lægmusklen"])
mu("tendo-calcaneus","Akillessenen","Tendo calcaneus","hofte-ben","sene",S,P,
   "Fælles sene fra m. gastrocnemius og m. soleus.","Tuber calcanei (hælbenet).","Overfører kraften fra lægmusklerne til hælen.",
   aliases=["achillessene","achillessenen","akillessene"])
mu("tibialis-anterior","Forreste skinnebensmuskel","M. tibialis anterior","hofte-ben","muskel",S,A,
   "Laterale flade af tibia og membrana interossea.","Os cuneiforme mediale og basis af 1. mellemfodsknogle.","Dorsalflekterer og supinerer foden.")
mu("fibularis-longus","Lange lægbensmuskel","M. fibularis longus","hofte-ben","muskel",S,A,
   "Caput fibulae og øvre del af fibulas yderside.","Os cuneiforme mediale og basis af 1. mellemfodsknogle (fodsålen).","Plantarflekterer og pronerer foden.",
   aliases=["m. peroneus longus","peroneus"])

out = os.path.join(os.path.dirname(__file__), "..", "src", "content", "muscles.json")
json.dump(M, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(len(M), "records")
