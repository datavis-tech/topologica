const Topologica = require('./dist/topologica.js');
const assert = require('assert');

const λ = (fn, dependencies) => {
  fn.dependencies = dependencies;
  return fn;
};

describe('Topologica.js', () => {

  it('Should set and get a value.', () => {
    const state = Topologica({});
    state.set({
      foo: 'bar'
    });
    assert.equal(state.get().foo, 'bar');
  });

  it('Should chain set.', () => {
    const state = Topologica({}).set({ foo: 'bar' });
    assert.equal(state.get().foo, 'bar');
  });

  it('Should compute a derived property.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a')
    });
    state.set({
      a: 5
    });
    assert.equal(state.get().b, 6);
  });

  it('Should handle uninitialized property.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a')
    });
    assert.equal(state.get().b, undefined);
  });

  it('Should propagate changes synchronously.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a')
    });

    state.set({
      a: 2
    });
    assert.equal(state.get().b, 3);

    state.set({
      a: 99
    });
    assert.equal(state.get().b, 100);
  });

  it('Should compute a derived property with 2 hops.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b')
    });
    state.set({
      a: 5
    });
    assert.equal(state.get().c, 7);
  });

  it('Should handle case of 2 inputs.', () => {
    const state = Topologica({
      fullName: λ(
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      )
    });
    state.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, 'Fred Flintstone');
  });

  it('Should accept an array of strings as dependencies.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.dependencies = ['firstName', 'lastName'];
    const state = Topologica({ fullName });
    state.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, 'Fred Flintstone');
  });

  it('Should accept a comma delimited string as dependencies.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.dependencies = 'firstName, lastName';
    const state = Topologica({ fullName });
    state.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      ['firstName', 'lastName']
    ]
    const state = Topologica({ fullName });
    state.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array, with dependencies as a string.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      'firstName,lastName'
    ]
    const state = Topologica({ fullName });
    state.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, 'Fred Flintstone');
  });

  it('Should only execute when all inputs are defined.', () => {
    const state = Topologica({
      fullName: λ(
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      )
    });

    state.set({
      lastName: 'Flintstone'
    });
    assert.equal(state.get().fullName, undefined);

    state.set({
      firstName: 'Wilma'
    });
    assert.equal(state.get().fullName, 'Wilma Flintstone');
  });

  it('Should handle case of 3 inputs.', () => {
    const state = Topologica({
      d: λ(({a, b, c}) => a + b + c, 'a,b,c')
    });
    state.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(state.get().d, 15);
  });

  it('Should handle spaces in input string.', () => {
    const state = Topologica({
      d: λ(({a, b, c}) => a + b + c, '  a ,    b, c   ')
    });
    state.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(state.get().d, 15);
  });

  // Data flow graph, read from top to bottom.
  //
  //  a   c
  //  |   |
  //  b   d
  //   \ /
  //    e   
  //
  it('Should evaluate not-too-tricky case.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a'),
      d: λ(({c}) => c + 1, 'c'),
      e: λ(({b, d}) => b + d, 'b, d')
    });
    state.set({
      a: 1,
      c: 2
    });
    assert.equal(state.get().e, (1 + 1) + (2 + 1));
  });

  //      a
  //     / \
  //    b   |
  //    |   d
  //    c   |
  //     \ /
  //      e   
  it('Should evaluate tricky case.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b'),
      d: λ(({a}) => a + 1, 'a'),
      e: λ(({b, d}) => b + d, 'b, d')
    });
    state.set({
      a: 5
    });
    const a = state.get().a;
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(state.get().e, e);
  });


  //       a
  //     / \ \
  //    b   | \
  //    |   e  \
  //    c   |  g
  //    |   f  /
  //    d   | /
  //     \ / /
  //       h   
  it('Should evaluate trickier case.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b'),
      d: λ(({c}) => c + 1, 'c'),
      e: λ(({a}) => a + 1, 'a'),
      f: λ(({e}) => e + 1, 'e'),
      g: λ(({a}) => a + 1, 'a'),
      h: λ(({d, f, g}) => d + f + g, 'd, f, g')
    });
    state.set({
      a: 5
    });
    const a = state.get().a;
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(state.get().h, h);
  });

  it('Should work with booleans.', () => {
    const state = Topologica({
      b: λ(({a}) => !a, 'a')
    });
    state.set({
      a: false
    });
    assert.equal(state.get().b, true);
  });

  it('Should work with async functions.', done => {
    const state = Topologica({
      bPromise: λ(
        ({a}) => Promise.resolve(a + 5).then(b => state.set({ b })),
        'a'
      ),
      c: λ(
        ({b}) => {
          assert.equal(b, 10);
          done();
        },
        'b'
      )
    });
    state.set({
      a: 5
    });
  });

  it('Should only propagate changes when values change.', () => {
    let invocations = 0;

    const state = Topologica({
      b: λ(({a}) => invocations++, 'a')
    });

    assert.equal(invocations, 0);

    state.set({ a: 2 });
    assert.equal(invocations, 1);

    state.set({ a: 2 });
    assert.equal(invocations, 1);

    state.set({ a: 99 });
    assert.equal(invocations, 2);
  });

  it('Should propagate changes if a single dependency changes.', () => {
    let invocations = 0;

    const state = Topologica({
      c: λ(() => invocations++, 'a, b')
    });

    assert.equal(invocations, 0);

    state.set({ a: 2, b: 4 });
    assert.equal(invocations, 1);

    state.set({ a: 2 });
    assert.equal(invocations, 1);

    state.set({ a: 2, b: 6 });
    assert.equal(invocations, 2);
  });

  it('Should pass only dependencies into reactive functions.', () => {
    const state = Topologica({
      b: λ(
        props => Object.keys(props),
        'a'
      )
    });
    state.set({
      a: 'Foo',
      foo: 'Bar'
    });
    assert.deepEqual(state.get().b, ['a']);
  });

  it('Should be fast.', () => {
    const state = Topologica({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b'),
      d: λ(({c}) => c + 1, 'c'),
      e: λ(({a}) => a + 1, 'a'),
      f: λ(({e}) => e + 1, 'e'),
      g: λ(({a}) => a + 1, 'a'),
      h: λ(({d, f, g}) => d + f + g, 'd, f, g')
    });
    const numRuns = 10;
    let totalTime = 0;
    for(let j = 0; j < numRuns; j++){
      const begin = Date.now();
      for(let i = 0; i < 200000; i++){
        state.set({ a: i });
      }
      const end = Date.now();
      const time = end - begin;
      totalTime += time;
      console.log(time);
    }
    console.log('Average: ' + (totalTime / numRuns));
    // 468.9
  }).timeout(7000);

});
