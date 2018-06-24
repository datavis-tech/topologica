# Topologica.js
Small (2 kB minified) library for [reactive](https://en.wikipedia.org/wiki/Reactive_programming) [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming).

This library provides an abstraction for **reactive data flows**. This means you can define functions in terms of their inputs (dependencies) and outputs, and the library will take care of executing _only_ the required functions to propagate changes through the data flow graph, in the correct order. The ordering of change propagation through the data flow graph is determined using the [topological sorting algorithm](https://en.wikipedia.org/wiki/Topological_sorting) (hence the name _Topologica_).

Why use topological sorting? In the following data flow graph, propagation using [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) (which is what [Model.js](https://github.com/curran/model) and some other libraries use) would cause `e` to be set twice, and the first time it would be set with an *inconsistent state* (as occurs with ["glitches" in reactive programming](https://en.wikipedia.org/wiki/Reactive_programming#Glitches)). Using topological sorting for change propagation guarantees that `e` will only be set once, and there will never be inconsistent states.

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15400254/7f779c9a-1e08-11e6-8992-9d2362bfba63.png">
  <br>
  The tricky case, where breadth-first propagation fails but topological sorting succeeds.
</p>

## Installing

You can install via [NPM](https://www.npmjs.com/package/topologica) like this:

```
npm install --save-dev topologica
```

Then import it into your code like this:

```js
import { DataFlowGraph, ReactiveFunction as λ } from 'topologica';
```

You can also include the library in a script tag from Unpkg, like this:

```html
<script src="https://unpkg.com/topologica@1.0.0/dist/topologica.min.js"></script>
<script>
  const { DataFlowGraph, ReactiveFunction: λ } = Topologica;
</script>
```

## Examples

 * [Color Picker Example](https://datavis.tech/edit/09fb48921c454e90aa74d72fbe2eb8a0) - Pick a color with 3 sliders.

## Usage

You can define _reactive functions_ that compute properties that depend on other properties as input. For example, consider the following example where `b` gets set to `a + 1` whenever `a` changes.

```javascript
const dataFlow = DataFlowGraph({
  b: λ(
    ({a}) => a + 1,
    'a'
  )
});
dataFlow.set({ a: 2 });
assert.equal(dataFlow.get('b'), 3);
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15453189/89c06740-2029-11e6-940b-58207a1492ca.png">
  <br>
  When a changes, b gets updated.
</p>

Here's an example that assigns `b = a + 1` and `c = b + 1`.

```javascript
const dataFlow = DataFlowGraph({
  b: λ(({a}) => a + 1, 'a'),
  c: λ(({b}) => b + 1, 'b')
});
dataFlow.set({ a: 5 });
assert.equal(dataFlow.get('c'), 7);
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15385597/44a10522-1dc0-11e6-9054-2150f851db46.png">
  <br>
  Here, b is both an output and an input.
</p>

Here's an example that uses an asynchronous function.

```javascript
const dataFlow = DataFlowGraph({
  b: λ(
    async ({a}) => await Promise.resolve(a + 5),
    'a'
  ),
  c: λ(
    ({b}) => assert.equal(b, 10),
    'b'
  )
});
dataFlow.set({ a: 5 });
```

<p align="center">
  <img src="https://user-images.githubusercontent.com/68416/41818527-7e41eba6-77ce-11e8-898a-9f85de1563ed.png">
  <br>
  Asynchronous functions cut the dependency graph.
</p>

Here's an example that computes a person's full name from their first name and and last name.

```js
const { DataFlowGraph, ReactiveFunction: λ } = Topologica;
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
```

Now if either firstName or `lastName` changes, `fullName` will be updated (synchronously).

```js
dataFlow.set({ firstName: 'Wilma' });
assert.equal(dataFlow.get('fullName'), 'Wilma Flintstone');
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15389922/cf3f24dc-1dd6-11e6-92d6-058051b752ea.png">
  <br>
  The data flow graph for the example code above.
</p>

You can use reactive functions to trigger code with side effects, like DOM manipulation:

```js
const dataFlow = DataFlowGraph({
  fullName: λ(
    ({firstName, lastName}) => `${firstName} ${lastName}`,
    'firstName, lastName'
  )
  fullNameText: λ(
    ({fullName}) => d3.select('#full-name').text(fullName),
    'fullName'
  )
});
assert.equal(d3.select('#full-name').text(), 'Fred Flintstone');
```

Data flow graphs can be arbitrarily complex [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph).

Here's the tricky case, where breadth-first propagation fails but topological sorting succeeds.

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15400254/7f779c9a-1e08-11e6-8992-9d2362bfba63.png">
</p>

```js
const dataFlow = DataFlowGraph({
  b: λ(({a}) => a + 1, 'a'),
  c: λ(({b}) => b + 1, 'b'),
  d: λ(({a}) => a + 1, 'a'),
  e: λ(({b, d}) => b + d, 'b, d')
});
dataFlow.set({ a: 5 });
const a = 5;
const b = a + 1;
const c = b + 1;
const d = a + 1;
const e = b + d;
assert.equal(dataFlow.get('e'), e);
```

For more complex cases, have a look at the [tests](/test/test.js).

## Contributing

If you have any ideas concerning developer ergonomics, syntactic sugar, or new features, please [open an issue](https://github.com/datavis-tech/topologica/issues).

## Related Work

This library is a minimalistic reincarnation of [ReactiveModel](https://github.com/datavis-tech/reactive-model), which is a re-write of its precursor [Model.js](https://github.com/curran/model).

The minimalism and synchronous execution are inspired by similar features in [Observable](https://beta.observablehq.com).

Similar initiatives:

 * [Mobx](https://github.com/mobxjs/mobx) Very similar library, with React bindings and more API surface area.
 * [DVL](https://github.com/vogievetsky/DVL) Early work on reactive data visualizations.
 * [ZJONSSON/clues](https://github.com/ZJONSSON/clues) A very similar library based on Promises.
 * [Ember Computed Properties](https://guides.emberjs.com/v2.18.0/object-model/computed-properties/) Similar structure of dependencies and reactivity.
 * [AngularJS Dependency Injection](https://docs.angularjs.org/guide/di) Inspired the API for reactive functions.
 * [AngularJS $digest()](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest) Inspired the "digest" term.
 * [RxJS](https://github.com/Reactive-Extensions/RxJS) and [Bacon](https://baconjs.github.io/) Full blown FRP packages.
 * [Vue.js Computed Properties](https://vuejs.org/v2/guide/computed.html)
 * [Vega Dataflow](https://github.com/vega/vega-dataflow)
