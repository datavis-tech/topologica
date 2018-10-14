const Topologica = require('./dist/topologica.js');
const assert = require('assert');

describe('Topologica.js', () => {

  it('Should set and get a value.', () => {
    const topologica = Topologica({});
    topologica({
      foo: 'bar'
    });
    assert.equal(topologica.foo, 'bar');
  });

  it('Should chain set.', () => {
    const topologica = Topologica({})({ foo: 'bar' });
    assert.equal(topologica.foo, 'bar');
  });

  it('Should compute a derived property.', () => {
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    topologica({
      a: 5
    });
    assert.equal(topologica.b, 6);
  });

  it('Should handle uninitialized property.', () => {
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    assert.equal(topologica.b, undefined);
  });

  it('Should propagate changes synchronously.', () => {
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a']
    });

    topologica({
      a: 2
    });
    assert.equal(topologica.b, 3);

    topologica({
      a: 99
    });
    assert.equal(topologica.b, 100);
  });

  it('Should compute a derived property with 2 hops.', () => {
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b']
    });
    topologica({
      a: 5
    });
    assert.equal(topologica.c, 7);
  });

  it('Should handle case of 2 inputs.', () => {
    const topologica = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });
    topologica({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, 'Fred Flintstone');
  });

  it('Should accept an array of strings as inputs.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.inputs = ['firstName', 'lastName'];
    const topologica = Topologica({ fullName });
    topologica({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, 'Fred Flintstone');
  });

  it('Should accept a comma delimited string as inputs.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.inputs = 'firstName, lastName';
    const topologica = Topologica({ fullName });
    topologica({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      ['firstName', 'lastName']
    ]
    const topologica = Topologica({ fullName });
    topologica({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array, with inputs as a string.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      'firstName,lastName'
    ]
    const topologica = Topologica({ fullName });
    topologica({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, 'Fred Flintstone');
  });

  it('Should only execute when all inputs are defined.', () => {
    const topologica = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });

    topologica({
      lastName: 'Flintstone'
    });
    assert.equal(topologica.fullName, undefined);

    topologica({
      firstName: 'Wilma'
    });
    assert.equal(topologica.fullName, 'Wilma Flintstone');
  });

  it('Should handle case of 3 inputs.', () => {
    const topologica = Topologica({
      d: [({a, b, c}) => a + b + c, 'a,b,c']
    });
    topologica({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(topologica.d, 15);
  });

  it('Should handle spaces in input string.', () => {
    const topologica = Topologica({
      d: [({a, b, c}) => a + b + c, '  a ,    b, c   ']
    });
    topologica({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(topologica.d, 15);
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
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a'],
      d: [({c}) => c + 1, 'c'],
      e: [({b, d}) => b + d, 'b, d']
    });
    topologica({
      a: 1,
      c: 2
    });
    assert.equal(topologica.e, (1 + 1) + (2 + 1));
  });

  //      a
  //     / \
  //    b   |
  //    |   d
  //    c   |
  //     \ /
  //      e   
  it('Should evaluate tricky case.', () => {
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({a}) => a + 1, 'a'],
      e: [({b, d}) => b + d, 'b, d']
    });
    topologica({
      a: 5
    });
    const a = topologica.a;
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(topologica.e, e);
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
    const topologica = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({c}) => c + 1, 'c'],
      e: [({a}) => a + 1, 'a'],
      f: [({e}) => e + 1, 'e'],
      g: [({a}) => a + 1, 'a'],
      h: [({d, f, g}) => d + f + g, 'd, f, g']
    });
    topologica({
      a: 5
    });
    const a = topologica.a;
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(topologica.h, h);
  });

  it('Should work with booleans.', () => {
    const topologica = Topologica({
      b: [({a}) => !a, 'a']
    });
    topologica({
      a: false
    });
    assert.equal(topologica.b, true);
  });

  it('Should work with async functions.', done => {
    const topologica = Topologica({
      bPromise: [
        ({a}) => Promise.resolve(a + 5).then(b => topologica({ b })),
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
    topologica({
      a: 5
    });
  });

  it('Should work with async functions.', done => {
    Topologica({
      bPromise: [
        topologica => Promise.resolve(topologica.a + 5)
          .then(b => topologica({ b })),
        'a'
      ],
      c: [
        ({b}) => {
          assert.equal(b, 10);
          done();
        },
        'b'
      ]
    })({ a: 5 });
  });

  it('Should only propagate changes when values change.', () => {
    let invocations = 0;

    const topologica = Topologica({
      b: [({a}) => invocations++, 'a']
    });

    assert.equal(invocations, 0);

    topologica({ a: 2 });
    assert.equal(invocations, 1);

    topologica({ a: 2 });
    assert.equal(invocations, 1);

    topologica({ a: 99 });
    assert.equal(invocations, 2);
  });

  it('Should propagate changes if a single dependency changes.', () => {
    let invocations = 0;

    const topologica = Topologica({
      c: [() => invocations++, 'a, b']
    });

    assert.equal(invocations, 0);

    topologica({ a: 2, b: 4 });
    assert.equal(invocations, 1);

    topologica({ a: 2 });
    assert.equal(invocations, 1);

    topologica({ a: 2, b: 6 });
    assert.equal(invocations, 2);
  });

  it('Should be fast.', () => {
    const topologica = Topologica({
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
        topologica({ a: i });
      }
      const end = Date.now();
      const time = end - begin;
      totalTime += time;
      console.log(time);
    }
    console.log('Average: ' + (totalTime / numRuns));
  }).timeout(7000);

});
