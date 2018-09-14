const Topologica = require('./dist/topologica.js');
const assert = require('assert');

describe('Topologica.js', () => {

  it('Should set and get a value.', () => {
    const dataflow = Topologica({});
    dataflow.set({
      foo: 'bar'
    });
    assert.equal(dataflow.get().foo, 'bar');
  });

  it('Should chain set.', () => {
    const dataflow = Topologica({}).set({ foo: 'bar' });
    assert.equal(dataflow.get().foo, 'bar');
  });

  it('Should compute a derived property.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    dataflow.set({
      a: 5
    });
    assert.equal(dataflow.get().b, 6);
  });

  it('Should handle uninitialized property.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    assert.equal(dataflow.get().b, undefined);
  });

  it('Should propagate changes synchronously.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });

    dataflow.set({
      a: 2
    });
    assert.equal(dataflow.get().b, 3);

    dataflow.set({
      a: 99
    });
    assert.equal(dataflow.get().b, 100);
  });

  it('Should compute a derived property with 2 hops.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b']
    });
    dataflow.set({
      a: 5
    });
    assert.equal(dataflow.get().c, 7);
  });

  it('Should handle case of 2 inputs.', () => {
    const dataflow = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });
    dataflow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, 'Fred Flintstone');
  });

  it('Should accept an array of strings as dependencies.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.dependencies = ['firstName', 'lastName'];
    const dataflow = Topologica({ fullName });
    dataflow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, 'Fred Flintstone');
  });

  it('Should accept a comma delimited string as dependencies.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.dependencies = 'firstName, lastName';
    const dataflow = Topologica({ fullName });
    dataflow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      ['firstName', 'lastName']
    ]
    const dataflow = Topologica({ fullName });
    dataflow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array, with dependencies as a string.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      'firstName,lastName'
    ]
    const dataflow = Topologica({ fullName });
    dataflow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, 'Fred Flintstone');
  });

  it('Should only execute when all inputs are defined.', () => {
    const dataflow = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });

    dataflow.set({
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.get().fullName, undefined);

    dataflow.set({
      firstName: 'Wilma'
    });
    assert.equal(dataflow.get().fullName, 'Wilma Flintstone');
  });

  it('Should handle case of 3 inputs.', () => {
    const dataflow = Topologica({
      d: [({a, b, c}) => a + b + c, 'a,b,c']
    });
    dataflow.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataflow.get().d, 15);
  });

  it('Should handle spaces in input string.', () => {
    const dataflow = Topologica({
      d: [({a, b, c}) => a + b + c, '  a ,    b, c   ']
    });
    dataflow.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataflow.get().d, 15);
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
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      d: [({c}) => c + 1, 'c'],
      e: [({b, d}) => b + d, 'b, d']
    });
    dataflow.set({
      a: 1,
      c: 2
    });
    assert.equal(dataflow.get().e, (1 + 1) + (2 + 1));
  });

  //      a
  //     / \
  //    b   |
  //    |   d
  //    c   |
  //     \ /
  //      e   
  it('Should evaluate tricky case.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({a}) => a + 1, 'a'],
      e: [({b, d}) => b + d, 'b, d']
    });
    dataflow.set({
      a: 5
    });
    const a = dataflow.get().a;
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(dataflow.get().e, e);
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
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({c}) => c + 1, 'c'],
      e: [({a}) => a + 1, 'a'],
      f: [({e}) => e + 1, 'e'],
      g: [({a}) => a + 1, 'a'],
      h: [({d, f, g}) => d + f + g, 'd, f, g']
    });
    dataflow.set({
      a: 5
    });
    const a = dataflow.get().a;
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(dataflow.get().h, h);
  });

  it('Should work with booleans.', () => {
    const dataflow = Topologica({
      b: [({a}) => !a, 'a']
    });
    dataflow.set({
      a: false
    });
    assert.equal(dataflow.get().b, true);
  });

  it('Should work with async functions.', done => {
    const dataflow = Topologica({
      bPromise: [
        ({a}) => Promise.resolve(a + 5).then(b => dataflow.set({ b })),
        'a'
      ],
      c: [
        ({b}) => {
          assert.equal(b, 10);
          done();
        },
        'b'
      ]
    });
    dataflow.set({
      a: 5
    });
  });

  it('Should only propagate changes when values change.', () => {
    let invocations = 0;

    const dataflow = Topologica({
      b: [({a}) => invocations++, 'a']
    });

    assert.equal(invocations, 0);

    dataflow.set({ a: 2 });
    assert.equal(invocations, 1);

    dataflow.set({ a: 2 });
    assert.equal(invocations, 1);

    dataflow.set({ a: 99 });
    assert.equal(invocations, 2);
  });

  it('Should propagate changes if a single dependency changes.', () => {
    let invocations = 0;

    const dataflow = Topologica({
      c: [() => invocations++, 'a, b']
    });

    assert.equal(invocations, 0);

    dataflow.set({ a: 2, b: 4 });
    assert.equal(invocations, 1);

    dataflow.set({ a: 2 });
    assert.equal(invocations, 1);

    dataflow.set({ a: 2, b: 6 });
    assert.equal(invocations, 2);
  });

  it('Should pass only dependencies into reactive functions.', () => {
    const dataflow = Topologica({
      b: [
        props => Object.keys(props),
        'a'
      ]
    });
    dataflow.set({
      a: 'Foo',
      foo: 'Bar'
    });
    assert.deepEqual(dataflow.get().b, ['a']);
  });

  it('Should be fast.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({c}) => c + 1, 'c'],
      e: [({a}) => a + 1, 'a'],
      f: [({e}) => e + 1, 'e'],
      g: [({a}) => a + 1, 'a'],
      h: [({d, f, g}) => d + f + g, 'd, f, g']
    });
    const numRuns = 10;
    let totalTime = 0;
    for(let j = 0; j < numRuns; j++){
      const begin = Date.now();
      for(let i = 0; i < 200000; i++){
        dataflow.set({ a: i });
      }
      const end = Date.now();
      const time = end - begin;
      totalTime += time;
      console.log(time);
    }
    console.log('Average: ' + (totalTime / numRuns));
  }).timeout(7000);

});
