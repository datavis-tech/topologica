# Topologica.js
A minimal library for [reactive](https://en.wikipedia.org/wiki/Reactive_programming) [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming). Weighs [1.2KB minified](https://unpkg.com/topologica).

This library provides an abstraction for **reactive data flows**. This means you can define functions in terms of their inputs (dependencies) and outputs, and the library will take care of executing _only_ the required functions to propagate changes through the data flow graph, in the correct order. The ordering of change propagation through the data flow graph is determined using the [topological sorting algorithm](https://en.wikipedia.org/wiki/Topological_sorting) (hence the name _Topologica_).  

This library is primarily intended for use in creating user interfaces and data visualizations using [D3.js](https://d3js.org/) and [Redux](https://redux.js.org/). The problem with using straight Redux and a functional component approach with data visualizations is that it leads to unnecessary execution of heavyweight computations over data on every render. For example, if you change the highlighted element, or the text of an axis label, the entire visualization including scales and rendering of marks would be recomputed. By using Topologica within visualization components, you can improve performance by only executing heavy computations when they are required.

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
import Topologica from 'topologica';
```

You can also include the library in a script tag from Unpkg, like this:

```html
<script src="https://unpkg.com/topologica@2.1.0/dist/topologica.min.js"></script>
```

This introduces the global `Topologica`.

## Examples

 * [Color Picker Example](https://datavis.tech/edit/09fb48921c454e90aa74d72fbe2eb8a0) - Pick a color with 3 sliders.

## Usage

You can define _reactive functions_ that compute properties that depend on other properties as input. These properties exist on objects that are instances of `Topologica`, so in a sense they are namespaced rather than free-floating. For example, consider the following example where `b` gets set to `a + 1` whenever `a` changes.

```javascript
// First, define a function that accepts an options object as an argument.
const b = ({a}) => a + 1;

// Next, declare the dependencies of this function as an array of names.
b.dependencies = ['a'];

// Pass this function into the Topologica constructor.
const state = Topologica({ b });

// Setting the value of a will synchronously propagate changes to B.
state.set({ a: 2 });

// You can use state.get to retreive computed values.
assert.equal(state.get('b'), 3);
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15453189/89c06740-2029-11e6-940b-58207a1492ca.png">
  <br>
  When a changes, b gets updated.
</p>

Here's an example that assigns `b = a + 1` and `c = b + 1`.

```javascript
const b = ({a}) => a + 1
b.dependencies = ['a'];

const c = ({b}) => b + 1;
c.dependencies = ['b'];

const state = Topologica({ b, c });

state.set({ a: 5 });
assert.equal(state.get('c'), 7);
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15385597/44a10522-1dc0-11e6-9054-2150f851db46.png">
  <br>
  Here, b is both an output and an input.
</p>

## Asynchronous Functions

Here's an example that uses an asynchronous function. There is no specific functionality in the library for supporting asynchronous functions differently, but this is a recommended pattern for working with them:

 * Use a property for the promise itself, where nothing depends on this property.
 * Call `.set` asynchronously after the promise resolves.

```javascript
const state = Topologica({
  bPromise: λ(
    ({a}) => Promise.resolve(a + 5).then(b => state.set({ b })),
    'a'
  ),
  c: λ(
    ({b}) => {
      console.log(b); // Prints 10
    },
    'b'
  )
});
state.set({ a: 5 });
```

<p align="center">
  <img src="https://user-images.githubusercontent.com/68416/41818527-7e41eba6-77ce-11e8-898a-9f85de1563ed.png">
  <br>
  Asynchronous functions cut the dependency graph.
</p>

## Complex Dependency Graphs

The dependency graphs within an instance of Topologa can be arbitrarily complex [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph). This section shows some examples building in complexity.

Here's an example that computes a person's full name from their first name and and last name.

```js
const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
fullName.dependencies = 'firstName, lastName';

const state = Topologica({ fullName });

state.set({ firstName: 'Fred', lastName: 'Flintstone' });
assert.equal(state.get('fullName'), 'Fred Flintstone');
```

Now if either firstName or `lastName` changes, `fullName` will be updated (synchronously).

```js
state.set({ firstName: 'Wilma' });
assert.equal(state.get('fullName'), 'Wilma Flintstone');
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15389922/cf3f24dc-1dd6-11e6-92d6-058051b752ea.png">
  <br>
  Full name changes whenever its dependencies change.
</p>

Note that `dependencies` can be passed in as either:

 * an array of strings (e.g. `['firstName', 'lastName']`), or
 * a comma delimited string (e.g. `firstName, lastName`).

For the rest of the examples here, we'll make use of the following convenience function for constructing reactive functions using a single statement:

```js
const λ = (fn, dependencies) => {
  fn.dependencies = dependencies;
  return fn;
};
```

While this convenience function is useful for the examples here in this README, it is not part of the library itself. This is to keep the library minimal. If you think this function should be part of the library, please open a new issue.

Here's the previous example re-written to use this convenience function.

```js
const state = Topologica({
  fullName: λ(
    ({firstName, lastName}) => `${firstName} ${lastName}`,
    'firstName, lastName'
  )
});
```

You can use reactive functions to trigger code with side effects like DOM manipulation.

```js
const state = Topologica({
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

Here's the tricky case, where breadth-first or time-tick-based propagation fails (e.g. `when` in RxJS) but topological sorting succeeds.

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15400254/7f779c9a-1e08-11e6-8992-9d2362bfba63.png">
</p>

```js
const state = Topologica({
  b: λ(({a}) => a + 1, 'a'),
  c: λ(({b}) => b + 1, 'b'),
  d: λ(({a}) => a + 1, 'a'),
  e: λ(({b, d}) => b + d, 'b, d')
});
state.set({ a: 5 });
const a = 5;
const b = a + 1;
const c = b + 1;
const d = a + 1;
const e = b + d;
assert.equal(state.get('e'), e);
```

For more examples, have a look at the [tests](/test/test.js).

## Contributing

Feel free to [open an issue](https://github.com/datavis-tech/topologica/issues). Pull requests for open issues are welcome.

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
 * [Crosslink.js](https://github.com/monfera/crosslink)
 * [Flyd](https://github.com/paldepind/flyd)
 * [Javelin](https://github.com/hoplon/javelin)

See also this excellent article [State management in JavaScript by David Meister](https://codeburst.io/state-management-in-javascript-15d0d98837e1).
