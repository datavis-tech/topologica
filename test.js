const Topologica = require('./dist/topologica.js');
const assert = require('assert');

describe('Topologica.js', () => {

  it('Should set and get a value.', () => {
    const dataflow = Topologica({});
    dataflow({
      foo: 'bar'
    });
    assert.equal(dataflow.foo, 'bar');
  });

  it('Should chain set.', () => {
    const dataflow = Topologica({})({ foo: 'bar' });
    assert.equal(dataflow.foo, 'bar');
  });

  it('Should compute a derived property.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    dataflow({
      a: 5
    });
    assert.equal(dataflow.b, 6);
  });

  it('Should handle uninitialized property.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });
    assert.equal(dataflow.b, undefined);
  });

  it('Should propagate changes synchronously.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a']
    });

    dataflow({
      a: 2
    });
    assert.equal(dataflow.b, 3);

    dataflow({
      a: 99
    });
    assert.equal(dataflow.b, 100);
  });

  it('Should compute a derived property with 2 hops.', () => {
    const dataflow = Topologica({
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b']
    });
    dataflow({
      a: 5
    });
    assert.equal(dataflow.c, 7);
  });

  it('Should handle case of 2 inputs.', () => {
    const dataflow = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });
    dataflow({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, 'Fred Flintstone');
  });

  it('Should accept an array of strings as inputs.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.inputs = ['firstName', 'lastName'];
    const dataflow = Topologica({ fullName });
    dataflow({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, 'Fred Flintstone');
  });

  it('Should accept a comma delimited string as inputs.', () => {
    const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
    fullName.inputs = 'firstName, lastName';
    const dataflow = Topologica({ fullName });
    dataflow({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      ['firstName', 'lastName']
    ]
    const dataflow = Topologica({ fullName });
    dataflow({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, 'Fred Flintstone');
  });

  it('Should accept reactive function as an array, with inputs as a string.', () => {
    const fullName = [
      ({firstName, lastName}) => `${firstName} ${lastName}`,
      'firstName,lastName'
    ]
    const dataflow = Topologica({ fullName });
    dataflow({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, 'Fred Flintstone');
  });

  it('Should only execute when all inputs are defined.', () => {
    const dataflow = Topologica({
      fullName: [
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      ]
    });

    dataflow({
      lastName: 'Flintstone'
    });
    assert.equal(dataflow.fullName, undefined);

    dataflow({
      firstName: 'Wilma'
    });
    assert.equal(dataflow.fullName, 'Wilma Flintstone');
  });

  it('Should handle case of 3 inputs.', () => {
    const dataflow = Topologica({
      d: [({a, b, c}) => a + b + c, 'a,b,c']
    });
    dataflow({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataflow.d, 15);
  });

  it('Should handle spaces in input string.', () => {
    const dataflow = Topologica({
      d: [({a, b, c}) => a + b + c, '  a ,    b, c   ']
    });
    dataflow({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataflow.d, 15);
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
    dataflow({
      a: 1,
      c: 2
    });
    assert.equal(dataflow.e, (1 + 1) + (2 + 1));
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
    dataflow({
      a: 5
    });
    const a = dataflow.a;
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(dataflow.e, e);
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
    dataflow({
      a: 5
    });
    const a = dataflow.a;
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(dataflow.h, h);
  });

  it('Should work with booleans.', () => {
    const dataflow = Topologica({
      b: [({a}) => !a, 'a']
    });
    dataflow({
      a: false
    });
    assert.equal(dataflow.b, true);
  });

  it('Should work with async functions.', done => {
    const dataflow = Topologica({
      bPromise: [
        ({a}) => Promise.resolve(a + 5).then(b => dataflow({ b })),
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
    dataflow({
      a: 5
    });
  });

  it('Should work with async functions.', done => {
    Topologica({
      bPromise: [
        dataflow => Promise.resolve(dataflow.a + 5)
          .then(b => dataflow({ b })),
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

    const dataflow = Topologica({
      b: [({a}) => invocations++, 'a']
    });

    assert.equal(invocations, 0);

    dataflow({ a: 2 });
    assert.equal(invocations, 1);

    dataflow({ a: 2 });
    assert.equal(invocations, 1);

    dataflow({ a: 99 });
    assert.equal(invocations, 2);
  });

  it('Should propagate changes if a single dependency changes.', () => {
    let invocations = 0;

    const dataflow = Topologica({
      c: [() => invocations++, 'a, b']
    });

    assert.equal(invocations, 0);

    dataflow({ a: 2, b: 4 });
    assert.equal(invocations, 1);

    dataflow({ a: 2 });
    assert.equal(invocations, 1);

    dataflow({ a: 2, b: 6 });
    assert.equal(invocations, 2);
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
        dataflow({ a: i });
      }
      const end = Date.now();
      const time = end - begin;
      totalTime += time;
      console.log(time);
    }
    console.log('Average: ' + (totalTime / numRuns));
  }).timeout(7000);

});
