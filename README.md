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

  // Reactive functions are defined by passing an array.
  fullName: [
    ({firstName, lastName}) => `${firstName} ${lastName}`, // The first element is the function,
    'firstName, lastName'                                  // the second argument is a list of inputs.
  ]
});
assert.equal(dataflow.get('fullName'), 'Fred Flintstone');
```

Now if either firstName or `lastName` changes, `fullName` will be updated (synchronously).

```js
dataflow.set({ firstName: 'Wilma' });
assert.equal(dataflow.get('fullName'), 'Wilma Flintstone');
```

You can use reactive functions to trigger code with side effects, like DOM manipulation:

```js
const dataflow = topologica({
  firstName: 'Fred',
  lastName: 'Flintstone',
  fullName: [({firstName, lastName}) => `${firstName} ${lastName}`, 'firstName, lastName' ]
  fullNameText: [({fullName}) => d3.select('#full-name').text(fullName), 'fullName']
});
assert.equal(d3.select('#full-name').text(), 'Fred Flintstone');
```

Data flow graphs can be arbitrarily complex [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph).

For more complex cases, have a look at the [tests](/test/test.js).

## Contributing

If you have any ideas concerning developer ergonomics, syntactic sugar, or new features, please [open an issue](https://github.com/datavis-tech/topologica/issues).

## Related Work

This library is a minimalistic reincarnation of [ReactiveModel](https://github.com/datavis-tech/reactive-model), which is a re-write of its precursor [Model.js](https://github.com/curran/model). The minimalism and synchronous execution are inspired by similar features in [Observable](https://beta.observablehq.com).

Similar initiatives:

 * [Mobx](https://github.com/mobxjs/mobx) Very similar library, with React bindings and more API surface area.
 * [DVL](https://github.com/vogievetsky/DVL) Early work on reactive data visualizations.
 * [ZJONSSON/clues](https://github.com/ZJONSSON/clues) A very similar library based on Promises.
 * [Ember Computed Properties](https://guides.emberjs.com/v2.18.0/object-model/computed-properties/) Similar structure of dependencies and reactivity.
 * [AngularJS Dependency Injection](https://docs.angularjs.org/guide/di) Inspired the API for reactive functions.
 * [AngularJS $digest()](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest) Inspired the "digest" term.
 * [RxJS](https://github.com/Reactive-Extensions/RxJS) and [Bacon](https://baconjs.github.io/) Full blown FRP packages.
