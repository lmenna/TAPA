"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExchangeData = getExchangeData;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function getExchangeData(_x) {
  return _getExchangeData.apply(this, arguments);
}

function _getExchangeData() {
  _getExchangeData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(_url) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(resolve, reject) {
                var xmlhttp, method, url;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        xmlhttp = new XMLHttpRequest(), method = "GET", url = _url;
                        xmlhttp.open(method, url, true);

                        xmlhttp.onerror = function () {
                          console.log("** An error occurred retrieving data from ".concat(url));
                          reject(new Error("** An error occurred retrieving data from ".concat(url)));
                          return;
                        };

                        xmlhttp.onreadystatechange = function () {
                          if (this.readyState === 4 && this.status === 200) {
                            var exchangeData = xmlhttp.responseText;
                            var timeStamp = new Date();
                            var exchangeObject = JSON.parse(exchangeData);
                            var returnObj = {
                              timeStamp: timeStamp,
                              exchangeData: exchangeData
                            };
                            resolve(returnObj);
                          }
                        };

                        xmlhttp.send();

                      case 5:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2, _x3) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _getExchangeData.apply(this, arguments);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9nZXRDcnlwdG9EYXRhLmpzIl0sIm5hbWVzIjpbIlhNTEh0dHBSZXF1ZXN0IiwicmVxdWlyZSIsImdldEV4Y2hhbmdlRGF0YSIsIl91cmwiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInhtbGh0dHAiLCJtZXRob2QiLCJ1cmwiLCJvcGVuIiwib25lcnJvciIsImNvbnNvbGUiLCJsb2ciLCJFcnJvciIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJleGNoYW5nZURhdGEiLCJyZXNwb25zZVRleHQiLCJ0aW1lU3RhbXAiLCJEYXRlIiwiZXhjaGFuZ2VPYmplY3QiLCJKU09OIiwicGFyc2UiLCJyZXR1cm5PYmoiLCJzZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUNBLElBQUlBLGNBQWMsR0FBR0MsT0FBTyxDQUFDLGdCQUFELENBQVAsQ0FBMEJELGNBQS9DOztTQUVlRSxlOzs7Ozs7OzBCQUFmLGtCQUErQkMsSUFBL0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDhDQUVTLElBQUlDLE9BQUo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNDQUFZLGlCQUFnQkMsT0FBaEIsRUFBeUJDLE1BQXpCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNiQyx3QkFBQUEsT0FEYSxHQUNILElBQUlQLGNBQUosRUFERyxFQUVmUSxNQUZlLEdBRU4sS0FGTSxFQUdmQyxHQUhlLEdBR1ROLElBSFM7QUFLakJJLHdCQUFBQSxPQUFPLENBQUNHLElBQVIsQ0FBYUYsTUFBYixFQUFxQkMsR0FBckIsRUFBMEIsSUFBMUI7O0FBQ0FGLHdCQUFBQSxPQUFPLENBQUNJLE9BQVIsR0FBa0IsWUFBWTtBQUM1QkMsMEJBQUFBLE9BQU8sQ0FBQ0MsR0FBUixxREFBeURKLEdBQXpEO0FBQ0FILDBCQUFBQSxNQUFNLENBQUMsSUFBSVEsS0FBSixxREFBdURMLEdBQXZELEVBQUQsQ0FBTjtBQUNBO0FBQ0QseUJBSkQ7O0FBS0FGLHdCQUFBQSxPQUFPLENBQUNRLGtCQUFSLEdBQTZCLFlBQVc7QUFDdEMsOEJBQUksS0FBS0MsVUFBTCxLQUFrQixDQUFsQixJQUF1QixLQUFLQyxNQUFMLEtBQWMsR0FBekMsRUFBOEM7QUFDNUMsZ0NBQUlDLFlBQVksR0FBR1gsT0FBTyxDQUFDWSxZQUEzQjtBQUNBLGdDQUFJQyxTQUFTLEdBQUcsSUFBSUMsSUFBSixFQUFoQjtBQUNBLGdDQUFJQyxjQUFjLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXTixZQUFYLENBQXJCO0FBQ0EsZ0NBQUlPLFNBQVMsR0FBRztBQUNkTCw4QkFBQUEsU0FBUyxFQUFUQSxTQURjO0FBRWRGLDhCQUFBQSxZQUFZLEVBQVpBO0FBRmMsNkJBQWhCO0FBSUFiLDRCQUFBQSxPQUFPLENBQUNvQixTQUFELENBQVA7QUFDRDtBQUNGLHlCQVhEOztBQVlBbEIsd0JBQUFBLE9BQU8sQ0FBQ21CLElBQVI7O0FBdkJpQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFaOztBQUFBO0FBQUE7QUFBQTtBQUFBLGdCQUZUOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBYTUxIdHRwUmVxdWVzdCA9IHJlcXVpcmUoXCJ4bWxodHRwcmVxdWVzdFwiKS5YTUxIdHRwUmVxdWVzdDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0RXhjaGFuZ2VEYXRhKF91cmwpIHtcblxuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICBtZXRob2QgPSBcIkdFVFwiLFxuICAgICAgdXJsID0gX3VybDtcblxuICAgIHhtbGh0dHAub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgeG1saHR0cC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coYCoqIEFuIGVycm9yIG9jY3VycmVkIHJldHJpZXZpbmcgZGF0YSBmcm9tICR7dXJsfWApO1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgKiogQW4gZXJyb3Igb2NjdXJyZWQgcmV0cmlldmluZyBkYXRhIGZyb20gJHt1cmx9YCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH07XG4gICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGU9PT00ICYmIHRoaXMuc3RhdHVzPT09MjAwKSB7XG4gICAgICAgIGxldCBleGNoYW5nZURhdGEgPSB4bWxodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGxldCBleGNoYW5nZU9iamVjdCA9IEpTT04ucGFyc2UoZXhjaGFuZ2VEYXRhKTtcbiAgICAgICAgbGV0IHJldHVybk9iaiA9IHtcbiAgICAgICAgICB0aW1lU3RhbXAsXG4gICAgICAgICAgZXhjaGFuZ2VEYXRhXG4gICAgICAgIH07XG4gICAgICAgIHJlc29sdmUocmV0dXJuT2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgeG1saHR0cC5zZW5kKCk7XG4gIH0pO1xufVxuXG5leHBvcnQge2dldEV4Y2hhbmdlRGF0YX07XG4iXX0=