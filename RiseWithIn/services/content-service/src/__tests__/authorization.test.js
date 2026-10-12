import test from 'node:test';
import assert from 'node:assert/strict';
import resolvers from '../resolvers.js';

const premiumContent = { premium: true, body: 'premium body' };
const publicContent = { premium: false, body: 'public body' };

test('premium body is hidden from anonymous and free users', () => {
  assert.equal(resolvers.Content.body(premiumContent, {}, { user: null }), null);
  assert.equal(resolvers.Content.body(premiumContent, {}, { user: { plan: 'FREE' } }), null);
});

test('premium body is visible to paid plans', () => {
  assert.equal(resolvers.Content.body(premiumContent, {}, { user: { plan: 'PRO' } }), 'premium body');
  assert.equal(resolvers.Content.body(premiumContent, {}, { user: { plan: 'PREMIUM' } }), 'premium body');
});

test('public body remains visible without authentication', () => {
  assert.equal(resolvers.Content.body(publicContent, {}, { user: null }), 'public body');
});
