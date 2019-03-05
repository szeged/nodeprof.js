/*******************************************************************************
 * Copyright [2018] [Haiyang Sun, Università della Svizzera Italiana (USI)]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/

// DO NOT INSTRUMENT
J$={};
(function (sandbox) {
  if(!process.config.variables.graalvm) {
    console.log("nodeprof only works in graalvm")
    return;
  }
  try {
    sandbox.adapter = __jalangiAdapter;
    sandbox.iidToLocation = function(iid){
      return sandbox.adapter.iidToLocation(iid);
    };
    sandbox.getGlobalIID = function(iid) {
      return iid;
    };
  }catch (e){
    console.log("cannot load nodeprof jalangi adapter");
  }

  sandbox.analyses=[];
  sandbox.addAnalysis = function(analysis, filterConfig){
    if(!analysis)
      return;
    sandbox.analyses.push(analysis);
    for(key in analysis){
      if(typeof analysis[key] == 'function'){
        sandbox.adapter.registerCallback(analysis, key, analysis[key]);
      }
    }
    if(!filterConfig) {
      sandbox.adapter.onReady(analysis);
    }else{
      sandbox.adapter.onReady(analysis, filterConfig);
    }
  }
  sandbox.endExecution = function(){
    for(var i = 0; i < sandbox.analyses.length; i++){
      var analysis = sandbox.analyses[i];
      if(analysis.endExecution && (typeof analysis.endExecution == 'function')){
        analysis.endExecution();
      }
    }
  }
  Object.defineProperty(sandbox, 'analysis', {
    get:function () {
      return sandbox.analyses;
    },
    set:function (a) {
      sandbox.addAnalysis(a);
    }
  });
}(J$));

/**
 * @Deprecated J$ fields from Jalangi
 * Should try to avoid using them
 *
 */
(function (sandbox) {
  /* Constant.js */
  var Constants = sandbox.Constants = {};
  Constants.isBrowser = !(typeof exports !== 'undefined' && this.exports !== exports);
  var APPLY = Constants.APPLY = Function.prototype.apply;
  var CALL = Constants.CALL = Function.prototype.call;
  APPLY.apply = APPLY;
  APPLY.call = CALL;
  CALL.apply = APPLY;
  CALL.call = CALL;
  var HAS_OWN_PROPERTY = Constants.HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;
  Constants.HAS_OWN_PROPERTY_CALL = Object.prototype.hasOwnProperty.call;
  var PREFIX1 = Constants.JALANGI_VAR = "J$";
  Constants.SPECIAL_PROP = "*" + PREFIX1 + "*";
  Constants.SPECIAL_PROP2 = "*" + PREFIX1 + "I*";
  Constants.SPECIAL_PROP3 = "*" + PREFIX1 + "C*";
  Constants.SPECIAL_PROP4 = "*" + PREFIX1 + "W*";
  Constants.SPECIAL_PROP_SID = "*" + PREFIX1 + "SID*";
  Constants.SPECIAL_PROP_IID = "*" + PREFIX1 + "IID*";
  Constants.UNKNOWN = -1;
  var HOP = Constants.HOP = function (obj, prop) {
    return (prop + "" === '__proto__') || CALL.call(HAS_OWN_PROPERTY, obj, prop); //Constants.HAS_OWN_PROPERTY_CALL.apply(Constants.HAS_OWN_PROPERTY, [obj, prop]);
  };
  Constants.hasGetterSetter = function (obj, prop, isGetter) {
    if (typeof Object.getOwnPropertyDescriptor !== 'function') {
      return true;
    }
    while (obj !== null) {
      if (typeof obj !== 'object' && typeof obj !== 'function') {
        return false;
      }
      var desc = Object.getOwnPropertyDescriptor(obj, prop);
      if (desc !== undefined) {
        if (isGetter && typeof desc.get === 'function') {
          return true;
        }
        if (!isGetter && typeof desc.set === 'function') {
          return true;
        }
      } else if (HOP(obj, prop)) {
        return false;
      }
      obj = obj.__proto__;
    }
    return false;
  };
  Constants.debugPrint = function (s) {
    if (sandbox.Config.DEBUG) {
      console.log("***" + s);
    }
  };
  Constants.warnPrint = function (iid, s) {
    if (sandbox.Config.WARN && iid !== 0) {
      console.log("        at " + iid + " " + s);
    }
  };
  Constants.seriousWarnPrint = function (iid, s) {
    if (sandbox.Config.SERIOUS_WARN && iid !== 0) {
      console.log("        at " + iid + " Serious " + s);
    }
  };

  var Config = sandbox.Config = {};

  /* Config.js */
  Config.DEBUG = false;
  Config.WARN = false;
  Config.SERIOUS_WARN = false;
  Config.MAX_BUF_SIZE = 64000;
  Config.LOG_ALL_READS_AND_BRANCHES = false;
  Config.ENABLE_SAMPLING = false;

})(J$);



process.on('SIGINT', function(){
  process.exit();
});

process.on('exit', function () { J$.endExecution(); });

path=require('path');
if (process.argv.length < 4) {
  console.log("At least 4 arguments required");
  process.exit(-1);
}

try {
  require(path.resolve(process.argv[2]));
} catch(err) {
  console.log("error loading " + process.argv[2]);
  console.trace(err);
  process.exit(-1);
}

process.argv.splice(1,2);
process.argv[0] = process.argv0
process.execPath = process.argv0

if (process.argv[1] == '-e' || process.argv[1] == '--eval') {
  (function() {
    var script = 'global.__filename = "[eval]";\n' +
                 'global.exports = exports;\n' +
                 'global.module = module;\n' +
                 'global.__dirname = __dirname;\n' +
                 'global.require = require;\n' +
                 'return require("vm").runInThisContext(' +
                 JSON.stringify(process.argv[2]) +
                 ')';
    module._compile(script, '[eval]-wrapper');
  })();
} else {
  process.argv[1] = path.resolve(process.argv[1]);
  require('module').runMain();
}
