# topologica

Minimal library for reactive [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming).

This library provides an abstraction for **reactive data flows**. This means you can define functions in terms of their inputs (dependencies) and outputs, and the library will take care of executing _only_ the required functions to propagate changes through the data flow graph. Changes are propagated through the data flow graph using the [topological sorting algorithm](https://en.wikipedia.org/wiki/Topological_sorting) (hence the name _Topologica_).

## Installing

You can install via [NPM](https://www.npmjs.com/package/topologica) like this:

```
npm install --save-dev topologica
```

Then import it into your code like this:

```js
import topologica from 'topologica';
```

You can also include the library in a script tag from Unpkg, like this:

```
<script src="https://unpkg.com/topologica@0.4.0/dist/topologica.min.js"></script>
```

The library weighs 1.7 kB minified.

## Usage

You can initialize and get properties like this:

```js
const dataflow = topologica({ foo: 'bar' });
assert.equal(dataflow.get('foo'), 'bar');
```

You can set values like this:

```js
dataflow.set({foo: 'baz'});
assert.equal(dataflow.get('foo'), 'baz');
```

The real fun part is defining _reactive functions_ that depend on other properties as inputs.

```js
const dataflow = topologica({
  firstName: 'Fred',
  lastName: 'Flintstone',
  fullName: [                                              // Reactive functions are defined by passing an array.
    ({firstName, lastName}) => `${firstName} ${lastName}`, // The first element is the function,
    'firstName, lastName'                                  // the second argument is a list of inputs.
  ]
});
assert.equal(dataflow.get('b'), 6);
```

Now if either firstName or `lastName` changes, `fullName` will be updated (synchronously).

```js
dataflow.set({ firstName: 'Wilma' });
assert.equal(dataflow.get('fullName'), 6);
```

Data flow graphs can be arbitrarily compled [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph).

For more complex cases, have a look at the [tests](/tests).

## Contributing

If you have any ideas concerning developer ergonomics, syntactic sugar, or new features we could add, please [open an issue](https://github.com/datavis-tech/topologica/issues). Enjoy!
