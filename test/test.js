const Topologica = require('..');
const assert = require('assert');

const { DataFlowGraph } = Topologica;

const parse = dependenciesStr => dependenciesStr
  .split(',')
  .map(input => input.trim());

const λ = (fn, dependenciesStr) => {
  fn.dependencies = parse(dependenciesStr);
  return fn;
};

describe('Topologica.js', () => {

  it('Should set and get a value.', () => {
    const dataFlow = DataFlowGraph();
    dataFlow.set({
      foo: 'bar'
    });
    assert.equal(dataFlow.get('foo'), 'bar');
  });

  it('Should compute a derived property.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a')
    });
    dataFlow.set({
      a: 5
    });
    assert.equal(dataFlow.get('b'), 6);
  });

  it('Should handle uninitialized property.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a')
    });
    assert.equal(dataFlow.get('b'), undefined);
  });

  it('Should propagate changes synchronously.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a')
    });

    dataFlow.set({
      a: 2
    });
    assert.equal(dataFlow.get('b'), 3);

    dataFlow.set({
      a: 99
    });
    assert.equal(dataFlow.get('b'), 100);
  });

  it('Should compute a derived property with 2 hops.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b')
    });
    dataFlow.set({
      a: 5
    });
    assert.equal(dataFlow.get('c'), 7);
  });

  it('Should handle case of 2 inputs.', () => {
    const dataFlow = DataFlowGraph({
      fullName: λ(
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      )
    });
    dataFlow.set({
      firstName: 'Fred',
      lastName: 'Flintstone'
    });
    assert.equal(dataFlow.get('fullName'), 'Fred Flintstone');
  });

  it('Should only execute when all inputs are defined.', () => {
    const dataFlow = DataFlowGraph({
      fullName: λ(
        ({firstName, lastName}) => `${firstName} ${lastName}`,
        'firstName, lastName'
      )
    });

    dataFlow.set({
      lastName: 'Flintstone'
    });
    assert.equal(dataFlow.get('fullName'), undefined);

    dataFlow.set({
      firstName: 'Wilma'
    });
    assert.equal(dataFlow.get('fullName'), 'Wilma Flintstone');
  });

  it('Should handle case of 3 inputs.', () => {
    const dataFlow = DataFlowGraph({
      d: λ(({a, b, c}) => a + b + c, 'a,b,c')
    });
    dataFlow.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataFlow.get('d'), 15);
  });

  it('Should handle spaces in input string.', () => {
    const dataFlow = DataFlowGraph({
      d: λ(({a, b, c}) => a + b + c, '  a ,    b, c   ')
    });
    dataFlow.set({
      a: 5,
      b: 8,
      c: 2
    });
    assert.equal(dataFlow.get('d'), 15);
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
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a'),
      d: λ(({c}) => c + 1, 'c'),
      e: λ(({b, d}) => b + d, 'b, d')
    });
    dataFlow.set({
      a: 1,
      c: 2
    });
    assert.equal(dataFlow.get('e'), (1 + 1) + (2 + 1));
  });

  //      a
  //     / \
  //    b   |
  //    |   d
  //    c   |
  //     \ /
  //      e   
  it('Should evaluate tricky case.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b'),
      d: λ(({a}) => a + 1, 'a'),
      e: λ(({b, d}) => b + d, 'b, d')
    });
    dataFlow.set({
      a: 5
    });
    const a = dataFlow.get('a');
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(dataFlow.get('e'), e);
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
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => a + 1, 'a'),
      c: λ(({b}) => b + 1, 'b'),
      d: λ(({c}) => c + 1, 'c'),
      e: λ(({a}) => a + 1, 'a'),
      f: λ(({e}) => e + 1, 'e'),
      g: λ(({a}) => a + 1, 'a'),
      h: λ(({d, f, g}) => d + f + g, 'd, f, g')
    });
    dataFlow.set({
      a: 5
    });
    const a = dataFlow.get('a');
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(dataFlow.get('h'), h);
  });

  it('Should work with booleans.', () => {
    const dataFlow = DataFlowGraph({
      b: λ(({a}) => !a, 'a')
    });
    dataFlow.set({
      a: false
    });
    assert.equal(dataFlow.get('b'), true);
  });

  it('Should work with async functions.', done => {
    const dataFlow = DataFlowGraph({
      b: λ(
        async ({a}) => await Promise.resolve(a + 5),
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
    dataFlow.set({
      a: 5
    });
  });
});
