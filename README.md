# Topologica.js
A library for [reactive programming](https://en.wikipedia.org/wiki/Reactive_programming). Weighs [1KB minified](https://unpkg.com/topologica).

This library provides an abstraction for **reactive data flows**. This means you can declaratively specify a [dependency graph](https://en.wikipedia.org/wiki/Dependency_graph), and the library will take care of executing _only_ the required functions to propagate changes through the graph in the correct order. Nodes in the dependency graph are named properties, and edges are reactive functions that compute derived properties as functions of their dependencies. The order of execution is determined using the [topological sorting algorithm](https://en.wikipedia.org/wiki/Topological_sorting), hence the name _Topologica_.

Topologica is primarily intended for use in optimizing interactive data visualizations created using [D3.js](https://d3js.org/) and a unidirectional data flow approach. The problem with using unidirectional data flow with interactive data visualizations is that it leads to **unnecessary execution of heavyweight computations over data on every render**. For example, if you change the highlighted element, or the text of an axis label, the entire visualization including scales and rendering of all marks would be recomputed and re-rendered to the DOM unnecessarily. Topologica.js lets you improve performance by only executing heavy computation and rendering operations when they are actually required. It also allows you to simplify your code by splitting it into logical chunks based on reactive functions, and makes it so you don't need to think about order of execution at all.

Why use topological sorting? To **avoid inconsistent state.** In the following data flow graph, propagation using [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) (which is what [Model.js](https://github.com/curran/model) and some other libraries use) would cause `e` to be set twice, and the first time it would be set with an *inconsistent state* (as occurs with ["glitches" in reactive programming](https://en.wikipedia.org/wiki/Reactive_programming#Glitches)). Using topological sorting for change propagation guarantees that `e` will only be set once, and there will never be inconsistent states.

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
<script src="https://unpkg.com/topologica@3.1.0/dist/topologica.min.js"></script>
```

This script tag introduces the global `Topologica`.

## API Reference

<a name="constructor" href="#constructor">#</a> <b>Topologica</b>(<i>reactiveFunctions</i>)

Constructs a new data flow graph with the given <i>reactiveFunctions</i> argument, an object whose keys are the names of computed properties and whose values are reactive functions. By convention, the variable name `dataflow` is used for instances of Topologica, because they are reactive data flow graphs.

```js
const dataflow = Topologica({ fullName });
```

A reactive function accepts a single argument, an object containing values for its dependencies, and has an explicit representation of its dependencies. A reactive function can either be represented as a **function** with a _dependencies_ property, or as an **array** where the first element is the function and the second element is the dependencies. Dependencies can be represented either as an array of property name strings, or as a comma delimited string of property names.

<table>
  <thead>
    <tr>
      <th></th>
      <th>function</th>
      <th>array</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dependencies array</td>
      <td><pre lang="js">const fullName =
  ({firstName, lastName}) =>
    ${firstName} ${lastName};
fullName.dependencies =
  ['firstName', 'lastName'];</pre></td>
      <td><pre lang="js">const fullName = [
  ({firstName, lastName}) =>
    ${firstName} ${lastName},
  ['firstName', 'lastName']
];</pre></td>
    </tr>
    <tr>
      <td>Dependencies string</td>
      <td><pre lang="js">const fullName =
  ({firstName, lastName}) =>
    ${firstName} ${lastName};
fullName.dependencies =
  'firstName, lastName';</pre></td>
      <td><pre lang="js">const fullName = [
  ({firstName, lastName}) =>
    ${firstName} ${lastName},
  'firstName, lastName'
];</pre></td>
    </tr>
  </tbody>
</table>

This table shows all 4 ways of defining a reactive function, each of which may be useful in different contexts.

 * **dependencies** If you are typing the dependencies by hand, it makes sense to use the comma-delimited string variant, so that you can easily copy-paste between it and a destructuring assignment (most common case). If you are deriving dependencies programmatically, it makes sense to use the array variant instead.
 * **reactive functions** If you want to define a reactive function in a self-contained way, for example as a separate module, it makes sense to use the variant where you specify `.dependencies` on a function (most common case). If you want to define multiple smaller reactive functions as a group, for example in the statement that constructs the Topologica instance, then it makes sense to use the more compact two element array variant.

<a name="set" href="#set">#</a> <i>dataflow</i>.<b>set</b>(<i>stateChange</i>)

Performs a shallow merge of `stateChange` into the current state, and propages the change through the data flow graph (synchronously) using topological sort. You can use this to set the values for properties that reactive functions depend on. If a property is not included in `stateChange`, it retains its previous value.

```js
dataflow.set({
  firstName: 'Fred',
  lastName: 'Flintstone'
});
```

The above example sets two properties at once, `firstName` and `lastName`. When this is invoked, all dependencies of `fullName` are defined, so `fullName` is synchronously computed.

If a property in `stateChange` is equal to its previous value using strict equality (`===`), it is _not_ considered changed, and reactive functions that depend on it will _not_ be invoked. You should therefore use only [immutable update patterns](https://redux.js.org/recipes/structuringreducers/immutableupdatepatterns) when changing objects and arrays.

If a property in `stateChange` is not equal to its previous value using strict equality (`===`), it _is_ considered changed, and reactive functions that depend on it _will_ be invoked. This can be problematic if you're passing in callback functions and defining them inline in each invocation. For this case, consider defining the callbacks once, and passing in the same reference on each invocation ([example](https://vizhub.com/curran/27c261085d8a48618c69f7983672903b)), so that the strict equality check will succeed.

<a name="get" href="#get">#</a> <i>dataflow</i>.<b>get</b>()
Gets the current state of all properties, including derived properties.

```js
const state = dataflow.get();
console.log(state.fullName); // Prints 'Fred Flintstone'
```

Assigning values directly to the returned `state` object (for example `state.firstName = 'Wilma'`) will _not_ trigger reactive functions. Use [set](#set) instead.

## Usage Examples

External running examples:

 * [Hello Topologica.js!](https://vizhub.com/curran/607a261492e24c308707c3ae413b3981) - Pick a color with 3 sliders.
 * [Bowl of Fruit - Topologica Experiment](https://vizhub.com/curran/27c261085d8a48618c69f7983672903b) - A proposed approach for using Topologica with D3.
 * [Topologica Layers Experiment](https://vizhub.com/curran/f26d83673fca4d17a7579f3fdba400d6) - Experiment with interactive highlighting.

You can define _reactive functions_ that compute properties that depend on other properties as input. These properties exist on instances of `Topologica`, so in a sense they are namespaced rather than free-floating. For example, consider the following example where `b` gets set to `a + 1` whenever `a` changes.

```javascript
// First, define a function that accepts an options object as an argument.
const b = ({a}) => a + 1;

// Next, declare the dependencies of this function as an array of names.
b.dependencies = ['a'];

// Pass this function into the Topologica constructor.
const dataflow = Topologica({ b });

// Setting the value of a will synchronously propagate changes to B.
dataflow.set({ a: 2 });

// You can use dataflow.get to retreive computed values.
assert.equal(dataflow.get().b, 3);
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

const dataflow = Topologica({ b, c }).set({ a: 5 });
assert.equal(dataflow.get().c, 7);
```

Note that `set` returns the `Topologica` instance, so it is chainable.

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15385597/44a10522-1dc0-11e6-9054-2150f851db46.png">
  <br>
  Here, b is both an output and an input.
</p>

### Asynchronous Functions

Here's an example that uses an asynchronous function. There is no specific functionality in the library for supporting asynchronous functions differently, but this is a recommended pattern for working with them:

 * Use a property for the promise itself, where nothing depends on this property.
 * Call `.set` asynchronously after the promise resolves.

```javascript
const dataflow = Topologica({
  bPromise: [
    ({a}) => Promise.resolve(a + 5).then(b => dataflow.set({ b })),
    'a'
  ],
  c: [
    ({b}) => {
      console.log(b); // Prints 10
    },
    'b'
  ]
});
dataflow.set({ a: 5 });
```

<p align="center">
  <img src="https://user-images.githubusercontent.com/68416/41818527-7e41eba6-77ce-11e8-898a-9f85de1563ed.png">
  <br>
  Asynchronous functions cut the dependency graph.
</p>

### Complex Dependency Graphs

The dependency graphs within an instance of Topologa can be arbitrarily complex [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph). This section shows some examples building in complexity.

Here's an example that computes a person's full name from their first name and and last name.

```js
const fullName = ({firstName, lastName}) => `${firstName} ${lastName}`;
fullName.dependencies = 'firstName, lastName';

const dataflow = Topologica({ fullName });

dataflow.set({ firstName: 'Fred', lastName: 'Flintstone' });
assert.equal(dataflow.get().fullName, 'Fred Flintstone');
```

Now if either firstName or `lastName` changes, `fullName` will be updated (synchronously).

```js
dataflow.set({ firstName: 'Wilma' });
assert.equal(dataflow.get().fullName, 'Wilma Flintstone');
```

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15389922/cf3f24dc-1dd6-11e6-92d6-058051b752ea.png">
  <br>
  Full name changes whenever its dependencies change.
</p>

Here's the previous example re-written to specify the reactive function using a two element array with dependencies specified as a comma delimited string. This is the form we'll use for the rest of the examples here.

```js
const dataflow = Topologica({
  fullName: [
    ({firstName, lastName}) => `${firstName} ${lastName}`,
    'firstName, lastName'
  ]
});
```

You can use reactive functions to trigger code with side effects like DOM manipulation.

```js
const dataflow = Topologica({
  fullName: [
    ({firstName, lastName}) => `${firstName} ${lastName}`,
    'firstName, lastName'
  ]
  fullNameText: [
    ({fullName}) => d3.select('#full-name').text(fullName),
    'fullName'
  ]
});
assert.equal(d3.select('#full-name').text(), 'Fred Flintstone');
```

Here's the tricky case, where breadth-first or time-tick-based propagation fails (e.g. `when` in RxJS) but topological sorting succeeds.

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/68416/15400254/7f779c9a-1e08-11e6-8992-9d2362bfba63.png">
</p>

```js
const dataflow = Topologica({
  b: [({a}) => a + 1, 'a'],
  c: [({b}) => b + 1, 'b'],
  d: [({a}) => a + 1, 'a'],
  e: [({b, d}) => b + d, 'b, d']
});
dataflow.set({ a: 5 });
const a = 5;
const b = a + 1;
const c = b + 1;
const d = a + 1;
const e = b + d;
assert.equal(dataflow.get().e, e);
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
