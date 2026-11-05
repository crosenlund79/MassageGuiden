/**
 * Language-aware accessors for reference content. All Danish/English
 * selection of content goes through here; UI strings live in strings.ts.
 * The verbatim source caption and handwritten notes are never translated
 * (they are quotations of the Danish booklet), and user notes are shown as written.
 */
import type { Muscle, MuscleGroupRecord, Program, Region, Technique, TechniqueGap, TechniqueMuscleLink } from '../domain/types';
import type { Demonstration } from '../demos/types';

export type Lang = 'da' | 'en';

export const techName = (t: Technique, l: Lang) => (l === 'en' ? t.en.name : t.name);
export const techDescription = (t: Technique, l: Lang) => (l === 'en' ? t.en.description : t.description);
export const techPosition = (t: Technique, l: Lang) => (l === 'en' ? t.en.position : t.position);
export const techPrecautions = (t: Technique, l: Lang) => (l === 'en' ? t.en.precautions : t.precautions.map((p) => p.text));
export const techReviewNotes = (t: Technique, l: Lang) => (l === 'en' ? t.en.reviewNotes : t.reviewNotes);
export const gapReason = (g: TechniqueGap, l: Lang) => (l === 'en' ? g.en.reason : g.reason);
export const linkNote = (link: TechniqueMuscleLink, l: Lang) => (l === 'en' ? link.noteEn : link.note);

export const regionName = (r: Region, l: Lang) => (l === 'en' ? r.nameEn : r.name);
export const regionShort = (r: Region, l: Lang) => (l === 'en' ? r.shortEn : r.short);
export const programName = (p: Program, l: Lang) => (l === 'en' ? p.nameEn : p.name);
export const sequenceNoteText = (n: Program['sequenceNotes'][number], l: Lang) => (l === 'en' ? n.textEn : n.text);

/** Vernacular (non-Latin) muscle name in the UI language. */
export const muscleName = (m: Pick<Muscle, 'nameDa' | 'nameEn'> | MuscleGroupRecord, l: Lang) => (l === 'en' ? m.nameEn : m.nameDa);
export const muscleOrigin = (m: Muscle, l: Lang) => (l === 'en' ? m.en.origin : m.origin);
export const muscleInsertion = (m: Muscle, l: Lang) => (l === 'en' ? m.en.insertion : m.insertion);
export const muscleAction = (m: Muscle, l: Lang) => (l === 'en' ? m.en.action : m.action);
export const muscleNote = (m: Muscle, l: Lang) => (l === 'en' ? m.en.note : m.note);

export const demoFrameText = (d: Demonstration, i: number, l: Lang) => (l === 'en' ? d.en.frames[i] : d.frames[i].text);
export const demoTherapist = (d: Demonstration, l: Lang) => (l === 'en' ? d.en.therapist : d.therapist);
export const demoClientPose = (d: Demonstration, l: Lang) => (l === 'en' ? d.en.clientPose : d.clientPose);
export const demoReview = (d: Demonstration, l: Lang) => (l === 'en' ? d.en.review : d.review);
