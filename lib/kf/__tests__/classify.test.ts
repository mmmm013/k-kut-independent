/**
 * KUT Family classification and gate tests.
 *
 * These cover the rules that keep source audio out of delivery: a unit is
 * classified by what it declares, and never plays unless QC passed and its
 * audio is an approved render.
 *
 * Run with `npm test`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyUnitType,
  formatDuration,
  isForbiddenSourceUrl,
  normalizeQc,
  resolveAudioUrl,
  resolveTheme,
  safeDeliveryNote,
  sectionSortKey,
  unitHref,
  variantLabel,
} from '../classify';

test('an explicit unit type is never overridden by a title substring', () => {
  assert.equal(
    classifyUnitType({ delivery_unit_type: 'KUT', title: 'a linefeel-ish name' }),
    'KUT',
  );
  assert.equal(classifyUnitType({ unit_type: 'mK', description: 'kupid vibes' }), 'mK');
});

test('a row with no declared type is classified from its hints', () => {
  assert.equal(classifyUnitType({ title: 'LineFeel · Ch1' }), 'LLF');
  assert.equal(classifyUnitType({ description: 'k-kupid level 3' }), 'KUPID');
  assert.equal(classifyUnitType({ title: 'mini set' }), 'mK');
});

test('KUT is the fallback, never a guess at something narrower', () => {
  assert.equal(classifyUnitType({ title: 'Chorus 1' }), 'KUT');
  assert.equal(classifyUnitType({}), 'KUT');
});

test('PIX, source and full-track URLs are rejected', () => {
  assert.equal(isForbiddenSourceUrl('https://x/storage/v1/object/public/tracks/a.mp3'), true);
  assert.equal(isForbiddenSourceUrl('https://x/pix-master.mp3'), true);
  assert.equal(isForbiddenSourceUrl('https://x/full-song.mp3'), true);
  assert.equal(isForbiddenSourceUrl('https://x/gpmc/flagship.mp3'), true);
});

test('anything that is not a string is rejected outright', () => {
  assert.equal(isForbiddenSourceUrl(undefined), true);
  assert.equal(isForbiddenSourceUrl(null), true);
  assert.equal(isForbiddenSourceUrl(42), true);
});

test('an approved render is allowed', () => {
  assert.equal(
    isForbiddenSourceUrl('https://x/storage/v1/object/public/kut-renders/ch1.mp3'),
    false,
  );
});

test('QC values normalize to the three silo states', () => {
  assert.equal(normalizeQc('PASS'), 'pass');
  assert.equal(normalizeQc('failed'), 'fail');
  assert.equal(normalizeQc(null), 'pending');
  assert.equal(normalizeQc('anything else'), 'pending');
});

test('audio URL columns resolve most-specific first', () => {
  assert.equal(resolveAudioUrl({ approved_audio_url: 'b', delivery_audio_url: 'a' }), 'a');
  assert.equal(resolveAudioUrl({}), '');
});

test('each unit type routes to its own player', () => {
  assert.equal(unitHref('KUT', 'x1'), '/k/x1');
  assert.equal(unitHref('mK', 'x1'), '/mkut/x1');
  assert.equal(unitHref('LLF', 'x1'), '/llf/x1');
  assert.equal(unitHref('KUPID', 'x1'), '/kupid/x1');
  assert.equal(unitHref('KUT', ''), null);
});

test('delivery notes never fall through to internal description text', () => {
  assert.equal(safeDeliveryNote({ description: 'internal notes' }), 'KUT-authorized delivery');
  assert.equal(safeDeliveryNote({ public_label: 'A gift' }), 'A gift');
  assert.equal(safeDeliveryNote({}), 'KUT-authorized HUG delivery');
});

test('section tags sort by their earliest canonical section', () => {
  assert.ok(sectionSortKey('Intro') < sectionSortKey('Ch1'));
  assert.ok(sectionSortKey('V1 → Pre1') < sectionSortKey('Outro'));
  assert.equal(sectionSortKey('Unknown'), 10);
});

test('display helpers', () => {
  assert.equal(variantLabel('VOCAL_MUSIC'), 'Vocal + Music');
  assert.equal(variantLabel(null), '—');
  assert.equal(formatDuration(18000), '0:18');
  assert.equal(formatDuration(125000), '2:05');
});

test('themes resolve from any of the SSOT column spellings', () => {
  assert.equal(resolveTheme({ theme: 'love' }), 'love');
  assert.equal(resolveTheme({ sentiment: 'Apology' }), 'apology');
  assert.equal(resolveTheme({ emotion_level: 'PEACE' }), 'peace');
});

test('an unknown or absent theme is null, never guessed', () => {
  assert.equal(resolveTheme({ theme: 'nostalgia' }), null);
  assert.equal(resolveTheme({}), null);
  assert.equal(resolveTheme({ theme: null }), null);
});
