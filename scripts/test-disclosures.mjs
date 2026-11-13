import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('./animated-disclosures.js', import.meta.url), 'utf8');

function fakeDetails() {
  const handlers = new Map();
  const summary = {
    addEventListener(type, callback) { handlers.set(type, callback); },
    click(event) { handlers.get('click')?.(event); },
  };
  return {
    open: false,
    style: { overflow: '' },
    summary,
    animations: [],
    querySelector(selector) {
      assert.equal(selector, ':scope > summary');
      return summary;
    },
    getBoundingClientRect() {
      const active = this.animations.at(-1);
      return { height: this.frameHeight !== undefined && active && !active.cancelled ? this.frameHeight : (this.open ? 190 : 58) };
    },
    animate(keyframes, options) {
      const handlers = new Map();
      const animation = {
        keyframes,
        options,
        cancelled: false,
        addEventListener(name, cb) { handlers.set(name, cb); },
        finish() { handlers.get('finish')?.(); },
        cancel() { this.cancelled = true; handlers.get('cancel')?.(); },
      };
      this.animations.push(animation);
      return animation;
    },
  };
}

function setup({ reduced = false, noAnimation = false } = {}) {
  const motionListeners = [];
  const motion = {
    matches: reduced,
    addEventListener(type, cb) {
      assert.equal(type, 'change');
      motionListeners.push(cb);
    },
    change(value) {
      this.matches = value;
      for (const fn of motionListeners) fn();
    },
  };
  const about = fakeDetails();
  const work = fakeDetails();
  if (noAnimation) {
    about.animate = undefined;
    work.animate = undefined;
  }
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, 'details.about, details.work');
      return [about, work];
    },
  };
  vm.runInNewContext(source, { document, window: { matchMedia: () => motion } }, { filename: 'animated-disclosures.js' });
  function click(details, keyboard = false) {
    let prevented = false;
    details.summary.click({ detail: keyboard ? 0 : 1, preventDefault() { prevented = true; } });
    if (!prevented) details.open = !details.open; // native <details> default behavior
    return prevented;
  }
  return { about, work, motion, click };
}

test('about and work animate open and closed, preserving native details state', () => {
  const { about, work, click } = setup();
  for (const details of [about, work]) {
    assert.equal(click(details), true);
    assert.equal(details.open, true);
    assert.equal(details.style.overflow, 'clip');
    assert.deepEqual(Array.from(details.animations.at(-1).keyframes, x => x.height), ['58px', '190px']);
    assert.equal(details.animations.at(-1).options.duration, 350);
    details.animations.at(-1).finish();
    assert.equal(details.open, true);
    assert.equal(details.style.overflow, '');

    assert.equal(click(details, true), true); // keyboard activation also dispatches click
    assert.equal(details.open, true, 'stay open until collapse animation finishes');
    assert.deepEqual(Array.from(details.animations.at(-1).keyframes, x => x.height), ['190px', '58px']);
    details.animations.at(-1).finish();
    assert.equal(details.open, false);
    assert.equal(details.style.overflow, '');
  }
});

test('interrupts a transition without jumping, and settles to the last requested state', () => {
  const { about, click } = setup();
  click(about);
  const first = about.animations.at(-1);
  about.frameHeight = 114;
  click(about);
  const second = about.animations.at(-1);
  assert.equal(first.cancelled, true);
  assert.equal(second.keyframes[0].height, '114px');
  assert.equal(second.keyframes[1].height, '58px');
  about.frameHeight = 90;
  click(about);
  const third = about.animations.at(-1);
  assert.equal(second.cancelled, true);
  assert.equal(third.keyframes[0].height, '90px');
  assert.equal(third.keyframes[1].height, '190px');
  third.finish();
  assert.equal(about.open, true);
  assert.equal(about.style.overflow, '');
});

test('prefers-reduced-motion uses immediate native disclosure', () => {
  const { about, click } = setup({ reduced: true });
  assert.equal(click(about), false);
  assert.equal(about.open, true);
  assert.equal(click(about), false);
  assert.equal(about.open, false);
  assert.equal(about.animations.length, 0);
});

test('switching to reduced motion cancels the animation and reaches its intended state', () => {
  const { work, click, motion } = setup();
  click(work);
  const animation = work.animations.at(-1);
  motion.change(true);
  assert.equal(animation.cancelled, true);
  assert.equal(work.open, true);
  assert.equal(work.style.overflow, '');
  click(work);
  assert.equal(work.open, false);
});

test('without Web Animations the disclosure remains natively usable', () => {
  const { about, click } = setup({ noAnimation: true });
  assert.equal(click(about), false);
  assert.equal(about.open, true);
  assert.equal(click(about), false);
  assert.equal(about.open, false);
});
