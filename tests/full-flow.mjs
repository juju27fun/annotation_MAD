import {boot} from './ui_harness.mjs';import assert from 'node:assert/strict';
const ui=await boot();assert.equal(ui.run('editable()'),true);assert.equal(ui.state.action,'draw');
const first=ui.state.trace.id;
// Reported gesture: end first, then beginning, on the small upper raw plot.
await ui.click('raw',700);assert.equal(ui.state.annotation.events.length,0);assert.notEqual(ui.state.pendingBoundary,null);
await ui.nodes.get('complete').onclick();assert.ok(ui.nodes.get('error').textContent.includes('seconde borne'));assert.equal(ui.state.trace.id,first);
await ui.click('raw',400);assert.equal(ui.state.annotation.events.length,1);assert.equal(ui.state.pendingBoundary,null);
assert.deepEqual([ui.state.annotation.events[0].start,ui.state.annotation.events[0].end],[5636,10551]);
assert.equal(ui.nodes.get('confirmEvent').disabled,false);
await ui.nodes.get('confirmEvent').onclick();assert.equal(ui.state.trace.id,first);assert.equal(ui.state.annotation.events.length,1);assert.equal(ui.state.selected,null);assert.equal(ui.state.practice[first].events.length,1);
// Add a second event to that same trace with the same reverse-click gesture.
await ui.nodes.get('addEvent').onclick();await ui.click('raw',950);await ui.click('raw',850);
assert.equal(ui.state.annotation.events.length,2);assert.deepEqual([ui.state.annotation.events[1].start,ui.state.annotation.events[1].end],[13009,14647]);
await ui.nodes.get('confirmEvent').onclick();assert.equal(ui.state.practice[first].events.length,2);assert.equal(ui.state.trace.id,first);
await ui.nodes.get('complete').onclick();assert.notEqual(ui.state.trace.id,first);assert.equal(ui.state.practice[first].status,'completed');assert.equal(ui.state.practice[first].events.length,2);
// Drag still works on both plots; raw annotations do not unexpectedly zoom the view.
await ui.drag('raw',180,300);assert.equal(ui.state.annotation.events.length,1);assert.deepEqual(Array.from(ui.state.view),[0,ui.state.trace.n_samples]);
await ui.drag('filtered',550,700);assert.equal(ui.state.annotation.events.length,2);
// Explicit zoom remains separate; a new pending first boundary can be cancelled.
ui.run("setAction('zoom')");await ui.drag('raw',200,500);assert.equal(ui.state.annotation.events.length,2);assert.ok(ui.state.view[0]>0);
ui.run('startAnotherEvent()');await ui.click('filtered',500);assert.notEqual(ui.state.pendingBoundary,null);ui.run("setAction('draw')");assert.equal(ui.state.pendingBoundary,null);
console.log('PASS: actual generated app, reverse two-click annotation on raw overview, incomplete-pair guard, event validation stays on trace, second event preserved, trace validation/navigation, drag and separate zoom. No browser rendering tested.');
