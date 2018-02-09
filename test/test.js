const topologica = require('..');
const assert = require('assert');

describe('Test', function (){

  it('Should set and get an initial value.', function (){
    const dataflow = topologica({ foo: 'bar' });
    assert.equal(dataflow.get('foo'), 'bar');
  });

  it('Should set a value after construction.', function (){
    const dataflow = topologica({ foo: 'bar' });
    dataflow.set({foo: 'baz'});
    assert.equal(dataflow.get('foo'), 'baz');
  });

  it('Should compute a derived property.', function (){
    const dataflow = topologica({
      a: 5,
      b: [({a}) => a + 1, 'a']
    });
    assert.equal(dataflow.get('b'), 6);
  });

  it('Should handle uninitialized property.', function (){
    const dataflow = topologica({
      b: [({a}) => a + 1, 'a']
    });
    assert.equal(dataflow.get('b'), undefined);
  });

  it('Should propagate changes synchronously.', function (){
    const dataflow = topologica({
      b: [({a}) => a + 1, 'a']
    });

    dataflow.set({a: 2});
    assert.equal(dataflow.get('b'), 3);

    dataflow.set({a: 99});
    assert.equal(dataflow.get('b'), 100);
  });

  it('Should compute a derived property with 2 hops.', function (){
    const dataflow = topologica({
      a: 5,
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b']
    });
    assert.equal(dataflow.get('c'), 7);
  });

  it('Should handle case of 2 inputs.', function (){
    const dataflow = topologica({
      a: 5,
      b: 8,
      c: [({a, b}) => a + b, 'a,b']
    });
    assert.equal(dataflow.get('c'), 13);
  });

  it('Should handle case of 3 inputs.', function (){
    const dataflow = topologica({
      a: 5,
      b: 8,
      c: 2,
      d: [({a, b, c}) => a + b + c, 'a,b,c']
    });
    assert.equal(dataflow.get('d'), 15);
  });

  it('Should handle spaces in input string.', function (){
    const dataflow = topologica({
      a: 5,
      b: 8,
      c: 2,
      d: [({a, b, c}) => a + b + c, '  a ,    b, c   ']
    });
    assert.equal(dataflow.get('d'), 15);
  });

  // Data flow graph, read from top to bottom.
  //
  //  a   c
  //  |   |
  //  b   d
  //   \ /
  //    e   
  //
  it('Should evaluate not-too-tricky case.', function (){
    const dataflow = topologica({
      a: 1,
      c: 2,
      b: [({a}) => a + 1, 'a'],
      d: [({c}) => c + 1, 'c'],
      e: [({b, d}) => b + d, 'b, d']
    });
    assert.equal(dataflow.get('e'), (1 + 1) + (2 + 1));
  });

  //      a
  //     / \
  //    b   |
  //    |   d
  //    c   |
  //     \ /
  //      e   
  it('Should evaluate tricky case.', function (){
    const dataflow = topologica({
      a: 5,
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({a}) => a + 1, 'a'],
      e: [({b, d}) => b + d, 'b, d']
    });
    const a = dataflow.get('a');
    const b = a + 1;
    const c = b + 1;
    const d = a + 1;
    const e = b + d;
    assert.equal(dataflow.get('e'), e);
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
  it('Should evaluate trickier case.', function (){
    const dataflow = topologica({
      a: 5,
      b: [({a}) => a + 1, 'a'],
      c: [({b}) => b + 1, 'b'],
      d: [({c}) => c + 1, 'c'],
      e: [({a}) => a + 1, 'a'],
      f: [({e}) => e + 1, 'e'],
      g: [({a}) => a + 1, 'a'],
      h: [({d, f, g}) => d + f + g, 'd, f, g']
    });
    const a = dataflow.get('a');
    const b = a + 1;
    const c = b + 1;
    const d = c + 1;
    const e = a + 1;
    const f = e + 1;
    const g = a + 1;
    const h = d + f + g;
    assert.equal(dataflow.get('h'), h);
  });
});
//    it("Should work with booleans.", function (){
//      var my = ReactiveModel()
//        ("a", 5);
//      
//      my("b", function (a){
//        return !a;
//      }, "a");
//
//      my.a(false);
//      ReactiveModel.digest();
//      assert.equal(my.b(), true);
//
//      my.a(true);
//      ReactiveModel.digest();
//      assert.equal(my.b(), false);
//      my.destroy();
//    });
//
//    it("Should work with null as assigned value.", function (){
//      var my = ReactiveModel()
//        ("a", 5);
//
//      my("b", function (a){
//        if(a !== 5) return true;
//      }, "a");
//
//      my.a(null);
//
//      ReactiveModel.digest();
//      assert.equal(my.b(), true);
//      my.destroy();
//    });
//
//    it("Should work with null as default value.", function (){
//      var my = ReactiveModel()
//        ("a", null);
//
//      assert.equal(my.a(), null);
//
//      my("b", function (a){
//        return true;
//      }, "a");
//
//      ReactiveModel.digest();
//      assert.equal(my.b(), true);
//      my.destroy();
//    });
//
//    it("Should work with asynchronous case.", function (testDone){
//      var my = new ReactiveModel()
//        ("a", 5);
//
//      // Similarly to mocha, if an extra "done" argument is on the function,
//      // it is treated as an asynchronous function. The "done" callback should
//      // be invoked asynchronously with the new value for the output property.
//      my
//        ("b", function (a, done){
//          setTimeout(function (){
//            done(a + 1);
//          }, 20);
//        }, "a")
//        ("c", function (b){
//          assert.equal(b, 2);
//          my.destroy();
//          testDone();
//        }, "b");
//
//      my.a(1);
//    });
//
//    it("Should work with asynchronous case that is not actually asynchronous.", function (testDone){
//      var my = new ReactiveModel()
//        ("a", 5);
//
//      my
//        ("b", function (a, done){
//
//          // The "done" callback is being invoked synchronously.
//          // This kind of code should not be written, but just in case people do it by accident,
//          // the library is set up to have the expected behavior.
//          done(a + 1);
//
//        }, "a")
//        ("c", function (b){
//          assert.equal(b, 2);
//          my.destroy();
//          testDone();
//        }, "b");
//
//      my.a(1);
//    });
//    // TODO should throw an error if done() is called more than once.
//
//
//    it("Should support reactive functions with no return value.", function(){
//      var my = ReactiveModel()
//        ("a", 5);
//
//      var sideEffect;
//
//      my(function (a){
//        sideEffect = a + 1;
//      }, "a");
//
//      ReactiveModel.digest();
//      assert.equal(sideEffect, 6);
//
//      output("side-effect");
//      
//      my.destroy();
//    });
//
//    it("Should support no return value and multiple inputs.", function(){
//      var my = ReactiveModel()
//        ("a", 5)
//        ("b", 50);
//
//      var sideEffect;
//
//      my(function (a, b){
//        sideEffect = a + b;
//      }, "a, b");
//
//      ReactiveModel.digest();
//      assert.equal(sideEffect, 55);
//
//      output("side-effect-ab");
//      
//      my.destroy();
//    });
//
//    it("Should support no return value and multiple inputs defined as array.", function(){
//      var my = ReactiveModel()
//        ("a", 40)
//        ("b", 60);
//
//      var sideEffect;
//
//      my(function (a, b){
//        sideEffect = a + b;
//      }, ["a", "b"]);
//
//      ReactiveModel.digest();
//      assert.equal(sideEffect, 100);
//      my.destroy();
//    });
//
//    it("Should serialize the data flow graph.", function (){
//      var my = ReactiveModel()
//        ("firstName", "Jane")
//        ("lastName", "Smith")
//        ("fullName", function (firstName, lastName){
//          return firstName + " " + lastName;
//        }, "firstName, lastName");
//
//      var serialized = ReactiveModel.serializeGraph();
//
//      //console.log(JSON.stringify(serialized, null, 2));
//
//      assert.equal(serialized.nodes.length, 3);
//      assert.equal(serialized.links.length, 2);
//
//      var idStart = 93;
//
//      assert.equal(serialized.nodes[0].id, String(idStart));
//      assert.equal(serialized.nodes[1].id, String(idStart + 1));
//      assert.equal(serialized.nodes[2].id, String(idStart + 2));
//
//      assert.equal(serialized.nodes[0].propertyName, "fullName");
//      assert.equal(serialized.nodes[1].propertyName, "firstName");
//      assert.equal(serialized.nodes[2].propertyName, "lastName");
//
//      assert.equal(serialized.links[0].source, String(idStart + 1));
//      assert.equal(serialized.links[0].target, String(idStart));
//      assert.equal(serialized.links[1].source, String(idStart + 2));
//      assert.equal(serialized.links[1].target, String(idStart));
//
//      my.destroy();
//    });
//
//    it("Should support nested digest.", function (){
//      var my = ReactiveModel()
//        ("a", 5)
//        ("b")
//        ("c", function (b){
//          return b / 2;
//        }, "b")
//        (function (a){
//          for(var i = 0; i < a; i++){
//            my.b(i);
//            ReactiveModel.digest();
//            assert.equal(my.c(), i / 2);
//          }
//        }, "a");
//      ReactiveModel.digest();
//    });
//
//  });
//
//  describe("Cleanup", function (){
//
//    it("Should remove synchronous reactive function on destroy.", function (){
//      var my = ReactiveModel()
//        ("a", 5)
//        ("b", increment, "a");
//
//      my.a(10);
//      ReactiveModel.digest();
//      assert.equal(my.b(), 11);
//
//      my.destroy();
//      my.a(20);
//      ReactiveModel.digest();
//      assert.equal(my.b(), 11);
//    });
//
//    it("Should remove asynchronous reactive function on destroy.", function (done){
//      var my = ReactiveModel()
//        ("a", 5);
//
//      my("b", function (a, done){
//        setTimeout(function(){
//          done(a + 1);
//        }, 5);
//      }, "a");
//
//      my.a(10);
//      ReactiveModel.digest();
//      setTimeout(function(){
//        assert.equal(my.b(), 11);
//        my.destroy();
//        my.a(20);
//
//        setTimeout(function(){
//          assert.equal(my.b(), 11);
//          done();
//        }, 10);
//
//        assert.equal(my.b(), 11);
//      }, 10);
//    });
//
//    it("Should remove property listeners on destroy.", function (){
//      var my = ReactiveModel()("a", 50),
//          a = my.a,
//          numInvocations = 0;
//      a.on(function (){ numInvocations++; });
//      assert.equal(numInvocations, 1);
//
//      my.destroy();
//
//      a(5);
//      assert.equal(numInvocations, 1);
//    });
//  });
//
//  describe("model.link()", function (){
//    it("Should link between models.", function (){
//      var model1 = ReactiveModel()("someOutput", 5);
//      var model2 = ReactiveModel()("someInput", 10);
//      var link = ReactiveModel.link(model1.someOutput, model2.someInput);
//
//      ReactiveModel.digest();
//      assert.equal(model2.someInput(), 5);
//
//      model1.someOutput(500);
//      ReactiveModel.digest();
//      assert.equal(model2.someInput(), 500);
//
//      link.destroy();
//    });
//  });
//
//  describe("model.call()", function (){
//
//    it("Should support model.call().", function(){
//
//      function mixin(my){
//        my("a", 5)
//          ("b", increment, "a");
//      }
//
//      var my = ReactiveModel()
//        .call(mixin);
//
//      ReactiveModel.digest();
//      
//      assert.equal(my.b(), 6);
//    });
//
//    it("Should support model.call() with 1 argument.", function(){
//
//      function mixin(my, amount){
//        my("a", 5)
//          ("b", function (a){
//            return a + amount;
//          }, "a");
//      }
//
//      var my = ReactiveModel()
//        .call(mixin, 2);
//
//      ReactiveModel.digest();
//      
//      assert.equal(my.b(), 7);
//    });
//
//    it("Should support model.call() with 2 arguments.", function(){
//
//      function mixin(my, amount, factor){
//        my("a", 5)
//          ("b", function (a){
//            return (a + amount) * factor;
//          }, "a");
//      }
//
//      var my = ReactiveModel()
//        .call(mixin, 2, 3);
//
//      ReactiveModel.digest();
//      
//      assert.equal(my.b(), 21);
//    });
//  });
//
//  describe("Edge Cases and Error Handling", function (){
//
//    it("Should throw error when input property is not defined.", function(){
//      assert.throws(function (){
//        ReactiveModel()(function (a){}, "a");
//      }, /The property "a" was referenced as a dependency for a reactive function before it was defined. Please define each property first before referencing them in reactive functions./);
//    });
//
//    it("Should throw error when output property is already defined.", function(){
//      assert.throws(function (){
//        ReactiveModel()
//          ("a", 5)
//          ("a", function (a){}, "a");
//      }, /The property "a" is already defined./);
//    });
//
//    it("Should throw error when newly added property is already defined.", function(){
//      assert.throws(function (){
//        ReactiveModel()
//          ("b", 5)
//          ("b", 15);
//      }, /The property "b" is already defined./);
//    });
//
//  });
//});
