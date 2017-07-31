/**
 * <p>Query helper functions used when doing alot of repetive calling in the api.
 * Alot of queries follow the same strucutre - either you query over a set or search for a specific(id). When you
 * query over a set you usually want to have functions to manipulate the set
 * before you get the data back.</p>
 *
 * We have specified these to:
 * <ul>
 * <li><b>sort</b> - Sorting the incoming data</li>
 * <li><b>result</b> - What attributes should be shown</li>
 * <li><b>find</b> - Find depeding on logic operators as less then and so on</li>
 * </ul>
 * How to use these query see the api documents for more information
 *
 * @module helper/query-helper
 */

/**
 * Express Request
 * @external Request
 * @see {@link http://expressjs.com/api.html#req}
 */

/**
 * Express Response
 * @external Response
 * @see {@link http://expressjs.com/api.html#res}
 */

/**
 * Mongoose schema
 * @external Schema
 * @see {@link http://mongoosejs.com/docs/guide.html}
 */

/**
 * @callback checkVariablesOkCb
 * @param {Boolean} alrighty If the values were correct
 */

/**
 * @callback parseValuesCb
 * @param {Error} err If there is an error while parsing
 * @param {Object[]} values Will return a list of parsed values (see QueryType for what types it'll parse)
 */

var async = require('async')
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var validator = require('validator');
var logger = require('../config/logger').mainLogger

/** Description of the function
 @class
 @alias module:helper/query-helper.QueryType
 */
var QueryType = new Object();
/** Json enum value */
QueryType.JSON = "json"
/** String enum value */
QueryType.STRING = "str"

/**
 * Functions for checking if the variables entered are corrrect. It is basically a
 * method for doing regex check on an array.
 *
 * @alias module:helper/query-helper.checkVariablesOk
 *
 *
 * @param {Object[][]} variables The variables in pairs [[String,regex]]
 * @param {checkVariablesOkCb} cb The callback function
 */
var checkVariablesOk = function (variables, cb) {
  for (var i in variables) {
    var variable = variables[i][0];
    var regex = variables[i][1];
    
    if (variable === undefined) {
      cb(true);
      return;
    }
    
    if (variable.match(regex) != null) {
      cb(false);
      return;
    }
  }
  cb(true);
}

var checkParams = function (req, okParams, cb) {
  
  
  for (var attr in req.query) {
    
    // check to see the attribute is included as legal
    if (okParams[attr] !== undefined) {
      var isOkParam = okParams[attr][0];
      
      if (!isOkParam) {
        return cb(apiMsg.illegalParams + attr);
      }
    }
    
    // if the req.query contains unkowns params
    else {
      //return cb("Unkown param:" + attr);
    }
  }
  
  // iterate over params to check if there is a missing required param
  for (var attr in okParams) {
    var isRequired = okParams[attr][1];
    if (isRequired && req.query[attr] === undefined) {
      return cb(apiMsg.missingParams + attr);
    }
  }
  
  return cb();
}

var checkForValidInput = function (req, okParams, cb) {
  
  for (var attr in req.query) {
    if (okParams[attr] !== undefined) {
      
      var validator = okParams[attr][2];
      var attrVal = req.query[attr];
      
      // loop through if attrVal is array
      if (Array.isArray(attrVal)) {
        for (i in attrVal) {
          if (!validator(attrVal[i])) {
            return cb(apiMsg.errorValidate + attr + " with value=" + attrVal);
          }
        }
      }
      
      // otherwise check single input
      else if (!validator(attrVal)) {
        return cb(apiMsg.errorValidate + attr + " with value=" + attrVal);
      }
    }
  }
  
  return cb();
}

/**
 * Prototype function helping with the parsing of values of different types.
 *
 * @alias module:helper/query-helper.parseValues
 *
 *
 * @param {Object[][]} values The values in pairs [[data,QueryType]];
 * @param {parseValuesCb} cb The callback function
 */
var parseValues = function (values, cb) {
  var returnValues = [];
  for (var i = 0; i < values.length; i++) {
    var valPair = values[i];
    var data = valPair[0];
    var type = valPair[1];
    
    switch (type) {
      case QueryType.STRING:
        returnValues.push(data === undefined ? "" : data);
        break;
      case QueryType.JSON:
        try {
          var jsonData = data === undefined ? {} : JSON.parse(data);
          returnValues.push(jsonData)
        } catch (SyntaxError) {
          return cb(SyntaxError, null);
        }
        break;
    }
  }
  return cb(null, returnValues);
}


/**
 * Prototype function for doing a rest query on result,find and sort data
 *
 * @alias module:helper/query-helper.restQuery
 *
 *
 * @param {external:Request} req The request
 * @param {String} result The result variable
 * @param {Json} find The find variable
 * @param {String} sort The sort variable
 * @param {parseValuesCb} cb The callback function
 */
var restQuery = function (result, find, sort, schema, populate, cb) {
  var query;
  
  if (find === undefined) {
    query = schema.find({})
  } else {
    query = schema.find(find)
  }
  if (result !== undefined) {
    query.select(result)
  }
  if (sort !== undefined) {
    query.sort(sort)
  }
  if (populate !== undefined && populate) {
    query.populate(populate)
  }
  query.exec(function (err, data) {
    cb(err, data);
  })
}

/**
 * Prototype function for parsing the request body with specific find, result and sort values
 *
 * @alias module:helper/query-helper.parseFindResultSort
 *
 *
 * @param {external:Request} req The request
 * @param {parseValuesCb} cb The callback function
 */
var parseFindResultSort = function (req, cb) {
  var find = req.query.find;
  var result = req.query.result;
  var sort = req.query.sort;
  parseValues([[find, QueryType.JSON], [result, QueryType.STRING], [sort, QueryType.STRING]], function (err, values) {
    return cb(err, values)
  });
}


/** This function is used if you want to add special data to the find parameter.
 * @name FindFunction
 * @function
 * @param {Json} find The find query you want to manipulate
 *
 * @example
 * // Find is current searching for user with admin privileges. We want to search for admin but with username Derp.
 * // find = {"admin" : true}
 * FindFunction(find) {find['username'] = "derp"};
 * // find = {"admin" : true,"username" : "derp"}
 *
 *
 *
 */

/**
 * Prototype function for making specific find,result and sort query at the same time.
 * This should be used when you want to make a query over a set and
 * make use of filter, find and sort functions.
 *
 * @alias module:helper/query-helper.doFindResultSortQuery
 *
 *
 * @param {external:Request} req The request
 * @param {external:Response} The response
 * @param {String} result_regex What result should not be included (like password and so on)
 * @param {external:Schema} schema The schema you want the query to be placed on
 * @param {FindFunction} [find_function] If you want to add something to the find function
 */
var doFindResultSortQuery = function (req, res, result_regex, populate, schema, find_function, res_function) {
  var parsedValues;
  
  function parseValues(cb) {
    parseFindResultSort(req, function (err, values) {
      if (err) {
        logger.error(err)
        res.status(400).send({err: "" + err});
        cb(err)
      } else {
        parsedValues = values;
        cb(null)
      }
    })
  }
  
  function execQuery(cb) {
    var find = parsedValues[0];
    if (find_function !== undefined) {
      find_function(find);
    }
    
    var result = parsedValues[1];
    if (res_function !== undefined) {
      res_function(result);
    }
    
    var sort = parsedValues[2];
    checkVariablesOk([result_regex ==
                      null ? [] : [result, result_regex]], function (alrighty) {
      
      //do the rest query
      if (alrighty) {
        restQuery(result, find, sort, schema, populate, function (err, data) {
          if (err) {
            logger.error(err)
            res.status(400).send({err: err});
          } else {
            res.send(data);
          }
          cb(null);
        })
      }
      else {
        res.status(400).send({err: apiMsg.api.hacking});
        cb(apiMsg.api.hacking)
      }
    })
  }
  
  async.series([
    parseValues,
    execQuery
  ])
}

/**
 * Prototype function for making specific id query. This does it all and is therefor and
 * you really dont need to do shiiiiiit. This should be used when you want to make a query
 * over just one item - "FindOne".
 *
 * @alias module:helper/query-helper.doIdQuery
 *
 * @param {external:Request} req The request
 * @param {external:Response} res The response
 * @param {String} id The id the query will be based on
 * @param {String} select_format If you want to exclude or include certain attributes
 * @param {external:Schema} schema The schema you want the query to be placed on
 * @param {String/Json} [populate] If you want to populate from other schema (same as join in SQL)
 */
var doIdQuery = function (req, res, id, select_format, schema, populate) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    var query;
    query = schema.findOne({_id: new ObjectId(id)})
    
    if (populate !== undefined && populate) {
      query.populate(populate)
    }
    
    query.exec(function (err, data) {
      
      if (err) {
        logger.error(err)
        res.status(400).send({err: err})
      }
      
      else {
        res.send(data);
      }
    })
    
  } else {
    res.status(400).send({err: apiMsg.formatFault});
  }
}

module.exports.checkForValidInput = checkForValidInput;
module.exports.checkParams = checkParams;
module.exports.doIdQuery = doIdQuery;
module.exports.restQuery = restQuery;
module.exports.QueryType = QueryType;
module.exports.parseValues = parseValues;
module.exports.checkVariablesOk = checkVariablesOk;
module.exports.parseFindResultSort = parseFindResultSort;
module.exports.doFindResultSortQuery = doFindResultSortQuery;
